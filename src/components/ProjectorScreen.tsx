/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Clock, Trophy, HelpCircle } from "lucide-react";

interface ProjectorScreenProps {
  state: GameState;
  lang?: 'en' | 'ar';
}

export default function ProjectorScreen({ state, lang = 'en' }: ProjectorScreenProps) {
  // Play warning sounds as the timer gets low
  useEffect(() => {
    if (state.timerRunning && state.roundTimer <= 10 && state.roundTimer > 0) {
      sound.playCountdownTick();
    }
  }, [state.roundTimer, state.timerRunning]);

  const isRtl = lang === 'ar';

  // Quick winner check (usually the host manually flags or when one team leads after games)
  const isBlueWinner = state.teams.blue.score > state.teams.red.score;
  const isRedWinner = state.teams.red.score > state.teams.blue.score;
  const isTie = state.teams.blue.score === state.teams.red.score && state.teams.blue.score > 0;

  return (
    <div 
      id="classroom-projector-view" 
      className="max-w-6xl mx-auto px-4 py-8 flex flex-col justify-between min-h-[calc(100vh-140px)] text-white font-sans animate-fade-in"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* 1. TOP HEADER: CURRENT ROUND */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-slate-900/90 border-4 border-slate-800 px-8 py-3 rounded-2xl shadow-xl">
          <span className="text-base font-black uppercase text-yellow-400 tracking-widest font-mono">
            {isRtl ? `الجولة ${state.currentRound}` : `ROUND ${state.currentRound}`}
          </span>
        </div>
      </div>

      {/* 2. CENTER STAGE: COUNTDOWN TIMER OR WINNER ANNOUNCEMENT OR TURN INDICATOR */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        
        {state.activeTeamId ? (
          /* ACTIVE TEAM COUNTDOWN */
          <div className="w-full text-center space-y-4">
            
            {/* Turn Indicator */}
            <div className="inline-block">
              <span className={`text-2xl md:text-3.5xl font-black uppercase tracking-wider px-10 py-4 rounded-3xl border-4 border-slate-950 shadow-[0_8px_0_#0f172a] animate-pulse block ${
                state.activeTeamId === 'blue'
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-900/30'
                  : 'bg-pink-500 text-slate-950 shadow-pink-900/30'
              }`}>
                {state.activeTeamId === 'blue' 
                  ? (isRtl ? "🦊 دور فريق الثعلب!" : "🦊 TEAM FOX'S TURN!")
                  : (isRtl ? "🐦‍🔥 دور فريق الطائر!" : "🐦‍🔥 TEAM PHOENIX'S TURN!")
                }
              </span>
            </div>

            {/* Huge Glowing Timer */}
            <div className="flex items-center justify-center gap-4 py-8 select-none">
              <span className={`text-[12rem] sm:text-[16rem] font-sans font-black tracking-tight leading-none tabular-nums animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] ${
                state.roundTimer <= 15 ? 'text-rose-500 animate-bounce' : 'text-slate-100'
              }`}>
                {state.roundTimer}
              </span>
              <span className="text-2xl sm:text-4xl font-black text-slate-400 uppercase tracking-wide self-end mb-12">
                {isRtl ? "ثوانٍ" : "SEC"}
              </span>
            </div>

          </div>
        ) : (
          /* IDLE OR GAME OVER WINNER SCREEN */
          <div className="w-full text-center max-w-2xl mx-auto">
            {state.winner || isBlueWinner || isRedWinner || isTie ? (
              /* Winner Announcement */
              <div className="bg-slate-905 border-4 border-yellow-400 p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(250,204,21,0.25)] space-y-6 relative overflow-hidden animate-pulse">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400" />
                
                <Trophy size={100} className="text-yellow-400 mx-auto animate-bounce filter drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
                
                <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-tight">
                  {isTie ? (
                    isRtl ? "🤝 تعادل مستحق!" : "🤝 IT'S A TIE ROUND!"
                  ) : isBlueWinner ? (
                    isRtl ? "👑 فوز فريق الثعلب!" : "👑 FOX TEAM WINS THE ROUND!"
                  ) : (
                    isRtl ? "👑 فوز فريق الطائر!" : "👑 PHOENIX TEAM WINS THE ROUND!"
                  )}
                </h2>
                
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {isRtl ? "تهانينا للفريق الفائز بالجولة!" : "CONGRATULATIONS TO THE VICTORS!"}
                </p>
              </div>
            ) : (
              /* Ready State Indicator */
              <div className="space-y-4 animate-pulse">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                  <span className="text-4xl sm:text-5.5xl font-black text-cyan-400 block tracking-tight uppercase">
                    🦊 {isRtl ? "فريق الثعلب" : "FOX TEAM"}
                  </span>
                  <span className="text-xl font-black text-slate-600 block uppercase">VS</span>
                  <span className="text-4xl sm:text-5.5xl font-black text-pink-400 block tracking-tight uppercase">
                    {isRtl ? "فريق الطائر" : "PHOENIX TEAM"} 🐦‍🔥
                  </span>
                </div>
                
                <div className="py-6" />
                
                <span className="text-2xl font-black text-yellow-350 block uppercase tracking-wider">
                  📢 {isRtl ? "بانتظار انطلاق الجولة..." : "WAITING FOR THE NEXT TURN..."}
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. BOTTOM PANEL: TEAM A SCORE VS TEAM B SCORE */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        
        {/* Team A Score */}
        <div className="bg-slate-905 border-4 border-cyan-500/45 rounded-3xl p-6 text-center shadow-[0_8px_0_#1e1b4b] relative overflow-hidden">
          <div className="absolute top-2 right-4 text-4xl opacity-10 select-none">🦊</div>
          <span className="text-xs sm:text-sm font-black uppercase text-cyan-300 tracking-widest block">
            {isRtl ? "نقاط الثعلب" : "FOX SCORE"}
          </span>
          <span className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white mt-1 block">
            {state.teams.blue.score}
          </span>
        </div>

        {/* Team B Score */}
        <div className="bg-slate-905 border-4 border-pink-500/45 rounded-3xl p-6 text-center shadow-[0_8px_0_#1e1b4b] relative overflow-hidden">
          <div className="absolute top-2 right-4 text-4xl opacity-10 select-none">🐦‍🔥</div>
          <span className="text-xs sm:text-sm font-black uppercase text-pink-300 tracking-widest block">
            {isRtl ? "نقاط الطائر" : "PHOENIX SCORE"}
          </span>
          <span className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white mt-1 block">
            {state.teams.red.score}
          </span>
        </div>

      </div>

    </div>
  );
}
