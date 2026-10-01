import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

process.env.VERCEL = '1';
process.env.KV_REST_API_URL = 'https://redis.example.test';
process.env.KV_REST_API_TOKEN = 'test-token';
const realFetch = globalThis.fetch;
const values = new Map<string, string>();
globalThis.fetch = async (input, init) => {
  if (String(input) !== process.env.KV_REST_API_URL) return realFetch(input, init);
  const [operation, ...args] = JSON.parse(String(init?.body));
  let result: unknown = null;
  if (operation === 'GET') result = values.get(args[0]) ?? null;
  if (operation === 'SET' && (!args.includes('NX') || !values.has(args[0]))) {
    values.set(args[0], args[1]); result = 'OK';
  }
  if (operation === 'EVAL') {
    const [, count, key, ...rest] = args;
    if (count === 2) {
      const [stateKey, token, snapshot] = rest;
      result = values.get(key) === token ? 1 : 0;
      if (result) values.set(stateKey, snapshot);
    } else {
      result = values.get(key) === rest[0] ? 1 : 0;
      if (result) values.delete(key);
    }
  }
  return new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } });
};
const { default: app } = await import('../server');
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address() as { port: number };
const origin = `http://127.0.0.1:${address.port}`;
async function post(route: string, body: unknown) {
  return realFetch(`${origin}/api/game-state/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
test('Vercel migration retains shared roles and deadline-based rounds without Google', async () => {
  try {
    const init = await post('init', { difficulty: 'easy', missionType: 'physical', theme: 'Classroom', clearScores: true });
    assert.equal(init.status, 200);
    const initialized = await init.json();
    assert.ok(initialized.gameState.currentMission.role1_instruction_ar);
    assert.ok(values.has('go-mission:game:v1'));
    const results = await Promise.all([post('join', { teamId: 'blue', role: 1 }), post('join', { teamId: 'blue', role: 2 })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 200]);
    const state = await (await realFetch(`${origin}/api/game-state`)).json();
    assert.equal(state.teams.blue.players[1], true);
    assert.equal(state.teams.blue.players[2], true);
    assert.equal((await post('start', { teamId: 'blue' })).status, 200);
    const stored = JSON.parse(values.get('go-mission:game:v1')!);
    assert.ok(stored.deadline > Date.now());
    stored.deadline = Date.now() - 1000;
    values.set('go-mission:game:v1', JSON.stringify(stored));
    const expired = await (await realFetch(`${origin}/api/game-state`)).json();
    assert.equal(expired.roundTimer, 0);
    assert.equal(expired.timerRunning, false);
    assert.equal(expired.teams.blue.status, 'failed');
    delete process.env.KV_REST_API_TOKEN;
    assert.equal((await realFetch(`${origin}/api/game-state`)).status, 503);
  } finally {
    server.close(); globalThis.fetch = realFetch;
  }
});
