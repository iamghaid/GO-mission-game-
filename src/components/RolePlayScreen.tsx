/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Clock, ShieldAlert, AlertTriangle, Users, Volume2, UserCheck } from "lucide-react";

interface RolePlayScreenProps {
  state: GameState;
  teamId: 'blue' | 'red';
  role: 1 | 2 | 3;
  onExit: () => void;
  onRefresh: () => void;
  lang: 'en' | 'ar';
}

export default function RolePlayScreen({ state, teamId, role, onExit, onRefresh, lang }: RolePlayScreenProps) {
  const team = state.teams[teamId];
  
  // Quick background sync loop
  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isMyTeamActive = state.activeTeamId === teamId;
  const isBlue = teamId === 'blue';
  const isRtl = lang === 'ar';

  return (
    <div 
      id="student-role-pad-root" 
      className="max-w-md mx-auto px-4 py-6 text-white font-sans animate-fade-in"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* 1. STATE INSIGNIA HUD */}
      <div className={`p-4 mb-6 rounded-2xl border-4 shadow-lg transition-colors border-slate-900 ${
        isBlue ? "bg-cyan-900 shadow-cyan-950/20" : "bg-pink-900 shadow-pink-950/20"
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">{isBlue ? "🦊" : "🐦‍🔥"}</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-200 font-sans font-extrabold block mb-0.5">
                {isRtl ? "فريقك الحالي:" : "YOUR TEAM:"}
              </span>
              <h1 className="text-base font-black uppercase text-white">
                {isBlue ? (isRtl ? "🦊 فريق الثعلب" : "FOX TEAM 🦊") : (isRtl ? "🐦‍🔥 فريق الطائر" : "PHOENIX TEAM 🐦‍🔥")}
              </h1>
              <div className="text-xs font-black mt-1 text-yellow-300">
                {role === 1 ? (isRtl ? "١. المراقب" : "ROLE 1: OBSERVER") : role === 2 ? (isRtl ? "٢. المتحدث" : "ROLE 2: MESSENGER") : (isRtl ? "٣. المنفذ" : "ROLE 3: EXECUTOR")}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => { sound.playClick(); onExit(); }}
            className="bg-slate-950 hover:bg-slate-900 border-2 border-slate-900 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-300 shadow active:translate-y-0.5 cursor-pointer"
          >
            {isRtl ? "خروج 🚪" : "LEAVE 🚪"}
          </button>
        </div>
      </div>

      {/* 2. TURN WAITING OR ACTIVE VIEW */}
      {!isMyTeamActive ? (
        /* STANDBY BLOCK */
        <div className="bg-slate-905 border-4 border-slate-900 p-8 rounded-[2rem] text-center shadow-md flex flex-col items-center justify-center min-h-[280px]">
          <div className="text-5xl animate-bounce mb-4">⏳</div>
          <h2 className="text-lg font-black text-slate-200 uppercase tracking-wide">
            {isRtl ? "بانتظار دورك ⏰" : "STANDBY STATUS ⏰"}
          </h2>
          
          <div className="space-y-3 mt-4 text-xs leading-relaxed max-w-xs font-bold text-slate-400">
            <p>
              Your teacher will start your team's countdown shortly on the main classroom screen.
            </p>
            {isRtl && (
              <p className="text-yellow-405" dir="rtl">
                سيبدأ معلمك مؤقت دور فريقك قريبًا على شاشة الصف الكبيرة.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE gameplay SCREEN */
        <div className="space-y-6">
          
          {/* TIMER HUD ELEMENT */}
          <div className={`p-4 rounded-2xl flex justify-between items-center border-2 border-slate-900 ${
            state.roundTimer <= 15 ? 'bg-rose-950 animate-pulse text-white' : 'bg-slate-905'
          }`}>
            <span className="text-xs uppercase tracking-wider text-slate-300 font-extrabold flex items-center gap-2">
              <Clock size={15} className="text-yellow-400 animate-spin" />
              {isRtl ? "الوقت المتبقي" : "TIME REMAINING"}
            </span>
            <span className="text-2xl font-black font-mono">
              {state.roundTimer}s
            </span>
          </div>

          {/* ROLE CARD 1: OBSERVER */}
          {role === 1 && (
            <div className="bg-slate-905 border-4 border-slate-900 rounded-[2rem] p-6 space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-xs bg-red-500/20 text-rose-350 border border-red-500/30 px-3 py-1 rounded-full uppercase font-black font-sans tracking-widest block text-center">
                  🤫 {isRtl ? "مراقب سري - ممنوع الكلام!" : "SECRET OBSERVER - NO TALKING!"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                    {isRtl ? "مهمتكم السرية للفوز:" : "YOUR SECRET TEAM MISSION:"}
                  </h4>
                  
                  {/* English Mission Prompt */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 mt-2">
                    <span className="text-[9px] bg-blue-500/20 text-blue-350 px-2 py-0.5 rounded uppercase font-black font-sans">🇬🇧 English</span>
                    <p className="text-sm font-black text-white leading-relaxed mt-2 select-none">
                      {state.currentMission ? state.currentMission.role1_instruction : "Wait for mission..."}
                    </p>
                  </div>

                  {/* Arabic Mission Prompt */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 mt-3" dir="rtl">
                    <span className="text-[9px] bg-yellow-500/20 text-yellow-355 px-2 py-0.5 rounded uppercase font-black font-sans">🇸🇦 العربية</span>
                    <p className="text-sm font-black text-yellow-100 leading-relaxed mt-2 select-none text-right">
                      {state.currentMission ? state.currentMission.role1_instruction_ar : "بانتظار التحديث..."}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[11px] leading-relaxed font-bold text-yellow-405 text-center">
                  <p>💡 Guide your Messenger (Player 2) using silent gestures, hand signs, or nods!</p>
                  {isRtl && <p className="mt-1" dir="rtl">💡 وجّه المتحدث (اللاعب ٢) بالإشارات الصامتة أو لغة الجسد وهز الرأس فقط!</p>}
                </div>
              </div>
            </div>
          )}

          {/* ROLE CARD 2: MESSENGER */}
          {role === 2 && (
            <div className="bg-slate-905 border-4 border-slate-900 rounded-[2rem] p-6 space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full uppercase font-black font-sans tracking-widest block text-center">
                  🗣️ {isRtl ? "المتحدث - مسموح الكلام!" : "MESSENGER - TALK & CALL!"}
                </span>
              </div>

              <div className="space-y-4 text-center">
                <Volume2 size={40} className="mx-auto text-cyan-400 animate-bounce" />
                
                <h3 className="text-md font-black uppercase text-white">
                  {isRtl ? "وجّه زميلك المنفذ!" : "GUIDE YOUR EXECUTOR!"}
                </h3>

                <div className="text-xs leading-relaxed font-bold text-slate-305 text-left space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-900">
                  <p>
                    🇬🇧 Look at your Observer (Player 1) who is gesturing silently. Explain those gestures out loud to your Executor (Player 3) so they perform it!
                  </p>
                  {isRtl && (
                    <p className="text-cyan-305 text-right border-t border-white/5 pt-3 leading-relaxed" dir="rtl">
                      🇸🇦 راقب زميلك المراقب (اللاعب ١) وهو يشير إليك بصمت، وتكلم بصوت مسموع لتوجه المنفذ (اللاعب ٣) لإنجاز المظهر المطلوب في الصف بالسرعة القصوى!
                    </p>
                  )}
                </div>

                <span className="text-[10px] text-rose-450 uppercase tracking-wider font-extrabold block">
                  ⚠️ {isRtl ? "ممنوع النظر لشاشات زملائك!" : "NEVER PEEK AT OTHER SCREENS!"}
                </span>
              </div>
            </div>
          )}

          {/* ROLE CARD 3: EXECUTOR */}
          {role === 3 && (
            <div className="bg-slate-905 border-4 border-slate-900 rounded-[2rem] p-6 text-center space-y-5">
              <div className="w-16 h-16 bg-pink-500/10 text-pink-400 rounded-3xl mx-auto flex items-center justify-center border-2 border-pink-500/20 animate-pulse">
                <AlertTriangle size={28} />
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-black uppercase text-white">
                  {isRtl ? "نفّذ الحركة البدنية فوراً!" : "EXECUTE THE CLASS ACTION!"}
                </h3>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 text-xs text-slate-350 leading-relaxed text-left space-y-3">
                  <p>
                    🇬🇧 Listen closely to your Messenger (Player 2) as they explain the target task. Perform the classroom movement, line-up, or action right away!
                  </p>
                  {isRtl && (
                    <p className="text-pink-355 text-right border-t border-white/5 pt-3 leading-relaxed" dir="rtl">
                      🇸🇦 استمع بانتباه لزميلك المتحدث (اللاعب ٢) وهو يشرح لك المهمة المطلوبة. افعل الحركة وجسدها بنجاح في الفصل لمشاهدة معلمك!
                    </p>
                  )}
                </div>

                <p className="text-[10px] text-emerald-400 font-extrabold select-none p-1">
                  💡 {isRtl ? "عند الانتهاء، انظر لمعلمك ليسجل النقاط!" : "WHEN DONE, LOOK AT THE TEACHER TO SCORE!"}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
