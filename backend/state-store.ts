import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { GameState } from '../src/types';

type Snapshot = { state: GameState; deadline: number | null };
const context = new AsyncLocalStorage<Snapshot>();
const stateKey = 'go-mission:game:v1';
const lockKey = `${stateKey}:lock`;
const unlockScript = "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
const saveScript = "if redis.call('get',KEYS[1]) == ARGV[1] then redis.call('set',KEYS[2],ARGV[2],'EX',86400) return 1 else return 0 end";
let memory: Snapshot | null = null;
export function currentGame(): Snapshot {
  const snapshot = context.getStore();
  if (!snapshot) throw new Error('Game state is unavailable outside a request');
  return snapshot;
}
async function redis(command: (string | number)[]): Promise<any> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Shared game storage is not configured');
  const response = await fetch(url, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command), signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error('Shared game storage request failed');
  const data = await response.json();
  if (data.error) throw new Error('Shared game storage command failed');
  return data.result;
}
function updateClock(snapshot: Snapshot) {
  const state = snapshot.state;
  if (!state.timerRunning || !snapshot.deadline) return;
  state.roundTimer = Math.max(0, Math.ceil((snapshot.deadline - Date.now()) / 1000));
  if (state.roundTimer === 0) {
    state.timerRunning = false;
    const team = state.activeTeamId;
    if (team) { state.teams[team].status = 'failed'; state.teams[team].timeUsed = state.maxTimer; }
    state.activeTeamId = null;
    snapshot.deadline = null;
  }
}
export function createStateMiddleware(initial: GameState): RequestHandler {
  return async (req, res, next) => {
    const durable = !!process.env.VERCEL || !!process.env.KV_REST_API_URL || !!process.env.UPSTASH_REDIS_REST_URL;
    const writes = req.method !== 'GET';
    const token = randomUUID();
    let locked = false;
    const originalJson = res.json.bind(res);
    try {
      if (durable && writes) {
        const timeout = Date.now() + 2500;
        do {
          locked = await redis(['SET', lockKey, token, 'NX', 'PX', 15000]) === 'OK';
          if (!locked) await new Promise(resolve => setTimeout(resolve, 50));
        } while (!locked && Date.now() < timeout);
        if (!locked) { res.status(409).json({ error: 'Game is busy. Please try again.' }); return; }
      }
      const stored = durable ? await redis(['GET', stateKey]) : null;
      const snapshot: Snapshot = stored ? JSON.parse(stored) : !durable && memory ? memory : { state: structuredClone(initial), deadline: null };
      updateClock(snapshot);
      res.setHeader('Cache-Control', 'no-store');
      res.json = ((body: any) => {
        void (async () => {
          try {
            if (writes && res.statusCode < 400) {
              if (snapshot.state.timerRunning && (!snapshot.deadline || req.originalUrl.split('?')[0].endsWith('/start'))) {
                snapshot.deadline = Date.now() + snapshot.state.roundTimer * 1000;
              } else if (!snapshot.state.timerRunning) snapshot.deadline = null;
              if (durable) {
                const saved = await redis(['EVAL', saveScript, 2, lockKey, stateKey, token, JSON.stringify(snapshot)]);
                if (saved !== 1) throw new Error('Game update lock expired');
              } else memory = snapshot;
            }
            if (locked) { await redis(['EVAL', unlockScript, 1, lockKey, token]); locked = false; }
            originalJson(body);
          } catch {
            if (locked) await redis(['EVAL', unlockScript, 1, lockKey, token]).catch(() => {});
            res.status(503); originalJson({ error: 'Game storage is unavailable. Please retry.' });
          }
        })();
        return res;
      }) as typeof res.json;
      context.run(snapshot, next);
    } catch {
      if (locked) await redis(['EVAL', unlockScript, 1, lockKey, token]).catch(() => {});
      res.status(503); originalJson({ error: 'Game storage is unavailable. Please retry.' });
    }
  };
}
