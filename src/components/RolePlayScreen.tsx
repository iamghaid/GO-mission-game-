/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { GameState, DrawPoint } from "../types";
import { sound } from "./AudioEngine";
import { Clock, ShieldAlert, Paintbrush, Trash2, Mic, AlertTriangle, User } from "lucide-react";

interface RolePlayScreenProps {
  state: GameState;
  teamId: 'blue' | 'red';
  role: 1 | 2 | 3;
  onExit: () => void;
  onRefresh: () => void;
}

export default function RolePlayScreen({ state, teamId, role, onExit, onRefresh }: RolePlayScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<DrawPoint[]>([]);
  const team = state.teams[teamId];
  
  // 800-millisecond auto-sync loop for drawings and active grid metrics
  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh();
    }, 800);
    return () => clearInterval(timer);
  }, []);

  // Sync role 2 canvas drawings when drawing points from state update
  useEffect(() => {
    if (role === 2 && canvasRef.current) {
      renderPointsOnCanvas(canvasRef.current, team.drawPoints);
    }
  }, [team.drawPoints, role]);

  function renderPointsOnCanvas(canvas: HTMLCanvasElement, points: DrawPoint[]) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = teamId === 'blue' ? "#22d3ee" : "#f43f5e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (points.length === 0) return;

    ctx.beginPath();
    points.forEach((pt, idx) => {
      // Scale points from normalized 0..400 matrix to actual client width
      const x = (pt.x / 400) * canvas.width;
      const y = (pt.y / 400) * canvas.height;
      if (pt.isStart || idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  // Draw interactions for Role 1
  function getCoordinates(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Normalized coordinates mapped to 400x400 sandbox
    const x = ((clientX - rect.left) / rect.width) * 400;
    const y = ((clientY - rect.top) / rect.height) * 400;
    return { x, y };
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const pos = getCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    const newPt: DrawPoint = { x: pos.x, y: pos.y, isStart: true };
    sound.playBeep(420, "triangle", 0.03, 0.04);

    setDrawingPoints(prev => [...prev, newPt]);
    syncDrawPointsToServer([newPt], false);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCoordinates(e);
    if (!pos) return;

    const newPt: DrawPoint = { x: pos.x, y: pos.y, isStart: false };
    setDrawingPoints(prev => [...prev, newPt]);
    syncDrawPointsToServer([newPt], false);

    if (canvasRef.current) {
      renderPointsOnCanvas(canvasRef.current, [...drawingPoints, newPt]);
    }
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  async function syncDrawPointsToServer(pts: DrawPoint[], isClear: boolean) {
    try {
      await fetch("/api/game-state/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, points: pts, isClear })
      });
    } catch {}
  }

  async function clearCanvas() {
    sound.playClick();
    setDrawingPoints([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    await syncDrawPointsToServer([], true);
  }

  // Grid interaction handlers for Role 3
  async function handleToggleGridCell(cellIdx: number) {
    if (team.status !== 'playing') return;
    sound.playClick();
    
    const targetState = !team.technicalGrid[cellIdx];
    try {
      const res = await fetch("/api/game-state/grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, gridIndex: cellIdx, value: targetState })
      });
      if (res.ok) {
        const data = await res.json();
        onRefresh();
        if (data.isMatched) {
          sound.playVictoryTheme();
        }
      }
    } catch {}
  }

  const isMyTeamActive = state.activeTeamId === teamId;
  const isBlue = teamId === 'blue';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 text-white font-sans relative z-10 animate-fade-in">
      
      {/* HUD COMPILER BAR */}
      <div className={`p-4 mb-6 rounded-2xl border-2 shadow-lg transition-colors ${
        isBlue ? "bg-slate-900 border-cyan-405 shadow-[0_0_15px_rgba(34,211,238,0.15)]" : "bg-slate-900 border-pink-405 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">{isBlue ? "🦊" : "🐦‍🔥"}</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-bold block">
                Your Team:
              </span>
              <h1 className="text-sm font-black uppercase text-white">
                {isBlue ? "Fox Team 🦊" : "Bird Team 🐦‍🔥"}
              </h1>
              <span className={`text-[10px] font-sans font-black ${isBlue ? "text-cyan-400" : "text-rose-400"}`}>
                Player {role}: {role === 1 ? "1. Painter (Draws)" : role === 2 ? "2. Speaker (Talks)" : "3. Operator (Clicks)"}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => { sound.playClick(); onExit(); }}
            className="bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            Leave Role 🚪
          </button>
        </div>
      </div>

      {/* TIMERS / LOBBY LOCK OUT */}
      {!isMyTeamActive ? (
        <div className="bg-slate-900/95 border-2 border-slate-800 border-dashed p-8 rounded-3xl text-center shadow-xl flex flex-col items-center justify-center min-h-[320px] transition-all">
          <div className="text-5xl animate-bounce mb-3">⏳</div>
          <h2 className="text-lg font-black text-slate-300 uppercase tracking-tight">Waiting for Turn ⏰</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed font-sans font-bold">
            Get ready! Your teacher will start your team's turn soon on the main screen.
          </p>
          <div className={`mt-6 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border ${
            isBlue ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" : "bg-rose-500/10 text-rose-300 border-rose-500/20"
          }`}>
            Status: Standby ({team.status})
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* SECONDS COUNTDOWN ACCENT */}
          <div className={`p-4 rounded-2xl flex justify-between items-center transition-all border-2 ${
            state.roundTimer <= 15 ? 'bg-rose-955/40 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <Clock size={14} className={`${state.roundTimer <= 15 ? "text-rose-500 animate-spin" : "text-yellow-400"}`} /> 
              TIME LEFT
            </span>
            <span className={`text-2xl font-black tracking-tight ${state.roundTimer <= 15 ? 'text-rose-450' : 'text-white'}`}>
              {state.roundTimer}s
            </span>
          </div>

          {/* ROLE 1 DETAILS - SENDER DRAWS WITHOUT VOICE */}
          {role === 1 && (
            <div className="space-y-4 font-sans">
              <div className="bg-cyan-950/40 border-2 border-cyan-500/20 backdrop-blur-md rounded-2xl p-4">
                <span className="text-[10px] font-black text-cyan-350 uppercase tracking-widest block mb-1">
                  🤫 Secret rules: No talking!
                </span>
                <span className="text-xs text-slate-400 block mb-2 font-bold">Do not make any sounds! Draw shape clues for your teammates below:</span>
                <p className="text-xs text-cyan-200 font-bold bg-slate-950 p-3 rounded-xl border border-cyan-500/15 leading-relaxed whitespace-pre-wrap">
                  {state.currentMission ? state.currentMission.role1_instruction : "Please wait..."}
                </p>
              </div>

              {/* RETRO CANVAS DRAWING COMPILER */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5 font-bold uppercase">
                    <Paintbrush size={14} className="text-cyan-400" /> Secret Drawing Board 🎨
                  </span>
                  <button
                    onClick={clearCanvas}
                    className="py-1 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-rose-400 text-xs flex items-center gap-1 font-bold transition-all cursor-pointer"
                  >
                    <Trash2 size={12} /> Clear Board 🧹
                  </button>
                </div>

                <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-1 overflow-hidden select-none">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full bg-slate-950 rounded-xl cursor-crosshair touch-none"
                    style={{ minHeight: "240px" }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center leading-normal font-bold">
                  Draw with your finger or mouse here! Your Speaker (Player 2) sees this live in real-time.
                </p>
              </div>
            </div>
          )}

          {/* ROLE 2 DETAILS - MEDIATOR VOICES SKETCH INSTANTLY */}
          {role === 2 && (
            <div className="space-y-4 font-sans">
              <div className="bg-amber-950/40 border-2 border-amber-500/20 backdrop-blur-md rounded-2xl p-4 flex gap-3">
                <div className="text-3xl shrink-0">🗣️</div>
                <div>
                  <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-black">
                    🗣️ Speaker: Explain the drawing!
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed mt-1 font-bold">
                    Tell your teammate Operator (Player 3) which blocks to click based on the drawing below!
                  </p>
                  <p className="text-[10px] text-amber-400 mt-1.5 font-bold">
                    ⚠️ Do not show them your screen! Only use your voice to explain!
                  </p>
                </div>
              </div>

              {/* DRAW PREVIEW PANEL */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <span className="text-xs text-slate-300 block font-bold uppercase tracking-wide">
                  📡 Painter's Drawing (Live):
                </span>

                <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-1">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    className="w-full bg-slate-950 rounded-xl"
                    style={{ minHeight: "240px" }}
                  />
                </div>
                <p className="text-[10px] text-slate-405 text-center font-bold">
                  The drawings update automatically. Describe what you see!
                </p>
              </div>
            </div>
          )}

          {/* ROLE 3 DETAILS - TECHNICAL CORE ACTION SELECTIONS */}
          {role === 3 && (
            <div className="space-y-4 font-sans">
              {state.currentMission?.type === "technical" ? (
                <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div>
                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
                      💻 Click the Target Pattern!
                    </span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed font-bold">
                      Listen carefully to Speaker's voice! Click the blocks to match the pattern they describe.
                    </p>
                  </div>

                  {/* GRID INTERACTIVE DRAW */}
                  <div className="flex justify-center py-2">
                    <div className={`grid gap-3 p-3 bg-slate-950 rounded-2xl border-2 border-slate-800 select-none relative ${
                      state.currentMission.gridSize === 3 ? "grid-cols-3 max-w-[240px]" : "grid-cols-4 max-w-[300px]"
                    }`}>
                      {team.technicalGrid.map((val, cellIdx) => (
                        <button
                          key={cellIdx}
                          onClick={() => handleToggleGridCell(cellIdx)}
                          className={`aspect-square w-14 sm:w-16 rounded-xl border-2 transition-all duration-200 text-xs font-black flex items-center justify-center cursor-pointer ${
                            val 
                              ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                              : "bg-slate-900 text-slate-500 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-850"
                          }`}
                        >
                          {val ? "✔" : "·"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-center font-bold text-[10px] text-slate-400 animate-pulse">
                    Click the matching blocks to win!
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-3xl mx-auto flex items-center justify-center border-2 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-200 uppercase tracking-tight">🏫 Complete the Action!</h3>
                    <p className="text-xs text-slate-350 mt-2 leading-relaxed max-w-sm mx-auto font-bold">
                      Listen to what Speaker tells you to do and perform the active action quietly!
                    </p>
                    <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-950 pt-3 font-bold">
                      Once you finish, smile or look at the teacher so they can award points on the screen!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
