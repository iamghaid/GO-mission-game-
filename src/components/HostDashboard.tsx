/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Play, RotateCcw, Sparkles, User, Clock, Terminal, Share2, Eye, EyeOff, Trophy, ShieldAlert, Cpu } from "lucide-react";

interface HostDashboardProps {
  state: GameState;
  onRefresh: () => void;
}

export default function HostDashboard({ state, onRefresh }: HostDashboardProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [missionType, setMissionType] = useState<'technical' | 'physical'>('technical');
  const [theme, setTheme] = useState('Arcade Space Cabin 🚀');
  const [maxRounds, setMaxRounds] = useState(3);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Added a custom state to hide the secret answer from the host screen to avoid classroom spoilers!
  const [revealSecret, setRevealSecret] = useState(false);

  // Initialize and Reset state
  async function handleInitGame(clearAll: boolean) {
    sound.playClick();
    setIsInitializing(true);
    setRevealSecret(false); // Reset secret privacy shield
    try {
      const res = await fetch("/api/game-state/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          missionType,
          theme,
          maxRounds,
          clearScores: clearAll
        })
      });
      if (res.ok) {
        onRefresh();
        sound.playSuccess();
      }
    } catch (e) {
      sound.playError();
    } finally {
      setIsInitializing(false);
    }
  }

  // Hot Reload AI Mission
  async function handleGenerateAI() {
    sound.playClick();
    setIsGenerating(true);
    setRevealSecret(false); // Mask secret again for safety
    try {
      const res = await fetch("/api/game-state/trigger-ai", {
        method: "POST"
      });
      if (res.ok) {
        onRefresh();
        sound.playSuccess();
      } else {
        sound.playError();
      }
    } catch {
      sound.playError();
    } finally {
      setIsGenerating(false);
    }
  }

  // Force Claim/Toggle a join slot for debug helper
  async function handleClaimSlot(teamId: 'blue' | 'red', role: number) {
    sound.playClick();
    await fetch("/api/game-state/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, role })
    });
    onRefresh();
  }

  // Force Evict a join slot
  async function handleEvictSlot(teamId: 'blue' | 'red', role: number) {
    sound.playClick();
    await fetch("/api/game-state/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, role })
    });
    onRefresh();
  }

  // Start team timer
  async function handleStartTeam(teamId: 'blue' | 'red') {
    sound.playClick();
    await fetch("/api/game-state/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId })
    });
    onRefresh();
  }

  // Manual host score validation for Physical challenges
  async function handleManualOutcome(teamId: 'blue' | 'red', outcome: 'success' | 'fail') {
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

  const joinLink = `${window.location.origin}/#/join`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=ffffff&bgcolor=0f172a&data=${encodeURIComponent(joinLink)}`;

  return (
    <div id="host-dashboard-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto px-4 py-6 relative z-10 animate-fade-in text-white">
      
      {/* LEFT COLUMN: Setup Configuration Panel */}
      <div className="lg:col-span-4 bg-slate-900/95 border-2 border-yellow-400/60 rounded-3xl p-6 shadow-[0_0_25px_rgba(250,204,21,0.15)] flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 blur-2xl rounded-full"></div>
        
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
            <Cpu size={15} className="animate-spin text-yellow-300" />
            <span>Teacher Controls 🏫</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            Setting up the Game
          </h2>
          <p className="text-xs text-slate-300">Set the game rules and start new missions in one click!</p>
        </div>

        {/* INPUTS SECTION */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">🎮 game mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { sound.playClick(); setMissionType("technical"); }}
                className={`py-2 px-3 rounded-xl border-2 font-black text-xs transition duration-200 cursor-pointer ${
                  missionType === "technical"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50"
                }`}
              >
                💻 Grid Game
              </button>
              <button
                onClick={() => { sound.playClick(); setMissionType("physical"); }}
                className={`py-2 px-3 rounded-xl border-2 font-black text-xs transition duration-200 cursor-pointer ${
                  missionType === "physical"
                    ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/50"
                }`}
              >
                🏫 Active Action
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">⭐ difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { sound.playClick(); setDifficulty(d); }}
                  className={`py-1.5 px-2 rounded-xl border-2 capitalize text-xs font-black transition duration-200 cursor-pointer ${
                    difficulty === d
                      ? d === 'easy'
                        ? 'bg-emerald-500/20 text-emerald-350 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                        : d === 'medium'
                        ? 'bg-amber-500/20 text-amber-350 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                        : 'bg-rose-500/20 text-rose-350 border-rose-455 shadow-[0_0_10px_rgba(251,113,133,0.2)]'
                      : 'bg-slate-950/60 text-slate-450 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">🎨 game topic / theme</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Pirates, Space, Science Lab, Animals"
              className="w-full py-2 px-3.5 rounded-xl bg-slate-950 border-2 border-slate-800 text-slate-200 text-xs focus:border-yellow-400 focus:outline-none font-sans font-bold"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleInitGame(true)}
              disabled={isInitializing}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.3)] cursor-pointer uppercase tracking-wider"
            >
              <RotateCcw size={14} className="stroke-slate-950 stroke-[3px]" />
              {isInitializing ? "Creating Game..." : "Create New Mission 🎲"}
            </button>
          </div>
        </div>

        <hr className="border-slate-850" />

        {/* QR CODE BOX */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
          <span className="text-[10px] text-yellow-350 uppercase tracking-widest font-black block text-center mb-2">
            🔗 Scan to Join with Phone
          </span>
          <img
            src={qrCodeUrl}
            alt="Link details"
            referrerPolicy="no-referrer"
            className="w-32 h-32 border-2 border-yellow-400/40 rounded-xl p-1 bg-slate-900 shadow-inner"
          />
          <span className="text-[10px] text-slate-300 mt-2 break-all text-center leading-tight bg-white/5 p-1 rounded-lg border border-slate-800 w-full font-mono">
            {joinLink}
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Game Dashboard */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* CURRENT ACTIVE MISSION CARD */}
        <div className="bg-slate-900/95 border-2 border-cyan-400/50 rounded-3xl p-6 shadow-[0_0_25px_rgba(34,211,238,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-3xl rounded-full"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full font-sans uppercase tracking-wider border border-cyan-400/30 font-black">
                  ⭐ Mode: {state.difficulty} {state.missionType === 'technical' ? 'Grid Game' : 'Action Game'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2 uppercase">
                <Sparkles size={20} className="text-cyan-400" />
                {state.currentMission ? state.currentMission.title : "Ready! Create a mission first"}
              </h2>
            </div>

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="bg-purple-650 hover:bg-purple-600 border-2 border-purple-400/40 disabled:opacity-50 text-white font-black py-1.5 px-4 rounded-xl text-xs transition duration-200 flex items-center gap-1.5 shadow-md hover:shadow-purple-500/20 cursor-pointer"
            >
              <Sparkles size={13} className="text-purple-300" />
              {isGenerating ? "Rewriting with AI..." : "Reroll AI Mission 🔮"}
            </button>
          </div>

          {state.currentMission ? (
            <div className="space-y-4 relative z-10">
              
              {/* Classroom Privacy Shield Banner */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🤫</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-200">Anti-Cheat Privacy Shield</h4>
                    <p className="text-[11px] text-slate-400">Hide answers from your computer screen so students standing nearby can't cheat!</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { sound.playClick(); setRevealSecret(!revealSecret); }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    revealSecret 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  {revealSecret ? (
                    <>
                      <EyeOff size={14} />
                      Hide Cues
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      Show Cues
                    </>
                  )}
                </button>
              </div>

              {/* MISSION INFO BLOCKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Sender Instructs */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl relative min-h-[140px] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block mb-2">
                      🎨 1. Secret Clue for Player 1 (Painter)
                    </span>
                    {revealSecret ? (
                      <p className="text-xs text-slate-200 leading-relaxed font-sans font-bold bg-white/5 p-2.5 rounded-xl border border-white/5">
                        {state.currentMission.role1_instruction}
                      </p>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 text-xs">
                        <ShieldAlert size={20} className="text-slate-600 mb-1" />
                        <span className="font-bold uppercase tracking-wider text-[10px]">[SECRET CLUES HIDDEN]</span>
                        <span className="text-[9px] text-slate-650 mt-0.5">Click "Show Cues" above to view</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Solution Notes / Matrix Grid */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-2">
                      🎯 2. Answer Key for Teacher / Player 2 (Speaker)
                    </span>
                    {revealSecret ? (
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {state.currentMission.solutionNotes}
                      </p>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 text-xs">
                        <ShieldAlert size={20} className="text-slate-600 mb-1" />
                        <span className="font-bold uppercase tracking-wider text-[10px]">[ANSWER KEY HIDDEN]</span>
                        <span className="text-[9px] text-slate-650 mt-0.5">Click "Show Cues" above to view</span>
                      </div>
                    )}
                  </div>

                  {state.currentMission.type === "technical" && state.currentMission.solutionGrid && (
                    <div className="mt-3 pt-3 border-t border-slate-850">
                      <span className="text-[10px] font-bold text-cyan-400 block mb-1.5 uppercase">Target Pattern structure:</span>
                      {revealSecret ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {state.currentMission.solutionGrid.map((val, idx) => (
                             <div
                               key={idx}
                               className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center font-black border transition-colors ${
                                 val ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow shadow-cyan-500/50" : "bg-slate-900 text-slate-600 border-slate-800"
                               }`}
                             >
                               {val ? "✔" : "·"}
                             </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] font-mono text-slate-600">[PATTERN HIDDEN ERROR-GUARDED]</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-950/40 rounded-2xl border-2 border-dashed border-slate-800">
              <Trophy size={40} className="mx-auto text-pink-500/30 mb-2 animate-pulse" />
              <p className="text-slate-300 text-xs font-bold">Please click "Create New Mission 🎲" on the left to start the game!</p>
            </div>
          )}
        </div>

        {/* TEAM STANDS & COCKPIT LOBBIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LOBBY: SQUAD BLUE - CYBER FOXES 🦊 */}
          <div className="bg-slate-900 border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 font-bold text-6xl select-none">🦊</div>
            
            <div>
              <div className="flex justify-between items-center bg-cyan-500/10 border border-cyan-550 py-2.5 px-3.5 rounded-2xl mb-4">
                <h3 className="text-cyan-300 text-xs font-black tracking-wider flex items-center gap-1.5 uppercase">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  Fox Team 🦊
                </h3>
                <span className="text-xl font-black text-cyan-400">{state.teams.blue.score} Points</span>
              </div>

              {/* Player Slot Management */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Players claimed:</span>
                {[1, 2, 3].map((role) => {
                  const occupied = state.teams.blue.players[role];
                  return (
                    <div key={role} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${occupied ? 'bg-cyan-500/25 text-cyan-300' : 'bg-slate-900 text-slate-500'}`}>
                          <User size={13} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">
                            {role === 1 ? "1. Painter (Draws)" : role === 2 ? "2. Speaker (Talks)" : "3. Operator (Clicks)"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {role === 1 ? "Cannot talk!" : role === 2 ? "Explains shape clues" : "Clicks the pattern"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {occupied ? (
                          <button
                            onClick={() => handleEvictSlot("blue", role)}
                            className="bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-500 text-rose-400 px-2 py-0.5 rounded-lg text-[10px] transition duration-150 cursor-pointer font-bold"
                          >
                            Kick out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClaimSlot("blue", role)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 px-2.5 py-0.5 rounded-lg text-[10px] transition duration-150 cursor-pointer font-black"
                          >
                            + Claim
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Battle Control Launch for Blue */}
            <div className="mt-5 pt-4 border-t border-slate-850">
              {state.activeTeamId === "blue" ? (
                <div>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl mb-3 border border-slate-800 animate-pulse">
                    <span className="text-[10px] text-cyan-400 flex items-center gap-1.5 font-bold">
                      <Clock size={12} /> SECONDS LEFT:
                    </span>
                    <span className="font-mono text-xl font-black text-rose-400">{state.roundTimer}s</span>
                  </div>

                  {state.currentMission?.type === "physical" ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleManualOutcome("blue", "success")}
                        className="py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                      >
                        ✓ Correct! 🎉
                      </button>
                      <button
                        onClick={() => handleManualOutcome("blue", "fail")}
                        className="py-2 rounded-xl bg-slate-950 hover:bg-rose-955 text-rose-410 border border-slate-800 text-xs font-bold cursor-pointer"
                      >
                        ✗ Skip Turn ❌
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 bg-slate-950 p-2.5 border border-slate-800 rounded-xl font-bold">
                      Waiting for Team 3 to copy the pattern!
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Status: {state.teams.blue.status}</span>
                    {state.teams.blue.timeUsed > 0 && <span>Time: {state.teams.blue.timeUsed}s</span>}
                  </div>
                  <button
                    onClick={() => handleStartTeam("blue")}
                    disabled={state.activeTeamId !== null}
                    className="w-full py-2 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <Play size={12} className="stroke-slate-950 stroke-[3px]" /> Start Blue Team's Turn! 🦊
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* LOBBY: SQUAD RED - SPACE PHOENIXES 🐦‍🔥 */}
          <div className="bg-slate-900 border-2 border-pink-505 rounded-3xl p-5 shadow-[0_0_20px_rgba(236,72,153,0.15)] flex flex-col justify-between relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-5 font-bold text-6xl select-none font-sans">🐦‍🔥</div>
            
            <div>
              <div className="flex justify-between items-center bg-rose-500/10 border border-rose-550 py-2.5 px-3.5 rounded-2xl mb-4">
                <h3 className="text-rose-300 text-xs font-black tracking-wider flex items-center gap-1.5 uppercase">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                  Bird Team 🐦‍🔥
                </h3>
                <span className="text-xl font-black text-rose-455">{state.teams.red.score} Points</span>
              </div>

              {/* Player Slot Management */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Players claimed:</span>
                {[1, 2, 3].map((role) => {
                  const occupied = state.teams.red.players[role];
                  return (
                    <div key={role} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-855">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${occupied ? 'bg-rose-500/25 text-rose-300' : 'bg-slate-900 text-slate-500'}`}>
                          <User size={13} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">
                            {role === 1 ? "1. Painter (Draws)" : role === 2 ? "2. Speaker (Talks)" : "3. Operator (Clicks)"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {role === 1 ? "Cannot talk!" : role === 2 ? "Explains shape clues" : "Clicks the pattern"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {occupied ? (
                          <button
                            onClick={() => handleEvictSlot("red", role)}
                            className="bg-slate-900 hover:bg-rose-955 border border-slate-800 hover:border-rose-500 text-rose-455 px-2 py-0.5 rounded-lg text-[10px] transition duration-150 cursor-pointer font-bold"
                          >
                            Kick out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClaimSlot("red", role)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 px-2.5 py-0.5 rounded-lg text-[10px] transition duration-150 cursor-pointer font-black"
                          >
                            + Claim
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Battle Control Launch for Red */}
            <div className="mt-5 pt-4 border-t border-slate-855">
              {state.activeTeamId === "red" ? (
                <div>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl mb-3 border border-slate-800 animate-pulse">
                    <span className="text-[10px] text-rose-455 flex items-center gap-1.5 font-bold">
                      <Clock size={12} /> SECONDS LEFT:
                    </span>
                    <span className="font-mono text-xl font-black text-rose-400">{state.roundTimer}s</span>
                  </div>

                  {state.currentMission?.type === "physical" ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleManualOutcome("red", "success")}
                        className="py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                      >
                        ✓ Correct! 🎉
                      </button>
                      <button
                        onClick={() => handleManualOutcome("red", "fail")}
                        className="py-2 rounded-xl bg-slate-950 hover:bg-rose-955 text-rose-410 border border-slate-800 text-xs font-bold cursor-pointer"
                      >
                        ✗ Skip Turn ❌
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 bg-slate-950 p-2.5 border border-slate-800 rounded-xl font-bold">
                      Waiting for Team 3 to copy the pattern!
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-455 font-bold">
                    <span>Status: {state.teams.red.status}</span>
                    {state.teams.red.timeUsed > 0 && <span>Time: {state.teams.red.timeUsed}s</span>}
                  </div>
                  <button
                    onClick={() => handleStartTeam("red")}
                    disabled={state.activeTeamId !== null}
                    className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider animate-pulse shadow-[0_0_15px_rgba(236,72,153,0.25)]"
                  >
                    <Play size={12} className="stroke-slate-950 stroke-[3px]" /> Start Red Team's Turn! 🐦‍🔥
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
