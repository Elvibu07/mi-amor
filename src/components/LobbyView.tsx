import React, { useState, useMemo } from 'react';
import { ViewType, UserProfile } from '../types';
import { playHeartSound } from '../utils/audio';
import { MusicPlayer } from './MusicPlayer';

interface LobbyViewProps {
  onNavigate: (view: ViewType) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  gyeTime: string;
  madTime: string;
  daysToReunion: number;
  onSendLove: () => void;
  currentUser: 'Sapo' | 'Mi Rey';
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onNavigate,
  sapoProfile,
  miReyProfile,
  gyeTime,
  madTime,
  daysToReunion,
  onSendLove,
  currentUser,
}) => {
  // ── Dynamic timezone difference ───────────────────────────────────────────
  const timeDiffLabel = useMemo(() => {
    try {
      const now = new Date();
      // Get the UTC offset for each timezone by comparing local midnight
      const sapoTz = sapoProfile.timezone?.includes('/') ? sapoProfile.timezone : 'America/Guayaquil';
      const miReyTz = miReyProfile.timezone?.includes('/') ? miReyProfile.timezone : 'Europe/Madrid';

      // Get hours for each timezone
      const sapoHour = parseInt(now.toLocaleString('en-US', { timeZone: sapoTz, hour: 'numeric', hour12: false }), 10);
      const miReyHour = parseInt(now.toLocaleString('en-US', { timeZone: miReyTz, hour: 'numeric', hour12: false }), 10);

      let diff = miReyHour - sapoHour;
      // Normalize to [-12, 12]
      if (diff > 12) diff -= 24;
      if (diff < -12) diff += 24;

      const absDiff = Math.abs(diff);
      const sign = diff >= 0 ? '+' : '−';
      if (absDiff === 0) return 'Misma hora 🎉';
      return `${sign}${absDiff} hora${absDiff !== 1 ? 's' : ''}`;
    } catch {
      return '± horas';
    }
  }, [sapoProfile.timezone, miReyProfile.timezone, gyeTime]); // gyeTime ticks every second

  return (
    <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto w-full">
      {/* Dual-Clock HUD */}
      <section className="bg-[#2E2247] rounded-[2rem] p-6 md:p-10 shadow-xl border border-[#5a4042]/20 flex flex-col lg:flex-row justify-between items-center relative overflow-hidden gap-6">
        {/* Guayaquil (Sapo) */}
        <div className="flex items-center gap-4 md:gap-6 z-10 w-full lg:w-auto justify-start">
          <img 
            alt="Sapo Avatar" 
            className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-[#3a2e54] object-cover shadow-xl ring-2 ring-[#7adaa1]/40" 
            src={sapoProfile.avatar}
          />
          <div className="flex flex-col">
            <span className="text-[#7adaa1] font-label-mono uppercase tracking-widest text-xs md:text-sm mb-1 md:mb-2">
              {sapoProfile.city} • {sapoProfile.country}
            </span>
            <span className="font-['IBM_Plex_Mono',monospace] text-4xl sm:text-6xl md:text-7xl text-[#eaddff] font-bold leading-none tracking-tight">
              {gyeTime}
            </span>
          </div>
        </div>

        {/* Center Countdown & Diff pill */}
        <div className="flex flex-col items-center justify-center z-10 px-4 text-center">
          <div className="bg-[#221934] px-4 py-2 rounded-full flex items-center gap-2 mb-3 shadow-inner border border-[#5a4042]/30">
            <span className="material-symbols-outlined text-[#a9898b] text-sm">schedule</span>
            <span className="text-xs text-[#e2bec0] font-label-mono uppercase tracking-wider">
              Diferencia: {timeDiffLabel}
            </span>
          </div>
          <button 
            onClick={() => onNavigate('fechas-especiales')}
            className="text-xs md:text-sm text-[#ffb2b8] font-body-md bg-[#ff5470]/15 hover:bg-[#ff5470]/25 px-5 py-2 rounded-2xl border border-[#ff5470]/30 backdrop-blur-sm transition-all hover:scale-105 group"
          >
            <span className="font-bold">{daysToReunion} días</span> para el reencuentro
            <span className="material-symbols-outlined text-xs ml-1 inline group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>
        </div>

        {/* Madrid (Mi Rey) */}
        <div className="flex items-center gap-4 md:gap-6 z-10 w-full lg:w-auto justify-end text-right">
          <div className="flex flex-col items-end">
            <span className="text-[#fabc41] font-label-mono uppercase tracking-widest text-xs md:text-sm mb-1 md:mb-2">
              {miReyProfile.city} • {miReyProfile.country}
            </span>
            <span className="font-['IBM_Plex_Mono',monospace] text-4xl sm:text-6xl md:text-7xl text-[#eaddff] font-bold leading-none tracking-tight">
              {madTime}
            </span>
          </div>
          <img 
            alt="Mi Rey Avatar" 
            className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-[#3a2e54] object-cover shadow-xl ring-2 ring-[#fabc41]/40" 
            src={miReyProfile.avatar}
          />
        </div>

        {/* Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#7adaa1]/5 via-transparent to-[#fabc41]/5 pointer-events-none"></div>
      </section>

      {/* Split Screen Section */}
      <section className="flex flex-col lg:flex-row gap-6 min-h-[460px]">
        {/* Real-time Music Player Widget (Left Column) */}
        <MusicPlayer 
          currentUser={currentUser}
          sapoProfile={sapoProfile}
          miReyProfile={miReyProfile}
        />

        {/* Featured Memory & Quick Actions (Right Column) */}
        <div className="w-full lg:w-[68%] flex flex-col gap-4">
          {/* Featured Memory Card */}
          <div 
            onClick={() => onNavigate('memory-vault')}
            className="bg-[#2E2247] rounded-[2rem] p-6 shadow-xl flex-1 relative overflow-hidden group border border-[#5a4042]/20 min-h-[300px] flex flex-col justify-between cursor-pointer"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a2e54] via-[#2E2247] to-[#1a0e3a]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#180c30]/95 via-[#180c30]/50 to-transparent"></div>

            {/* Top badge */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="bg-[#221934]/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-[#5a4042]/30">
                <span className="material-symbols-outlined text-[#ffb2b8] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="font-headline-md text-xs sm:text-sm text-white font-bold">Últimos Recuerdos</span>
              </div>
              <span className="text-xs text-[#ffb2b8] font-label-mono bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                Ver todos →
              </span>
            </div>

            {/* Bottom — empty state prompt */}
            <div className="relative z-10 mt-auto pt-16 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-4xl text-[#e2bec0]/30 mb-3">add_photo_alternate</span>
              <p className="font-body-lg text-[#e2bec0]/60 font-medium text-base sm:text-lg leading-relaxed">
                Aún no hay recuerdos. ¡Sube su primera foto juntos! 📸
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 h-auto sm:h-[76px]">
            <button 
              onClick={() => onNavigate('juegos')}
              className="bg-[#2E2247] hover:bg-[#3f3359] border border-[#5a4042]/30 rounded-2xl p-4 flex items-center justify-center gap-2 transition-all text-white font-headline-md text-base hover:-translate-y-0.5 shadow-md active:translate-y-0"
            >
              <span className="text-xl">🎮</span> Iniciar juego
            </button>
            <button 
              onClick={() => {
                onSendLove();
                playHeartSound();
              }}
              className="bg-[#2E2247] hover:bg-[#3f3359] border border-[#5a4042]/30 rounded-2xl p-4 flex items-center justify-center gap-2 transition-all text-white font-headline-md text-base hover:-translate-y-0.5 shadow-md active:translate-y-0 group"
            >
              <span className="text-xl group-hover:scale-125 transition-transform">❤️</span> Enviar cariño
            </button>
            <button 
              onClick={() => onNavigate('peliculas')}
              className="bg-[#2E2247] hover:bg-[#3f3359] border border-[#5a4042]/30 rounded-2xl p-4 flex items-center justify-center gap-2 transition-all text-white font-headline-md text-base hover:-translate-y-0.5 shadow-md active:translate-y-0"
            >
              <span className="text-xl">🍿</span> Ver película juntos
            </button>
          </div>
        </div>
      </section>

      {/* Clean Grid (Nav Cards) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Historial / Notas */}
        <button 
          onClick={() => onNavigate('muro-notas')}
          className="bg-[#2E2247] hover:bg-[#3f3359] p-5 rounded-[2rem] flex flex-col gap-4 transition-all group min-h-[160px] border border-[#5a4042]/20 text-left hover:-translate-y-1 shadow-lg"
        >
          <div className="w-12 h-12 bg-[#221934] rounded-full flex items-center justify-center text-[#e2bec0] group-hover:text-[#ffb2b8] group-hover:scale-110 transition-all shadow-inner">
            <span className="material-symbols-outlined text-[24px]">history</span>
          </div>
          <div className="mt-auto">
            <span className="font-headline-md text-base sm:text-lg text-white font-bold block">Historial</span>
            <span className="text-[11px] text-[#e2bec0]/70 font-label-mono">Muro de notas</span>
          </div>
        </button>

        {/* Memory Vault */}
        <button 
          onClick={() => onNavigate('memory-vault')}
          className="bg-[#2E2247] hover:bg-[#3f3359] p-5 rounded-[2rem] flex flex-col gap-4 transition-all group min-h-[160px] border border-[#5a4042]/20 text-left hover:-translate-y-1 shadow-lg"
        >
          <div className="w-12 h-12 bg-[#221934] rounded-full flex items-center justify-center text-[#e2bec0] group-hover:text-[#fabc41] group-hover:scale-110 transition-all shadow-inner">
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
          </div>
          <div className="mt-auto">
            <span className="font-headline-md text-base sm:text-lg text-white font-bold block">Memory Vault</span>
            <span className="text-[11px] text-[#e2bec0]/70 font-label-mono">Fotos polaroid</span>
          </div>
        </button>

        {/* Metas y Boletos */}
        <button 
          onClick={() => onNavigate('misiones')}
          className="bg-[#2E2247] hover:bg-[#3f3359] p-5 rounded-[2rem] flex flex-col gap-4 transition-all group min-h-[160px] border border-[#5a4042]/20 text-left hover:-translate-y-1 shadow-lg"
        >
          <div className="w-12 h-12 bg-[#221934] rounded-full flex items-center justify-center text-[#e2bec0] group-hover:text-[#7adaa1] group-hover:scale-110 transition-all shadow-inner">
            <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
          </div>
          <div className="mt-auto">
            <span className="font-headline-md text-base sm:text-lg text-white font-bold leading-tight block">Metas &<br />Boletos</span>
            <span className="text-[11px] text-[#e2bec0]/70 font-label-mono">Sueños & Vales</span>
          </div>
        </button>

        {/* Mejoras */}
        <button 
          onClick={() => onNavigate('muro-notas')}
          className="bg-[#2E2247] hover:bg-[#3f3359] p-5 rounded-[2rem] flex flex-col gap-4 transition-all group min-h-[160px] border border-[#5a4042]/20 text-left hover:-translate-y-1 shadow-lg"
        >
          <div className="w-12 h-12 bg-[#221934] rounded-full flex items-center justify-center text-[#e2bec0] group-hover:text-[#ffb2b8] group-hover:scale-110 transition-all shadow-inner">
            <span className="material-symbols-outlined text-[24px]">upgrade</span>
          </div>
          <div className="mt-auto">
            <span className="font-headline-md text-base sm:text-lg text-white font-bold block">Mejoras</span>
            <span className="text-[11px] text-[#e2bec0]/70 font-label-mono">Errores & temas</span>
          </div>
        </button>

        {/* Mensajes Bonitos */}
        <button 
          onClick={() => onNavigate('muro-notas')}
          className="bg-[#2E2247] hover:bg-[#3f3359] p-5 rounded-[2rem] flex flex-col gap-4 transition-all group min-h-[160px] border border-[#5a4042]/20 text-left hover:-translate-y-1 shadow-lg"
        >
          <div className="w-12 h-12 bg-[#221934] rounded-full flex items-center justify-center text-[#e2bec0] group-hover:text-[#ff5470] group-hover:scale-110 transition-all shadow-inner">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <div className="mt-auto">
            <span className="font-headline-md text-base sm:text-lg text-white font-bold leading-tight block">Mensajes<br />Bonitos</span>
          </div>
        </button>

        {/* Salón de Juegos */}
        <button 
          onClick={() => onNavigate('juegos')}
          className="bg-[#2E2247] hover:bg-[#3f3359] p-5 rounded-[2rem] flex flex-col gap-4 transition-all group min-h-[160px] border border-[#5a4042]/20 text-left hover:-translate-y-1 shadow-lg"
        >
          <div className="w-12 h-12 bg-[#221934] rounded-full flex items-center justify-center text-[#e2bec0] group-hover:text-[#fabc41] group-hover:scale-110 transition-all shadow-inner">
            <span className="material-symbols-outlined text-[24px]">sports_esports</span>
          </div>
          <div className="mt-auto">
            <span className="font-headline-md text-base sm:text-lg text-white font-bold block">Salón Juegos</span>
            <span className="text-[11px] text-[#e2bec0]/70 font-label-mono">3 minijuegos</span>
          </div>
        </button>
      </section>

    </main>
  );
};
