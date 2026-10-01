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
import { ArrowUpRight, Radio, RefreshCw, Globe2, Moon, Sun } from "lucide-react";
import Welcome from "./components/Welcome";
import "./design.css";
import { presentationFromQuery } from "./presentation";

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
  const [lang, setLang] = useState<'en' | 'ar'>(() => presentationFromQuery(window.location.search).language ?? (localStorage.getItem("go_mission_lang") === "ar" ? "ar" : "en"));

  const [theme, setTheme] = useState<'light' | 'dark'>(() => presentationFromQuery(window.location.search).theme ?? (localStorage.getItem("go_mission_theme") === "light" ? "light" : "dark"));
  useEffect(() => { localStorage.setItem("go_mission_theme", theme); document.documentElement.style.colorScheme = theme; }, [theme]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== 'https://gheid-mycv.vercel.app' || event.data?.type !== 'portfolio:presentation') return;
      if (event.data.language === 'en' || event.data.language === 'ar') setLang(event.data.language);
      if (event.data.theme === 'light' || event.data.theme === 'dark') setTheme(event.data.theme);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  // Persist language
  useEffect(() => {
    localStorage.setItem("go_mission_lang", lang);
    document.documentElement.lang = lang;
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
      else if (!hash || hash === '#/lobby') setCurrentView('lobby');
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

  const syncInFlight = useRef(false);
  // Keep only one sync request in flight to avoid out-of-order state.
  const syncGameState = async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
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
    } finally { syncInFlight.current = false; }
  };

  useEffect(() => {
    syncGameState();
    const interval = setInterval(() => { if (document.visibilityState === "visible" && currentView !== "lobby") void syncGameState(); }, 2000);
    return () => clearInterval(interval);
  }, [currentView]);

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

  const isArabic = lang === 'ar';
  const navigation = [
    { view: 'lobby' as const, label: isArabic ? 'الرئيسية' : 'Home' },
    { view: 'host' as const, label: isArabic ? 'لوحة المعلم' : 'Host dashboard' },
    { view: 'join' as const, label: isArabic ? 'انضم للّعبة' : 'Join the game' },
    { view: 'projector' as const, label: isArabic ? 'شاشة العرض' : 'Class display' }
  ];
  return (
    <div className="mission-app" data-theme={theme} dir={isArabic ? 'rtl' : 'ltr'}>
      <a className="mission-skip" href="#mission-main">{isArabic ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
      <header className="mission-header">
        <button className="mission-brand" onClick={() => setView('lobby')} aria-label={isArabic ? 'GO Mission الرئيسية' : 'GO Mission home'}>
          <img className="mission-brand-image" src="/go-mission-logo.png" alt="GO Mission" width="210" height="80" />
        </button>
        <nav className="mission-navigation" aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'}>
          {navigation.map(item => <button key={item.view} aria-current={currentView === item.view ? 'page' : undefined} className={currentView === item.view ? 'active' : ''} onClick={() => setView(item.view)}>{item.label}</button>)}
        </nav>
        <div className="mission-header-controls"><button className="mission-theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={isArabic ? (theme === 'dark' ? 'تفعيل المظهر الفاتح' : 'تفعيل المظهر الداكن') : (theme === 'dark' ? 'Use light theme' : 'Use dark theme')} title={isArabic ? 'تغيير المظهر' : 'Change theme'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
        <button className="mission-language" onClick={() => setLang(isArabic ? 'en' : 'ar')} aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}><Globe2 size={17}/>{isArabic ? 'EN' : 'العربية'}</button></div>
      </header>
      <main id="mission-main">
        {currentView === 'lobby' ? <Welcome lang={lang} onNavigate={setView} /> : (
          <section className="mission-workspace">
            <div className="mission-workspace-heading">
              <div><span className="mission-eyebrow">GO / {currentView.toUpperCase()}</span><h1>{navigation.find(item => item.view === currentView)?.label}</h1></div>
              <span className={`mission-status ${errorMessage ? 'disconnected' : ''}`} role="status"><Radio size={15}/>{errorMessage ? (isArabic ? 'المزامنة غير متاحة' : 'Sync unavailable') : gameState ? (isArabic ? 'متصل باللعبة' : 'Connected to game') : (isArabic ? 'جارٍ الاتصال' : 'Connecting')}</span>
            </div>
            {gameState ? <div className="mission-game-panel">
              {currentView === 'host' && <HostDashboard state={gameState} onRefresh={syncGameState} lang={lang}/>}
              {currentView === 'projector' && <ProjectorScreen state={gameState} lang={lang}/>}
              {currentView === 'join' && (userTeam && userRole ? <RolePlayScreen state={gameState} teamId={userTeam} role={userRole} onExit={handleExitSlot} onRefresh={syncGameState} lang={lang}/> : <PlayerJoin state={gameState} onSelectSlot={handleSelectSlot} onRefresh={syncGameState} lang={lang}/>)}
            </div> : <div className="mission-connection">
              <span className="mission-connection-icon"><Radio size={30}/></span>
              <h2>{errorMessage ? (isArabic ? 'نحتاج اتصالًا لبدء التحدي' : 'Let’s reconnect before we play') : (isArabic ? 'نجهّز مساحة اللعب' : 'Getting your game ready')}</h2>
              <p>{errorMessage ? (isArabic ? 'المزامنة غير متاحة حاليًا. يمكنك استكشاف طريقة اللعب والعودة بعد قليل.' : 'Game sync is currently unavailable. Explore how it works and try again shortly.') : (isArabic ? 'لحظات ونوصلك ببقية الفريق.' : 'Connecting you with the rest of your team.')}</p>
              <div className="mission-connection-actions"><button className="mission-button primary" onClick={syncGameState}><RefreshCw size={17}/>{isArabic ? 'حاول مجددًا' : 'Try again'}</button><button className="mission-button secondary" onClick={()=>setView('lobby')}>{isArabic ? 'طريقة اللعب' : 'How to play'}<ArrowUpRight size={17}/></button></div>
            </div>}
          </section>
        )}
      </main>
      <footer className="mission-footer">
        <div className="mission-footer-top"><img className="mission-footer-logo" src="/go-mission-logo.png" alt="GO Mission" width="155" height="60" loading="lazy"/><p>{isArabic ? 'مهمة واحدة. أدوار مختلفة. فريق أقوى.' : 'One mission. Different roles. A stronger team.'}</p><span className="mission-footer-note">{isArabic ? 'مصمّمة للحظات التي تجمعنا' : 'Made for the moments that bring us together'}</span></div>
        <div className="mission-developer"><span>{isArabic ? 'حسابات المطوّرة' : 'Developer profiles'}</span>
          <nav aria-label="Developer profiles" className="flex items-center gap-3">
            <a href="https://github.com/iamghaid" target="_blank" rel="noopener noreferrer" aria-label="GitHub — Gheid Abdulkarim" title="GitHub — Gheid Abdulkarim" style={{backgroundColor: "transparent", color: "inherit"}} className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-lg border border-current hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"><svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.62 0c2.15-1.46 3.1-1.15 3.1-1.15.62 1.55.23 2.7.12 2.98.72.79 1.15 1.79 1.15 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.1c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z"/></svg></a>
            <a href="https://www.linkedin.com/in/gheid-abdulkarim-6567872ab" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn — Gheid Abdulkarim" title="LinkedIn — Gheid Abdulkarim" style={{backgroundColor: "transparent", color: "inherit"}} className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-lg border border-current hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"><svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" d="M5.37 24H.39V7.98h4.98V24ZM2.88 5.8A2.9 2.9 0 1 1 2.9 0a2.9 2.9 0 0 1-.02 5.8ZM24 24h-4.97v-7.8c0-1.86-.04-4.25-2.59-4.25-2.6 0-3 2.02-3 4.12V24H8.47V7.98h4.77v2.19h.07c.66-1.25 2.28-2.57 4.7-2.57 5.03 0 5.96 3.31 5.96 7.62V24Z"/></svg></a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
