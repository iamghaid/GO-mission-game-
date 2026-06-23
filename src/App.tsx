/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GameState } from "./types";
import { sound } from "./components/AudioEngine";
import HostDashboard from "./components/HostDashboard";
import ProjectorScreen from "./components/ProjectorScreen";
import PlayerJoin from "./components/PlayerJoin";
import RolePlayScreen from "./components/RolePlayScreen";
import { Terminal, ShieldAlert, Sparkles, Monitor, Play, Users, Sword, Wifi, RefreshCw, Volume2 } from "lucide-react";

export const APP_TRANSLATIONS = {
  en: {
    welcome: "🏠 Welcome",
    teacher: "💻 Teacher Dashboard",
    bigScreen: "📺 Class Screen",
    playOnPhone: "📱 Student Play",
    online: "ONLINE",
    offline: "OFFLINE",
    gameTitle: "GO mission 🚀",
    subTitle: "A vibrant, simple team communication party game modeled after Kahoot and Blooket!",
    readyTitle: "Fun Multiplayer Team Game",
    classroomTitle: "Fun Classroom Game",
    loading: "Getting your game live... Please wait!",
    dashboardTitle: "1. Instructor Dashboard",
    dashboardDesc: "Start a new game round, view key answers, and score points.",
    projectorTitle: "2. Large Projector View",
    projectorDesc: "Giant game timer, team scores, turn indicators, and winner screen.",
    joinTitle: "3. Interactive Student Pad",
    joinDesc: "Join is easy: scan QR or tap below, choose your slot, and play!",
    tap: "Tap 🎵",
    win: "Win 🎉",
    oops: "Oops 💥",
    soundChecker: "Sound Test:",
    footerText: "🎮 GO mission Game — simple, fast, and exciting! 🚀",
  },
  ar: {
    welcome: "🏠 الرئيسية",
    teacher: "💻 بوابة المعلم",
    bigScreen: "📺 شاشة الصف الكبيرة",
    playOnPhone: "📱 دخول الطلاب",
    online: "متصل",
    offline: "غير متصل",
    gameTitle: "مهمة GO 🚀",
    subTitle: "لعبة جماعية تفاعلية سريعة ومثيرة للتواصل الحركي واللفظي للصف!",
    readyTitle: "لعبة جماعية للفرق",
    classroomTitle: "نشاط تفاعلي للفصل",
    loading: "جاري تشغيل اللعبة... انتظر لثانية!",
    dashboardTitle: "١. لوحة المعلم",
    dashboardDesc: "بدء التحدي، استعراض الإجابات وتوزيع النقاط للفرق.",
    projectorTitle: "٢. شاشة العرض",
    projectorDesc: "مؤقت تنازلي كبير، وتحديد أدوار وطرف اللعب في الصف.",
    joinTitle: "٣. لوحة الطالب",
    joinDesc: "سهل جداً: امسح الرمز أو اضغط هنا، اختر خانتك وابدأ فوراً!",
    tap: "صوت 🎵",
    win: "فوز 🎉",
    oops: "عثرة 💥",
    soundChecker: "اختبار الصوت:",
    footerText: "🎮 لعبة مهمة GO — ممتعة، سريعة، ومثيرة! 🚀",
  }
};

export default function App() {
  // Centralized game state synced from server
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentView, setCurrentView] = useState<'lobby' | 'host' | 'projector' | 'join'>('lobby');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>(() => (localStorage.getItem("go_mission_lang") as 'en' | 'ar') || 'en');

  // Persist language
  useEffect(() => {
    localStorage.setItem("go_mission_lang", lang);
  }, [lang]);
  
  // Persisted local player role slot
  const [userTeam, setUserTeam] = useState<'blue' | 'red' | null>(null);
  const [userRole, setUserRole] = useState<1 | 2 | 3 | null>(null);

  const gameStateRef = useRef<GameState | null>(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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

  // Auto-join from scanned QR code parameters
  useEffect(() => {
    const checkAutoJoin = async () => {
      try {
        const hash = window.location.hash;
        const queryPart = hash.includes('?') ? hash.split('?')[1] : window.location.search;
        if (!queryPart) return;

        const urlParams = new URLSearchParams(queryPart);
        const qTeam = urlParams.get('team') as 'blue' | 'red' | null;
        const qRoleStr = urlParams.get('role');
        const qRole = qRoleStr ? parseInt(qRoleStr) : null;

        if (qTeam && (qRole === 1 || qRole === 2 || qRole === 3)) {
          const res = await fetch("/api/game-state/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: qTeam, role: qRole })
          });
          if (res.ok) {
            setUserTeam(qTeam);
            setUserRole(qRole as 1 | 2 | 3);
            localStorage.setItem("silent_mission_team", qTeam);
            localStorage.setItem("silent_mission_role", qRole.toString());
            setCurrentView('join');
            // Reset hash so standard routing exits don't map back in
            window.location.hash = '#/join';
            sound.playSuccess();
          }
        }
      } catch (err) {
        console.error("Auto-join from QR failed:", err);
      }
    };
    
    checkAutoJoin();
    window.addEventListener('hashchange', checkAutoJoin);
    return () => window.removeEventListener('hashchange', checkAutoJoin);
  }, []);

  // Central fast-sync polling fetch engine (updates every 800ms)
  const syncGameState = async () => {
    try {
      const res = await fetch("/api/game-state");
      if (res.ok) {
        const data = (await res.json()) as GameState;
        
        // Audio alert on sudden round winner announcements
        const currentGameState = gameStateRef.current;
        if (currentGameState && !currentGameState.winner && data.winner) {
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
  }, []);

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

  const t = APP_TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between selection:bg-yellow-300 selection:text-slate-950 leading-normal font-sans antialiased relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
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
            <div className="p-2 rounded-2xl bg-gradient-to-br from-pink-500 via-yellow-400 to-cyan-400 border border-white/30 shadow-[0_0_15px_rgba(236,72,153,0.3)] shrink-0 animate-bounce">
              <Sword size={20} className="text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white font-sans uppercase flex items-center gap-1.5">
                {t.gameTitle}
              </h1>
              <p className="text-[10px] font-sans text-yellow-350 uppercase tracking-wider font-extrabold mt-0.5">{t.classroomTitle}</p>
            </div>
          </div>

          {/* VIEW TABS & LANGUAGE TOGGLE */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setView('lobby')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currentView === 'lobby' 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.welcome}
              </button>
              <button
                onClick={() => setView('host')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currentView === 'host' 
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.teacher}
              </button>
              <button
                onClick={() => setView('projector')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currentView === 'projector' 
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.bigScreen}
              </button>
              <button
                onClick={() => setView('join')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currentView === 'join' 
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.playOnPhone}
              </button>
            </div>

            {/* LANGUAGE SWITCHER */}
            <button
              onClick={() => setLang(prev => prev === 'en' ? 'ar' : 'en')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border border-slate-700 bg-slate-900 text-yellow-400 hover:bg-slate-800 hover:border-yellow-400 flex items-center gap-1.5 cursor-pointer shadow-md select-none"
            >
              🌐 {lang === 'en' ? "العربية" : "English"}
            </button>
          </div>

          {/* SIMPLE LINK INDICATOR */}
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
            <div className={`w-2 h-2 rounded-full ${errorMessage ? "bg-red-500 animate-ping" : "bg-emerald-400 animate-ping"}`}></div>
            <span>{errorMessage ? t.offline : t.online}</span>
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
                lang={lang}
              />
            ) : (
              <>
                {currentView === 'lobby' && (
                  <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
                    
                    {/* ENERGETIC HERO SECTION */}
                    <div className="text-center space-y-4 max-w-xl mx-auto mb-12 animate-fade-in">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 py-1.5 px-4 rounded-full mb-2 shadow-[0_0_15px_rgba(236,72,153,0.15)] animate-pulse">
                        <Sparkles size={14} className="text-pink-400" />
                        <span className="text-[10px] tracking-wider text-pink-300 font-sans font-black uppercase">
                          {t.readyTitle}
                        </span>
                      </div>
                      
                      <h1 className="text-5xl sm:text-6xl font-black font-sans leading-none tracking-tight text-white uppercase select-none">
                        {t.gameTitle}
                      </h1>
                      
                      <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-md mx-auto">
                        {t.subTitle}
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
                        <h3 className="text-base font-extrabold font-sans text-white">{t.dashboardTitle}</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {t.dashboardDesc}
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
                        <h3 className="text-base font-extrabold font-sans text-white">{t.projectorTitle}</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {t.projectorDesc}
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
                        <h3 className="text-base font-extrabold font-sans text-white">{t.joinTitle}</h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {t.joinDesc}
                        </p>
                      </button>

                    </div>

                    {/* INTERACTIVE SOUND BOARD ACCENTS */}
                    <div className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 py-4 px-6 rounded-3xl flex items-center justify-between gap-6 max-w-sm w-full font-sans text-xs text-slate-300 relative z-10 shadow-lg">
                      <span className="flex items-center gap-1.5 font-bold"><Volume2 size={14} className="text-yellow-400" /> {t.soundChecker}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => sound.playClick()} 
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-[11px]"
                        >
                          {t.tap}
                        </button>
                        <button 
                          onClick={() => sound.playSuccess()} 
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:border-emerald-450 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-[11px]"
                        >
                          {t.win}
                        </button>
                        <button 
                          onClick={() => sound.playError()} 
                          className="px-3 py-1 bg-white/5 border border-white/10 hover:border-rose-450 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl transition cursor-pointer font-bold text-[11px]"
                        >
                          {t.oops}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {currentView === 'host' && (
                  <HostDashboard
                    state={gameState}
                    onRefresh={syncGameState}
                    lang={lang}
                  />
                )}

                {currentView === 'projector' && (
                  <ProjectorScreen
                    state={gameState}
                    lang={lang}
                  />
                )}

                {currentView === 'join' && (
                  <PlayerJoin
                    state={gameState}
                    onSelectSlot={handleSelectSlot}
                    onRefresh={syncGameState}
                    lang={lang}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <RefreshCw size={36} className="text-yellow-400 animate-spin" />
            <p className="text-sm font-sans text-slate-400 mt-4 font-bold">{t.loading}</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center font-sans text-xs text-slate-500">
        <p>{t.footerText}</p>
      </footer>

    </div>
  );
}
