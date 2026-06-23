/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GameState } from "./types";
import { sound } from "./components/AudioEngine";
import HostDashboard from "./components/HostDashboard";
import ProjectorScreen from "./components/ProjectorScreen";
import PlayerJoin from "./components/PlayerJoin";
import RolePlayScreen from "./components/RolePlayScreen";
import { Terminal, ShieldAlert, Sparkles, Monitor, Play, Users, Sword, Wifi, RefreshCw, Volume2 } from "lucide-react";

export default function App() {
  // Centralized game state synced from server
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentView, setCurrentView] = useState<'lobby' | 'host' | 'projector' | 'join'>('lobby');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Persisted local player role slot
  const [userTeam, setUserTeam] = useState<'blue' | 'red' | null>(null);
  const [userRole, setUserRole] = useState<1 | 2 | 3 | null>(null);

  // Sync with browser hash routing on load
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/host') setCurrentView('host');
      else if (hash === '#/projector') setCurrentView('projector');
      else if (hash === '#/join') setCurrentView('join');
      else setCurrentView('lobby');
    };

    window.addEventListener('hashchange', handleHash);
    handleHash(); // Run once on init

    // Load persisted operator slot from localStorage
    const savedTeam = localStorage.getItem("silent_mission_team") as 'blue' | 'red' | null;
    const savedRole = localStorage.getItem("silent_mission_role");
    if (savedTeam && savedRole) {
      setUserTeam(savedTeam);
      setUserRole(parseInt(savedRole) as 1 | 2 | 3);
    }

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Central fast-sync polling fetch engine (updates every 800ms)
  const syncGameState = async () => {
    try {
      const res = await fetch("/api/game-state");
      if (res.ok) {
        const data = (await res.json()) as GameState;
        
        // Audio alert on sudden round winner announcements
        if (gameState && !gameState.winner && data.winner) {
          sound.playVictoryTheme();
        }
        
        setGameState(data);
        setErrorMessage(null);
      } else {
        setErrorMessage("Operational Grid communication error.");
      }
    } catch (e) {
      setErrorMessage("Could not connect to host local server.");
    }
  };

  useEffect(() => {
    syncGameState();
    const interval = setInterval(syncGameState, 800);
    return () => clearInterval(interval);
  }, [gameState?.winner]);

  // Handle student lobby slot claims
  const handleSelectSlot = async (teamId: 'blue' | 'red', role: 1 | 2 | 3) => {
    try {
      const res = await fetch("/api/game-state/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, role })
      });
      if (res.ok) {
        setUserTeam(teamId);
        setUserRole(role);
        localStorage.setItem("silent_mission_team", teamId);
        localStorage.setItem("silent_mission_role", role.toString());
        syncGameState();
      }
    } catch {}
  };

  // Erase student lobby slot claims
  const handleExitSlot = async () => {
    if (userTeam && userRole) {
      try {
        await fetch("/api/game-state/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: userTeam, role: userRole })
        });
      } catch {}
    }
    setUserTeam(null);
    setUserRole(null);
    localStorage.removeItem("silent_mission_team");
    localStorage.removeItem("silent_mission_role");
    sound.playClick();
    syncGameState();
  };

  const setView = (view: 'lobby' | 'host' | 'projector' | 'join') => {
    sound.playClick();
    setCurrentView(view);
    window.location.hash = `#/${view}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between selection:bg-yellow-300 selection:text-slate-950 leading-normal font-sans antialiased relative overflow-hidden">
      
      {/* HAPPY VIBRANT BACKGROUND GLOWS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[50%] bg-pink-500/20 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[50%] bg-cyan-500/20 rounded-full blur-[130px]"></div>
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-yellow-400/10 rounded-full blur-[100px]"></div>
      </div>

      {/* VIBRANT HEADER */}
      <header className="border-b-2 border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div 
            onClick={() => setView('lobby')} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-95 select-none"
          >
            <div className="p-2 rounded-2xl bg-gradient-to-br from-pink-505 via-yellow-400 to-cyan-400 border border-white/30 shadow-[0_0_15px_rgba(236,72,153,0.3)] shrink-0 animate-bounce">
              <Sword size={20} className="text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white font-sans uppercase flex items-center gap-1.5">
                THE SILENT MISSION 🤫✨
              </h1>
              <p className="text-[10px] font-sans text-yellow-350 uppercase tracking-wider font-extrabold mt-0.5">Quiet Teamwork Game for Classrooms!</p>
            </div>
          </div>

          {/* COLORFUL VIEW TABS */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setView('lobby')}
              style={{ contentVisibility: 'auto' }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentView === 'lobby' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🏠 Welcome
            </button>
            <button
              onClick={() => setView('host')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentView === 'host' 
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              💻 Teacher
            </button>
            <button
              onClick={() => setView('projector')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentView === 'projector' 
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              📺 Big Screen
            </button>
            <button
              onClick={() => setView('join')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentView === 'join' 
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              📱 Play on Phone
            </button>
          </div>

          {/* SIMPLE LINK INDICATOR */}
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
            <div className={`w-2 h-2 rounded-full ${errorMessage ? "bg-red-500 animate-ping" : "bg-emerald-400 animate-ping"}`}></div>
            <span>{errorMessage ? "OFFLINE" : "ONLINE"}</span>
          </div>
        </div>
      </header>

      {/* ERROR ANCHOR */}
      {errorMessage && (
        <div className="bg-red-650/20 border-b border-red-500/30 px-4 py-2 text-center text-[10px] font-mono text-red-400 flex items-center justify-center gap-2">
          <ShieldAlert size={12} />
          {errorMessage}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {gameState ? (
          <>
            {/* If Student claimed a role slot, override Mobile view of that player to show their gameplay interface! */}
            {currentView === 'join' && userTeam && userRole ? (
              <RolePlayScreen
                state={gameState}
                teamId={userTeam}
                role={userRole}
                onExit={handleExitSlot}
                onRefresh={syncGameState}
              />
            ) : (
              <>
                {currentView === 'lobby' && (
                  <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
                    
                    {/* ENERGETIC HERO SECTION */}
                    <div className="text-center space-y-4 max-w-xl mx-auto mb-12">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 py-1.5 px-4 rounded-full mb-2 shadow-[0_0_15px_rgba(236,72,153,0.15)] animate-pulse">
                        <Sparkles size={14} className="text-pink-400" />
                        <span className="text-[10px] tracking-wider text-pink-300 font-sans font-black uppercase">
                          Fun Multiplayer Game powered by AI
                        </span>
                      </div>
                      
                      <h1 className="text-5xl sm:text-6xl font-black font-sans leading-none tracking-tight text-white uppercase select-none">
                        THE SILENT <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
                          MISSION GAME 🤫
                        </span>
                      </h1>
                      
                      <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-md mx-auto">
                        A super fun classroom game where teams must work in total silence! One person draws clues, another person reads the clues and talks, and the last person clicks the pattern!
                      </p>
                    </div>

                    {/* THREE ENTRY SEGMENTS (COLORFUL CARDS) */}
                    <div id="selection-links-view" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl relative z-10">
                      
                      {/* Host */}
                      <button
                        onClick={() => setView('host')}
                        className="bg-slate-900/90 hover:bg-slate-850/90 border-2 border-yellow-400/40 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.2)] p-6 rounded-3xl text-left transition-all duration-300 group shadow-xl relative overflow-hidden"
                      >
                        <div className="mb-4 text-slate-950 bg-yellow-400 w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.4)] group-hover:scale-110 transition duration-300">
                          <Terminal size={22} className="stroke-[2.5]" />
                        </div>
                        <h3 className="text-base font-extrabold font-sans text-white">1. Teacher Dashboard</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          For teachers! Start a new game, pick a fun background theme, view secret answers, and score points.
                        </p>
                      </button>

                      {/* Display */}
                      <button
                        onClick={() => setView('projector')}
                        className="bg-slate-900/90 hover:bg-slate-850/90 border-2 border-cyan-400/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] p-6 rounded-3xl text-left transition-all duration-300 group shadow-xl relative overflow-hidden"
                      >
                        <div className="mb-4 text-slate-950 bg-cyan-400 w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)] group-hover:scale-110 transition duration-300">
                          <Monitor size={22} className="stroke-[2.5]" />
                        </div>
                        <h3 className="text-base font-extrabold font-sans text-white">2. Class Projector</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          For the big screen! Show a giant game timer, team points, live results, and a QR join code.
                        </p>
                      </button>

                      {/* Student */}
                      <button
                        onClick={() => setView('join')}
                        className="bg-slate-900/90 hover:bg-slate-850/90 border-2 border-pink-500/40 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] p-6 rounded-3xl text-left transition-all duration-300 group shadow-xl relative overflow-hidden"
                      >
                        <div className="mb-4 text-slate-950 bg-pink-500 w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)] group-hover:scale-110 transition duration-300">
                          <Users size={22} className="stroke-[2.5]" />
                        </div>
                        <h3 className="text-base font-extrabold font-sans text-white">3. Join to Play</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          For students! Open this on your mobile phone or tablet, choose Blue or Red team, select a role, and play!
                        </p>
                      </button>

                    </div>

                    {/* INTERACTIVE SOUND BOARD ACCENTS */}
                    <div className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 py-4 px-6 rounded-3xl flex items-center justify-between gap-6 max-w-sm w-full font-sans text-xs text-slate-300 relative z-10 shadow-lg">
                      <span className="flex items-center gap-1.5 font-bold"><Volume2 size={14} className="text-yellow-405" /> Sound Checker:</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => sound.playClick()} 
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-[11px]"
                        >
                          Tap 🎵
                        </button>
                        <button 
                          onClick={() => sound.playSuccess()} 
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:border-emerald-450 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-[11px]"
                        >
                          Win 🎉
                        </button>
                        <button 
                          onClick={() => sound.playError()} 
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:border-rose-450 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-[11px]"
                        >
                          Oops 💥
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {currentView === 'host' && (
                  <HostDashboard
                    state={gameState}
                    onRefresh={syncGameState}
                  />
                )}

                {currentView === 'projector' && (
                  <ProjectorScreen
                    state={gameState}
                  />
                )}

                {currentView === 'join' && (
                  <PlayerJoin
                    state={gameState}
                    onSelectSlot={handleSelectSlot}
                    onRefresh={syncGameState}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <RefreshCw size={36} className="text-yellow-400 animate-spin" />
            <p className="text-sm font-sans text-slate-400 mt-4 font-bold">Getting the game live... Hold on!</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center font-sans text-xs text-slate-550">
        <p>🎮 The Silent Mission Game — Created with lots of color and simple words! 🎨🤫</p>
      </footer>

    </div>
  );
}
