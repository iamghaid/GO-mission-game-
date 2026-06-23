/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GameState } from "../types";
import { sound } from "./AudioEngine";
import { Users, UserCheck } from "lucide-react";

interface PlayerJoinProps {
  state: GameState;
  onSelectSlot: (teamId: 'blue' | 'red', role: 1 | 2 | 3) => void;
  onRefresh: () => void;
  lang?: 'en' | 'ar';
}

const joinTranslations = {
  en: {
    roomCodeLabel: "ROOM CODE",
    joinStatusLabel: "JOIN STATUS:",
    playersJoined: "PLAYERS READY",
    full: "TAKEN",
    join: "CLAIM BASE",
    foxTeam: "FOXES 🦊",
    birdTeam: "PHOENIXES 🐦‍🔥",
    roles: {
      1: "Observer (Can see mission, cannot text/talk)",
      2: "Messenger (Can see, can speak/signal)",
      3: "Executor (Takes physical action)"
    }
  },
  ar: {
    roomCodeLabel: "رمز الغرفة",
    joinStatusLabel: "حالة الانضمام:",
    playersJoined: "لاعبين مستعدين",
    full: "محجوز",
    join: "احجز مقعدك",
    foxTeam: "فريق الثعلب 🦊",
    birdTeam: "فريق الطائر 🐦‍🔥",
    roles: {
      1: "المراقب (يرى المهمة بدون كلام)",
      2: "المتحدث (يرى ويتكلم ويوجه)",
      3: "المنفذ (يؤدي ويمثل حركياً)"
    }
  }
};

export default function PlayerJoin({ state, onSelectSlot, onRefresh, lang = 'en' }: PlayerJoinProps) {
  const t = joinTranslations[lang];
  const cleanPathname = window.location.pathname.endsWith('/') 
    ? window.location.pathname 
    : window.location.pathname + '/';
  const joinUrl = `${window.location.origin}${cleanPathname}#/join`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=ffffff&bgcolor=090d16&data=${encodeURIComponent(joinUrl)}`;

  // Calculate total players joined
  let joinedCount = 0;
  if (state.teams.blue.players[1]) joinedCount++;
  if (state.teams.blue.players[2]) joinedCount++;
  if (state.teams.blue.players[3]) joinedCount++;
  if (state.teams.red.players[1]) joinedCount++;
  if (state.teams.red.players[2]) joinedCount++;
  if (state.teams.red.players[3]) joinedCount++;

  function handleSelect(teamId: 'blue' | 'red', role: 1 | 2 | 3) {
    sound.playSuccess();
    onSelectSlot(teamId, role);
  }

  const isRtl = lang === 'ar';

  return (
    <div 
      id="classroom-join-root" 
      className="max-w-4xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-around gap-8 text-white font-sans animate-fade-in"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* LEFT SIDE: QR CODE & ROOM ACCESS */}
      <div className="bg-slate-905 border-4 border-slate-900 rounded-[2.5rem] p-8 text-center flex flex-col items-center justify-center max-w-sm w-full shadow-2xl relative overflow-hidden">
        
        {/* Room Code */}
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">
          {t.roomCodeLabel}
        </span>
        <h2 className="text-4xl font-mono font-black text-yellow-400 tracking-wider mb-5">
          GOMISSION
        </h2>

        {/* Large QR Code */}
        <div className="bg-slate-950 p-4 rounded-3xl border-2 border-slate-900 shadow-inner">
          <img
            src={qrCodeUrl}
            alt="Scan this QR to join GO mission instantly!"
            referrerPolicy="no-referrer"
            className="w-48 h-48 rounded-2xl border-2 border-slate-800"
          />
        </div>

        {/* Join Status */}
        <div className="mt-5 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl w-full">
          <span className="text-[10px] text-slate-405 font-black uppercase tracking-wider block">
            {t.joinStatusLabel}
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
            {joinedCount} / 6 {t.playersJoined}
          </span>
        </div>

      </div>

      {/* RIGHT SIDE: TEAM ROLE ASSIGNMENTS CHOSEN */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-lg">
        
        {/* BLUE FOX TEAM */}
        <div className="bg-slate-905 border-4 border-slate-900 rounded-3xl p-5 shadow-lg relative">
          <h3 className="text-cyan-400 font-black text-sm tracking-wide mb-3 uppercase flex items-center justify-between">
            <span>{t.foxTeam}</span>
            <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-md font-bold">
              {state.teams.blue.score} PTS
            </span>
          </h3>

          <div className="grid grid-cols-1 gap-2">
            {([1, 2, 3] as const).map((role) => {
              const occupied = state.teams.blue.players[role];
              return (
                <button
                  key={role}
                  onClick={() => handleSelect('blue', role)}
                  disabled={!!occupied}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition duration-200 flex items-center justify-between cursor-pointer ${
                    occupied
                      ? "bg-slate-950 border-slate-950 opacity-40 cursor-not-allowed text-slate-500"
                      : "bg-slate-950/70 border-slate-900 hover:border-cyan-400 hover:bg-slate-900/50"
                  }`}
                  style={{ textAlign: isRtl ? 'right' : 'left' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${occupied ? 'bg-slate-900 text-slate-700' : 'bg-cyan-500/10 text-cyan-300'}`}>
                      {occupied ? <UserCheck size={14} /> : <Users size={14} />}
                    </div>
                    <div>
                      <span className="text-xs font-black block text-slate-100">
                        {role === 1 ? (isRtl ? "١. مراقب" : "1. OBSERVER") : role === 2 ? (isRtl ? "٢. متحدث" : "2. MESSENGER") : (isRtl ? "٣. منفذ" : "3. EXECUTOR")}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight font-bold">
                        {t.roles[role]}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase rounded-lg px-2.5 py-1 shrink-0 ${occupied ? 'bg-slate-900 text-slate-600' : 'bg-cyan-400 text-slate-950 shadow-sm'}`}>
                    {occupied ? t.full : t.join}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RED PHOENIX TEAM */}
        <div className="bg-slate-905 border-4 border-slate-900 rounded-3xl p-5 shadow-lg relative">
          <h3 className="text-pink-400 font-black text-sm tracking-wide mb-3 uppercase flex items-center justify-between">
            <span>{t.birdTeam}</span>
            <span className="text-[10px] bg-pink-950 border border-pink-850 text-pink-300 px-2 py-0.5 rounded-md font-bold">
              {state.teams.red.score} PTS
            </span>
          </h3>

          <div className="grid grid-cols-1 gap-2">
            {([1, 2, 3] as const).map((role) => {
              const occupied = state.teams.red.players[role];
              return (
                <button
                  key={role}
                  onClick={() => handleSelect('red', role)}
                  disabled={!!occupied}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition duration-200 flex items-center justify-between cursor-pointer ${
                    occupied
                      ? "bg-slate-950 border-slate-950 opacity-40 cursor-not-allowed text-slate-500"
                      : "bg-slate-950/70 border-slate-900 hover:border-pink-400 hover:bg-slate-900/50"
                  }`}
                  style={{ textAlign: isRtl ? 'right' : 'left' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${occupied ? 'bg-slate-900 text-slate-700' : 'bg-pink-500/10 text-pink-300'}`}>
                      {occupied ? <UserCheck size={14} /> : <Users size={14} />}
                    </div>
                    <div>
                      <span className="text-xs font-black block text-slate-100">
                        {role === 1 ? (isRtl ? "١. مراقب" : "1. OBSERVER") : role === 2 ? (isRtl ? "٢. متحدث" : "2. MESSENGER") : (isRtl ? "٣. منفذ" : "3. EXECUTOR")}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight font-bold">
                        {t.roles[role]}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase rounded-lg px-2.5 py-1 shrink-0 ${occupied ? 'bg-slate-900 text-slate-600' : 'bg-pink-400 text-slate-950 shadow-sm'}`}>
                    {occupied ? t.full : t.join}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
