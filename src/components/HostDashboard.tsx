/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Play, Sparkles, Clock, Eye, EyeOff, ShieldAlert, ArrowLeft, Plus, Minus, RotateCcw } from "lucide-react";

interface HostDashboardProps {
  state: GameState;
  onRefresh: () => void;
  lang?: 'en' | 'ar';
}

export default function HostDashboard({ state, onRefresh, lang = 'en' }: HostDashboardProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timerSetting, setTimerSetting] = useState<number>(90); // default starting state
  const [isInitializing, setIsInitializing] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);

  // Set default initial timer duration on difficulty change locally
  const handleSelectDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    sound.playClick();
    setDifficulty(diff);
    const baseTime = diff === 'easy' ? 60 : (diff === 'medium' ? 90 : 120);
    setTimerSetting(baseTime);
  };

  // Adjust local timer setting
  const adjustTimer = (amount: number) => {
    sound.playClick();
    setTimerSetting((prev) => Math.max(10, prev + amount));
  };

  // Create/Initialize standard mission
  async function handleCreateNewMission() {
    sound.playClick();
    setIsInitializing(true);
    setRevealSecret(false);
    try {
      const res = await fetch("/api/game-state/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          missionType: "physical",
          theme: "Classroom Challenge",
          clearScores: false
        })
      });
      if (res.ok) {
        // Also override max timer duration in backend state
        await fetch("/api/game-state/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            difficulty,
            missionType: "physical",
            theme: "Classroom Challenge",
            clearScores: false
          })
        });
        onRefresh();
        sound.playSuccess();
      }
    } catch (e) {
      sound.playError();
    } finally {
      setIsInitializing(false);
    }
  }

  // Adjust scores manually (+/- 10 pts)
  async function handleAdjustScore(teamId: 'blue' | 'red', amount: number) {
    sound.playClick();
    const currentScore = state.teams[teamId].score;
    const targetScore = Math.max(0, currentScore + amount);
    
    // We can fetch manual score endpoint but with direct overrides
    await fetch("/api/game-state/manual-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        outcome: amount > 0 ? "manual_plus" : "manual_minus"
      })
    });
    onRefresh();
  }

  // Start round timer for a team
  async function handleStartTeamRound(teamId: 'blue' | 'red') {
    sound.playClick();
    // First update the timer setting in backend if needed or just trigger start
    await fetch("/api/game-state/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId })
    });
    onRefresh();
  }

  // Handle final outcome of round
  async function handleOutcome(teamId: 'blue' | 'red', outcome: 'success' | 'fail') {
    if (outcome === 'success') {
      sound.playVictoryTheme();
    } else {
      sound.playError();
    }
    await fetch("/api/game-state/manual-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, outcome })
    });
    onRefresh();
  }

  const isRtl = lang === 'ar';

  return (
    <div 
      id="teacher-panel-root" 
      className="max-w-5xl mx-auto px-4 py-8 relative z-10 animate-fade-in text-white font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* SECTION 1: GIANT KAHOOT-STYLE SCOREBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* BLUE FOX TEAM */}
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-3xl p-6 shadow-[0_8px_0_#0891b2] border-4 border-slate-900 transition-transform active:translate-y-1 relative overflow-hidden">
          <div className="absolute top-2 right-4 text-7xl opacity-10 select-none">🦊</div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                {isRtl ? "فريق الثعلب" : "FOX TEAM"}
              </span>
              <h3 className="text-4xl font-extrabold tracking-tight mt-1 text-white">
                {state.teams.blue.score} <span className="text-xl opacity-80">{isRtl ? "نقطة" : "PTS"}</span>
              </h3>
            </div>
            
            {/* MANUAL ADJUSTMENTS */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdjustScore("blue", -10)}
                className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center font-black cursor-pointer shadow border border-slate-800"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustScore("blue", 10)}
                className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center font-black cursor-pointer shadow border border-slate-800"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* RED PHOENIX TEAM */}
        <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-3xl p-6 shadow-[0_8px_0_#db2777] border-4 border-slate-900 transition-transform active:translate-y-1 relative overflow-hidden">
          <div className="absolute top-2 right-4 text-7xl opacity-10 select-none">🐦‍🔥</div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-pink-200">
                {isRtl ? "فريق الطائر" : "PHOENIX TEAM"}
              </span>
              <h3 className="text-4xl font-extrabold tracking-tight mt-1 text-white">
                {state.teams.red.score} <span className="text-xl opacity-80">{isRtl ? "نقطة" : "PTS"}</span>
              </h3>
            </div>
            
            {/* MANUAL ADJUSTMENTS */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdjustScore("red", -10)}
                className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center font-black cursor-pointer shadow border border-slate-800"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustScore("red", 10)}
                className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center font-black cursor-pointer shadow border border-slate-800"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: SETTINGS (DIFFICULTY, TIMER & NEW GAME TRIGGER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* DIFFICULTY SELECTOR */}
        <div className="lg:col-span-4 bg-slate-905 border-4 border-slate-900 rounded-[2rem] p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">
              ⭐ {isRtl ? "درجة الصعوبة" : "DIFFICULTY LEVEL"}
            </span>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectDifficulty('easy')}
                className={`w-full py-3 px-4 rounded-2xl font-black text-sm uppercase transition border-b-4 text-center cursor-pointer ${
                  difficulty === 'easy'
                    ? "bg-emerald-500 text-slate-950 border-emerald-700 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-950 hover:bg-slate-850"
                }`}
              >
                🟢 {isRtl ? "سهل" : "EASY"}
              </button>
              <button
                type="button"
                onClick={() => handleSelectDifficulty('medium')}
                className={`w-full py-3 px-4 rounded-2xl font-black text-sm uppercase transition border-b-4 text-center cursor-pointer ${
                  difficulty === 'medium'
                    ? "bg-amber-500 text-slate-950 border-amber-700 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-950 hover:bg-slate-850"
                }`}
              >
                🟡 {isRtl ? "متوسط" : "MEDIUM"}
              </button>
              <button
                type="button"
                onClick={() => handleSelectDifficulty('hard')}
                className={`w-full py-3 px-4 rounded-2xl font-black text-sm uppercase transition border-b-4 text-center cursor-pointer ${
                  difficulty === 'hard'
                    ? "bg-rose-500 text-slate-900 border-rose-700 shadow-md"
                    : "bg-slate-900 text-slate-400 border-slate-950 hover:bg-slate-850"
                }`}
              >
                🔴 {isRtl ? "صعب" : "HARD"}
              </button>
            </div>
          </div>
        </div>

        {/* TIMER ADJUSTMENT */}
        <div className="lg:col-span-4 bg-slate-905 border-4 border-slate-900 rounded-[2rem] p-6 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">
              ⏱️ {isRtl ? "مؤقت الجولة" : "TIMER PRESET"}
            </span>
            
            <div className="bg-slate-950 w-full py-6 rounded-2xl border-2 border-slate-900 flex items-center justify-around">
              <button
                type="button"
                onClick={() => adjustTimer(-10)}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-850 border-b-4 border-slate-950 active:translate-y-0.5 text-rose-450 font-black text-xl flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              
              <div className="flex flex-col">
                <span className="text-4xl font-mono font-black text-slate-100">
                  {timerSetting}s
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">
                  {isRtl ? "مدة جولة اللعب" : "PLAYTIME LIMIT"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => adjustTimer(10)}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-850 border-b-4 border-slate-950 active:translate-y-0.5 text-emerald-450 font-black text-xl flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* CREATE MISSION BUTTON */}
        <div className="lg:col-span-4 flex flex-col justify-stretch">
          <button
            type="button"
            onClick={handleCreateNewMission}
            disabled={isInitializing}
            className="w-full h-full min-h-[140px] bg-gradient-to-r from-yellow-450 to-amber-500 hover:from-yellow-400 hover:to-amber-450 text-slate-950 border-4 border-slate-950 shadow-[0_8px_0_#92400e] hover:shadow-[0_4px_0_#92400e] rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all active:translate-y-1 active:shadow-[0_2px_0_#92400e] cursor-pointer"
          >
            <Sparkles size={36} className="text-slate-900 animate-bounce" />
            <span className="text-xl font-black uppercase tracking-tight">
              {isInitializing ? (isRtl ? "جاري الإنشاء..." : "CREATING...") : (isRtl ? "إنشاء مهمة جديدة 🎲" : "NEW MISSION 🎲")}
            </span>
          </button>
        </div>

      </div>

      {/* SECTION 3: MISSION PREVIEW & CONTROLLER */}
      {state.currentMission ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* CURRENT MISSION PREVIEW CARD */}
          <div className="md:col-span-7 bg-slate-905 border-4 border-slate-900 rounded-[2.5rem] p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <span className="text-xs bg-cyan-400/20 text-cyan-300 px-3.5 py-1.5 rounded-full uppercase tracking-wider font-black font-mono border border-cyan-400/30">
                🚀 {isRtl ? "المهمة المحددة" : "CURRENT MISSION"}
              </span>
              
              <button
                type="button"
                onClick={() => { sound.playClick(); setRevealSecret(!revealSecret); }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 cursor-pointer border ${
                  revealSecret 
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/25" 
                    : "bg-emerald-500/10 text-emerald-355 border-emerald-500/25"
                }`}
              >
                {revealSecret ? (
                  <>
                    <EyeOff size={13} />
                    {isRtl ? "إخفاء الحل" : "HIDE ANSWER"}
                  </>
                ) : (
                  <>
                    <Eye size={13} />
                    {isRtl ? "إظهار الحل" : "SHOW ANSWER"}
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  {isRtl ? "اسم المهمة" : "MISSION TITLE"}
                </h4>
                <p className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  {lang === 'ar' ? state.currentMission.title_ar : state.currentMission.title}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mt-3">
                  {isRtl ? "التعليمات السرية للمراقب" : "OBSERVER'S SECRET INSTRUCTION"}
                </h4>
                {revealSecret ? (
                  <p className="text-base text-cyan-300 p-4 rounded-2xl bg-cyan-950/20 border-2 border-cyan-500/20 font-bold mt-1 select-none leading-relaxed">
                    {lang === 'ar' ? state.currentMission.role1_instruction_ar : state.currentMission.role1_instruction}
                  </p>
                ) : (
                  <div className="py-8 bg-slate-950/65 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center mt-1 text-slate-500">
                    <ShieldAlert size={24} className="mb-1 text-slate-600" />
                    <span className="text-[11px] font-black uppercase tracking-wider">{isRtl ? "[التفاصيل السرية محجوبة]" : "[SECRET INSTRUCTION HIDDEN]"}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mt-3">
                  {isRtl ? "ملاحظة التقييم للمعلم" : "TEACHER ANSWER KEY"}
                </h4>
                {revealSecret ? (
                  <p className="text-xs text-slate-300 font-sans font-bold leading-normal mt-1">
                    {lang === 'ar' ? state.currentMission.solutionNotes_ar : state.currentMission.solutionNotes}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest italic mt-1 block">
                    {isRtl ? "[ملاحظة التأكيد محجوبة]" : "[SOLUTION CHECKLIST HIDDEN]"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE TURN CONTROLLER */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* NO ROUND RUNNING - START ROUNDS BUTTONS */}
            {state.activeTeamId === null ? (
              <div className="bg-slate-905 border-4 border-slate-900 rounded-[2.5rem] p-6 flex-1 flex flex-col justify-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 text-center mb-4 block">
                  🎮 {isRtl ? "ابدأ جولة فريق" : "START TEAM TURN"}
                </span>

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => handleStartTeamRound("blue")}
                    className="w-full py-4 px-6 bg-cyan-500 hover:bg-cyan-450 border-4 border-slate-950 shadow-[0_6px_0_#0891b2] hover:shadow-[0_4px_0_#0891b2] text-slate-950 font-black text-sm uppercase rounded-2xl flex items-center justify-center gap-2 transition active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    <Play size={14} className="stroke-[3px]" /> 
                    {isRtl ? "بدأ جولة فريق الثعلب 🦊" : "START FOXES (BLUE) 🦊"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartTeamRound("red")}
                    className="w-full py-4 px-6 bg-pink-500 hover:bg-pink-450 border-4 border-slate-950 shadow-[0_6px_0_#db2777] hover:shadow-[0_4px_0_#db2777] text-slate-950 font-black text-sm uppercase rounded-2xl flex items-center justify-center gap-2 transition active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    <Play size={14} className="stroke-[3px]" /> 
                    {isRtl ? "بدأ جولة فريق الطائر 🐦‍🔥" : "START PHOENIXES (RED) 🐦‍🔥"}
                  </button>
                </div>
              </div>
            ) : (
              /* ROUND RUNNING - TIMER & SCORING OPTIONS */
              <div className="bg-slate-905 border-4 border-slate-900 rounded-[2.5rem] p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className={`p-3 rounded-2xl text-center mb-4 ${
                    state.activeTeamId === 'blue' ? 'bg-cyan-500/10 text-cyan-300' : 'bg-pink-500/10 text-pink-300'
                  }`}>
                    <span className="text-[11px] font-black uppercase tracking-widest block">
                      {isRtl ? "الفريق الذي يلعب جيرل حاليًا:" : "CURRENT RUNNING TURN:"}
                    </span>
                    <span className="text-lg font-black uppercase mt-1 block">
                      {state.activeTeamId === 'blue' 
                        ? (isRtl ? "🦊 فريق الثعلب" : "🦊 FOX TEAM BLUE") 
                        : (isRtl ? "🐦‍🔥 فريق الطائر" : "🐦‍🔥 PHOENIX TEAM RED")
                      }
                    </span>
                  </div>

                  {/* PULSING TIME DISPLAY */}
                  <div className="bg-slate-950 border-2 border-slate-905 p-6 rounded-2xl text-center animate-pulse">
                    <span className="text-[10px] text-rose-450 font-black uppercase tracking-wider block">
                      {isRtl ? "الوقت المتبقي" : "TIME REMAINING"}
                    </span>
                    <span className="text-5xl font-mono font-black text-rose-500 mt-1 block">
                      {state.roundTimer}s
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOutcome(state.activeTeamId!, 'success')}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 border-4 border-slate-950 shadow-[0_6px_0_#047857] hover:shadow-[0_3px_0_#047857] hover:opacity-95 text-slate-950 font-black text-sm uppercase flex items-center justify-center gap-2 transition active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    ✓ {isRtl ? "إجابة صحيحة (+10) 🎉" : "CORRECT (+10) 🎉"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOutcome(state.activeTeamId!, 'fail')}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border-b-4 border-slate-950 active:translate-y-0.5 text-rose-410 font-bold text-xs uppercase cursor-pointer text-center block"
                  >
                    ✗ {isRtl ? "تخطي / لم ينجح" : "SKIP / FAIL ROUND"}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* SETUP INVITATION SCREEN */
        <div className="text-center py-20 bg-slate-905 border-4 border-dashed border-slate-800 rounded-3xl">
          <Sparkles size={48} className="mx-auto text-yellow-400 mb-4 animate-bounce" />
          <h3 className="text-2xl font-black">{isRtl ? "بانتظار بدء اللعبة!" : "READY TO ROLL?"}</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto font-bold font-sans">
            {isRtl ? "اضغط على زر 'إنشاء مهمة جديدة' بالأعلى لبدء الفعاليات فورًا!" : "Click 'NEW MISSION' above to trigger the classroom challenge layout!"}
          </p>
        </div>
      )}

    </div>
  );
}
