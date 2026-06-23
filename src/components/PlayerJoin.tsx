/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Users, UserCheck, Zap } from "lucide-react";

interface PlayerJoinProps {
  state: GameState;
  onSelectSlot: (teamId: 'blue' | 'red', role: 1 | 2 | 3) => void;
  onRefresh: () => void;
}

export default function PlayerJoin({ state, onSelectSlot, onRefresh }: PlayerJoinProps) {
  
  function handleSelect(teamId: 'blue' | 'red', role: 1 | 2 | 3) {
    sound.playSuccess();
    onSelectSlot(teamId, role);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 text-white font-sans relative z-10 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-405 to-amber-500 text-slate-950 rounded-3xl mx-auto flex items-center justify-center border-2 border-white/25 mb-4 shadow-[0_0_20px_rgba(250,204,21,0.25)] animate-pulse">
          <Zap size={28} className="fill-slate-950 stroke-slate-950" />
        </div>
        <h1 className="text-2xl font-black tracking-tight uppercase">Choose Your Team 🎮</h1>
        <p className="text-xs text-slate-350 mt-1 font-bold">Pick a team below and select a role to join the game!</p>
      </div>

      <div className="space-y-6 font-sans">
        
        {/* BLUE TEAM - CYBER FOXES 🦊 */}
        <div className="bg-slate-900 border-2 border-cyan-405 rounded-3xl p-5 shadow-[0_0_15px_rgba(34,211,238,0.15)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-cyan-500/10 blur-xl rounded-full"></div>
          <div className="absolute right-3 top-3 opacity-15 font-bold text-4xl select-none">🦊</div>
          
          <div className="flex justify-between items-center mb-4 border-b border-cyan-500/10 pb-3">
            <h2 className="text-cyan-300 font-black tracking-wide text-sm uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
              Fox Team 🦊
            </h2>
            <span className="text-xs font-black text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              {state.teams.blue.score} Points
            </span>
          </div>

          <div className="space-y-3">
            {([1, 2, 3] as const).map((role) => {
              const occupied = state.teams.blue.players[role];
              return (
                <button
                  key={role}
                  onClick={() => handleSelect('blue', role)}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    occupied 
                      ? "bg-slate-950 border-slate-950 opacity-40 cursor-not-allowed text-slate-500" 
                      : "bg-slate-950/65 border-slate-800 hover:border-cyan-400/50 hover:bg-slate-900/50"
                  }`}
                  disabled={!!occupied}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      occupied ? "bg-slate-950 text-slate-650" : "bg-cyan-500/10 text-cyan-300 group-hover:bg-cyan-500/20"
                    }`}>
                      {occupied ? <UserCheck size={15} /> : <Users size={15} />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">
                        {role === 1 ? "1. Painter (Draws)" : role === 2 ? "2. Speaker (Talks)" : "3. Operator (Clicks)"}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                        {role === 1 ? "Draw cues for your teammates. No talking!" : role === 2 ? "Explain current drawings out loud!" : "Tap the matching square pattern!"}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`text-[9px] px-2.5 py-1.5 rounded-xl font-bold ${
                    occupied ? "bg-slate-800 text-slate-500" : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 group-hover:bg-cyan-400 group-hover:text-slate-950"
                  }`}>
                    {occupied ? "FULL" : "JOIN SLOT"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RED TEAM - SPACE PHOENIXES 🐦‍🔥 */}
        <div className="bg-slate-900 border-2 border-pink-405 rounded-3xl p-5 shadow-[0_0_15px_rgba(236,72,153,0.15)] relative overflow-hidden animate-fade-in">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 blur-xl rounded-full"></div>
          <div className="absolute right-3 top-3 opacity-15 font-bold text-4xl select-none font-sans">🐦‍🔥</div>

          <div className="flex justify-between items-center mb-4 border-b border-rose-500/10 pb-3">
            <h2 className="text-rose-300 font-black tracking-wide text-sm uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
              Bird Team 🐦‍🔥
            </h2>
            <span className="text-xs font-black text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
              {state.teams.red.score} Points
            </span>
          </div>

          <div className="space-y-3">
            {([1, 2, 3] as const).map((role) => {
              const occupied = state.teams.red.players[role];
              return (
                <button
                  key={role}
                  onClick={() => handleSelect('red', role)}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    occupied 
                      ? "bg-slate-950 border-slate-950 opacity-40 cursor-not-allowed text-slate-500" 
                      : "bg-slate-950/65 border-slate-800 hover:border-pink-400/50 hover:bg-slate-900/50"
                  }`}
                  disabled={!!occupied}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      occupied ? "bg-slate-950 text-slate-650" : "bg-rose-500/10 text-rose-300 group-hover:bg-rose-500/20"
                    }`}>
                      {occupied ? <UserCheck size={15} /> : <Users size={15} />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">
                        {role === 1 ? "1. Painter (Draws)" : role === 2 ? "2. Speaker (Talks)" : "3. Operator (Clicks)"}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                        {role === 1 ? "Draw cues for your teammates. No talking!" : role === 2 ? "Explain current drawings out loud!" : "Tap the matching square pattern!"}
                      </p>
                    </div>
                  </div>

                  <div className={`text-[9px] px-2.5 py-1.5 rounded-xl font-bold ${
                    occupied ? "bg-slate-800 text-slate-500" : "bg-rose-500/20 text-rose-300 border border-rose-455/30 group-hover:bg-rose-500 group-hover:text-slate-950"
                  }`}>
                    {occupied ? "FULL" : "JOIN SLOT"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="text-center mt-8">
        <button
          onClick={onRefresh}
          className="text-xs font-bold text-yellow-400 hover:text-yellow-300 underline transition cursor-pointer"
        >
          Refresh Page 🔄
        </button>
      </div>
    </div>
  );
}
