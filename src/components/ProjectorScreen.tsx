/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Clock, Trophy, Disc, Users, ShieldAlert, Wifi, Sparkles, AlertCircle } from "lucide-react";

interface ProjectorScreenProps {
  state: GameState;
}

export default function ProjectorScreen({ state }: ProjectorScreenProps) {
  // Synthesize alerts on timer countdown milestones
  useEffect(() => {
    if (state.timerRunning && state.roundTimer <= 10 && state.roundTimer > 0) {
      sound.playCountdownTick();
    }
  }, [state.roundTimer, state.timerRunning]);

  const joinUrl = `${window.location.origin}/#/join`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=ffffff&bgcolor=020617&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-white font-sans relative z-10 animate-fade-in">
      
      {/* COCKPIT STATUS & LIVE ACTION PANEL */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* BIG STATUS HERO AREA */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-yellow-400/50 rounded-3xl p-8 shadow-[0_0_40px_rgba(250,204,21,0.15)] relative overflow-hidden flex flex-col justify-between min-h-[420px]">
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-rose-500/10 blur-3xl rounded-full"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-ping"></span>
                <span className="text-xs uppercase tracking-wider text-yellow-300 font-sans font-black bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                  Game Dashboard 📺
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mt-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-white to-pink-400 uppercase select-none">
                The Silent Game 🤫
              </h1>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-2xl px-4 py-1.5 border border-white/10 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Game level</span>
              <span className={`text-sm font-black uppercase ${
                state.difficulty === 'hard' ? 'text-rose-400' : state.difficulty === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                ⚡ {state.difficulty}
              </span>
            </div>
          </div>

          {/* DYNAMIC TIMERS & STAGE VIEW */}
          <div className="my-8 flex flex-col items-center justify-center text-center py-6 relative z-15">
            {state.activeTeamId ? (
              <div className="space-y-4 w-full font-sans">
                <div className="inline-block">
                  <span className={`text-base uppercase tracking-wider px-6 py-2.5 rounded-2xl font-black animate-pulse shadow-lg ${
                    state.activeTeamId === 'blue' 
                      ? 'bg-cyan-500/20 text-cyan-350 border-2 border-cyan-400/50 shadow-cyan-500/20' 
                      : 'bg-rose-500/20 text-pink-350 border-2 border-pink-400/50 shadow-pink-500/20'
                  }`}>
                    ⚔️ NOW PLAYING: {state.activeTeamId === 'blue' ? "Fox Team 🦊" : "Bird Team 🐦‍🔥"}
                  </span>
                </div>
                
                {/* BIG CLOCK TIMER */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className={`text-9xl font-black font-sans tracking-tighter tabular-nums ${
                    state.roundTimer <= 15 ? 'text-rose-550 animate-bounce' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                  }`}>
                    {state.roundTimer}
                  </div>
                  <span className="text-2xl font-black text-slate-400 uppercase self-end mb-6">Sec</span>
                </div>

                <div className="bg-slate-900/90 border-2 border-slate-800 px-6 py-3.5 rounded-2.5xl inline-block max-w-md mx-auto text-xs font-bold leading-normal">
                  {state.missionType === 'technical' 
                    ? "💻 Grid Mission: Driver (Role 3) is tapping matching squares based on drawings!"
                    : "🏫 Active Mission: Follow the guidelines in total silence!"
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {state.winner ? (
                  <div className="space-y-3 p-6 bg-white/5 border border-white/10 rounded-2xl max-w-lg mx-auto">
                    <Trophy size={60} className="text-yellow-400 mx-auto animate-bounce" />
                    <h2 className="text-4xl font-black text-yellow-300 tracking-tight uppercase">
                      {state.winner === 'draw' 
                        ? "🤝 TIE GAME!" 
                        : `👑 ${state.winner === 'blue' ? 'FOX' : 'BIRD'} TEAM WINS!`
                      }
                    </h2>
                    <p className="text-slate-200 text-xs font-bold max-w-sm mx-auto">
                      {state.winner === 'draw'
                        ? "Both teams did super well!"
                        : `Awesome job to the ${state.winner === 'blue' ? 'Fox Team 🦊' : 'Bird Team 🐦‍🔥'} for working quietly!`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex justify-center items-center gap-6">
                      <span className="text-7xl animate-bounce">01. Fox 🦊</span>
                      <span className="text-3xl font-black text-slate-500">VS</span>
                      <span className="text-7xl animate-bounce">02. Bird 🐦‍🔥</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">READY TO START</h3>
                    <p className="text-xs text-slate-350 max-w-sm mx-auto font-bold leading-relaxed">
                      Teacher: Pick a fun mission of your choice and tap "Start Team's Turn" to run the clock!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOWER RUNTIME TELEMETRIES */}
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between text-xs text-slate-400 font-bold gap-4 z-10">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-yellow-400" />
              <span>GAME MODE: {state.missionType === 'technical' ? "Grid Game 💻" : "Active Action Game 🏫"}</span>
            </div>
            <div>
              <span>SOUND EFFECTS: READY 🔊</span>
            </div>
          </div>
        </div>

        {/* TEAM STANDING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Blue Cyber Foxes 🦊 */}
          <div className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden ${
            state.activeTeamId === 'blue' 
              ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/20' 
              : 'bg-slate-900/60 border-cyan-500/20'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-7xl select-none">🦊</div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-cyan-400 text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block"></span>
                Fox Team 🦊
              </span>
              <span className="text-3xl font-black text-cyan-400">{state.teams.blue.score} Points</span>
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-cyan-500/10 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Connected players:</span>
                <span className="text-slate-200">
                  {Object.values(state.teams.blue.players).filter(Boolean).length} / 3 Joined
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Turn Status:</span>
                <span className="text-cyan-400 uppercase">
                  {state.teams.blue.status}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Time Taken:</span>
                <span className="text-slate-200">
                  {state.teams.blue.timeUsed > 0 ? `${state.teams.blue.timeUsed}s` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Red Space Phoenixes 🐦‍🔥 */}
          <div className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden ${
            state.activeTeamId === 'red' 
              ? 'bg-rose-950/40 border-rose-455 shadow-[0_0_25px_rgba(244,63,94,0.3)] ring-1 ring-rose-400/20' 
              : 'bg-slate-900/60 border-rose-500/20'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-7xl select-none font-sans">🐦‍🔥</div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-rose-400 text-sm font-black uppercase tracking-wider flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                Bird Team 🐦‍🔥
              </span>
              <span className="text-3xl font-black text-rose-400 font-bold">{state.teams.red.score} Points</span>
            </div>
 
            <div className="space-y-2 mt-4 pt-4 border-t border-rose-500/10 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Connected players:</span>
                <span className="text-slate-200">
                  {Object.values(state.teams.red.players).filter(Boolean).length} / 3 Joined
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Turn Status:</span>
                <span className="text-rose-400 uppercase">
                  {state.teams.red.status}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Time Taken:</span>
                <span className="text-slate-200">
                  {state.teams.red.timeUsed > 0 ? `${state.teams.red.timeUsed}s` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CONNECTION AND QR PORTAL */}
      <div className="lg:col-span-4 bg-slate-900/90 border-2 border-yellow-400/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-6 relative">
        <div className="space-y-2">
          <div className="bg-yellow-500/10 px-4 py-1.5 rounded-xl border border-yellow-500/20 inline-block font-sans">
            <h2 className="text-xs font-black text-yellow-400 flex items-center gap-1.5 uppercase">
              <Wifi size={14} className="text-yellow-400" />
              Easy Scan to Join! 📱
            </h2>
          </div>
          <p className="text-xs text-slate-350 leading-relaxed font-sans mt-1 font-bold">
            Scan this QR code with your phone camera to join the game right now!
          </p>
        </div>

        {/* QR Code Frame */}
        <div className="my-2 flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-2xl relative shadow-inner">
          <img
            src={qrCodeUrl}
            alt="Join QR Code"
            referrerPolicy="no-referrer"
            className="w-40 h-40 border-2 border-yellow-405 rounded-xl bg-slate-950 p-1 shadow-[0_0_15px_rgba(250,204,21,0.15)]"
          />
          <div className="mt-4 text-center w-full">
            <span className="text-[10px] text-yellow-300 uppercase tracking-wider block font-bold">Or type this web address:</span>
            <span className="text-xs font-sans text-slate-200 select-all font-bold block mt-1 break-all bg-white/5 p-2 rounded-xl border border-white/5">
              {joinUrl}
            </span>
          </div>
        </div>

        <div className="bg-white/5 p-4 border border-white/10 rounded-2xl space-y-2 text-[10px] text-slate-300">
          <span className="text-yellow-400 uppercase tracking-wider block font-black">How to Play:</span>
          <div className="space-y-1.5 font-bold">
            <p><b className="text-cyan-300">Player 1: Painter</b> - Mute drawing or gesture helper.</p>
            <p><b className="text-amber-300">Player 2: Speaker</b> - Explains Painter's drawing out loud.</p>
            <p><b className="text-rose-300">Player 3: Operator</b> - Solves the grid keys on screen!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
