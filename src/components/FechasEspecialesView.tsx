import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface FechasEspecialesViewProps {
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  daysToReunion: number;
  onUpdateDays: (n: number) => void;
  reunionDate?: string;          // ISO date string e.g. '2026-11-15'
  onUpdateReunionDate?: (iso: string) => void;
  gyeTime: string;
  argTime: string;
}

// ── Hardcoded special dates ───────────────────────────────────────────────────
const ANNIVERSARY_DATE = new Date('2024-07-27T00:00:00');
const SAPO_BIRTHDAY = { month: 6, day: 7, year: 2005 };   // June 7
const MIREY_BIRTHDAY = { month: 3, day: 28, year: 2001 };  // March 28

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function nextOccurrence(month: number, day: number, from: Date = new Date()) {
  const thisYear = new Date(from.getFullYear(), month - 1, day);
  if (thisYear >= from) return thisYear;
  return new Date(from.getFullYear() + 1, month - 1, day);
}

function isToday(date: Date) {
  const now = new Date();
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
}

function formatCountdown(days: number) {
  if (days === 0) return { label: '¡HOY! 🎉', days: 0, isToday: true };
  if (days === 1) return { label: 'Mañana', days: 1, isToday: false };
  return { label: `${days} días`, days, isToday: false };
}

// ── Sub-components ────────────────────────────────────────────────────────────
interface CounterCardProps {
  icon: string;
  emoji: string;
  title: string;
  subtitle: string;
  valueLabel: string;
  value: string | number;
  accent: string;
  bg: string;
  isToday?: boolean;
  big?: boolean;
  avatar?: string;
}

const CounterCard: React.FC<CounterCardProps> = ({
  icon, emoji, title, subtitle, valueLabel, value, accent, bg, isToday: today, big, avatar
}) => (
  <div
    className={`relative rounded-[2rem] p-6 border overflow-hidden flex flex-col gap-3 transition-all hover:scale-[1.02] ${
      today ? 'animate-pulse ring-2' : ''
    } ${big ? 'md:col-span-2' : ''}`}
    style={{
      background: bg,
      borderColor: today ? accent : `${accent}30`,
      boxShadow: today ? `0 0 30px ${accent}40` : `0 4px 20px ${accent}15`,
      ringColor: today ? accent : undefined,
    }}
  >
    {/* Background glow */}
    <div
      className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
      style={{ background: accent }}
    />

    <div className="flex items-start justify-between relative z-10">
      <div className="flex items-center gap-2">
        {avatar ? (
          <img
            src={avatar}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
            style={{ border: `2px solid ${accent}40`, background: `${accent}20` }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}
          >
            {emoji}
          </div>
        )}
        <div>
          <p className="font-headline-md text-white font-bold text-sm leading-tight">{title}</p>
          <p className="font-label-mono text-[10px] uppercase tracking-wider" style={{ color: `${accent}cc` }}>
            {subtitle}
          </p>
        </div>
      </div>
      <span className="material-symbols-outlined text-lg" style={{ color: `${accent}80` }}>{icon}</span>
    </div>

    <div className="relative z-10 mt-auto">
      <p className="font-label-mono text-[11px] uppercase tracking-widest mb-1" style={{ color: `${accent}80` }}>
        {valueLabel}
      </p>
      <p
        className="font-display-lg leading-none"
        style={{
          color: accent,
          fontSize: big ? '3.5rem' : '2.5rem',
          textShadow: `0 0 20px ${accent}60`,
        }}
      >
        {value}
      </p>
    </div>

    {today && (
      <div
        className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-label-caps uppercase tracking-wider text-white"
        style={{ background: accent }}
      >
        ¡Hoy! 🎉
      </div>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const FechasEspecialesView: React.FC<FechasEspecialesViewProps> = ({
  sapoProfile,
  miReyProfile,
  daysToReunion,
  onUpdateDays,
  reunionDate,
  onUpdateReunionDate,
  gyeTime,
  argTime,
}) => {
  const now = useMemo(() => new Date(), []);

  // ── Reunion date picker state ─────────────────────────────────────────────
  const todayISO = new Date().toISOString().split('T')[0];
  const [reunionDateLocal, setReunionDateLocal] = useState<string>(() => {
    // If a date was passed in, use it; otherwise compute from daysToReunion
    if (reunionDate) return reunionDate;
    const d = new Date();
    d.setDate(d.getDate() + daysToReunion);
    return d.toISOString().split('T')[0];
  });

  // Keep days-to-reunion in sync whenever the date changes
  const handleDateChange = (iso: string) => {
    setReunionDateLocal(iso);
    const target = new Date(iso + 'T00:00:00');
    const days = Math.max(0, Math.ceil((target.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)));
    onUpdateDays(days);
    onUpdateReunionDate?.(iso);
  };

  // Pretty formatted date for display
  const reunionDateDisplay = reunionDateLocal
    ? new Date(reunionDateLocal + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  // ── Days together ─────────────────────────────────────────────────────────
  const daysTogether = daysBetween(ANNIVERSARY_DATE, now);
  const monthsTogether = Math.floor(daysTogether / 30.44);

  // ── Mesiversario ──────────────────────────────────────────────────────────
  // Next 27th of each month
  const nextMesi = useMemo(() => {
    const d = new Date(now);
    d.setDate(27);
    if (d <= now) d.setMonth(d.getMonth() + 1);
    return d;
  }, [now]);
  const daysToMesi = daysBetween(now, nextMesi);
  const todayIsMesi = now.getDate() === 27;

  // ── Birthdays ─────────────────────────────────────────────────────────────
  const nextSapoBday = nextOccurrence(SAPO_BIRTHDAY.month, SAPO_BIRTHDAY.day, now);
  const nextMiReyBday = nextOccurrence(MIREY_BIRTHDAY.month, MIREY_BIRTHDAY.day, now);
  const daysToSapoBday = daysBetween(now, nextSapoBday);
  const daysToMiReyBday = daysBetween(now, nextMiReyBday);

  const sapoAge = now.getFullYear() - SAPO_BIRTHDAY.year - (
    (now.getMonth() + 1 < SAPO_BIRTHDAY.month || (now.getMonth() + 1 === SAPO_BIRTHDAY.month && now.getDate() < SAPO_BIRTHDAY.day)) ? 1 : 0
  );
  const miReyAge = now.getFullYear() - MIREY_BIRTHDAY.year - (
    (now.getMonth() + 1 < MIREY_BIRTHDAY.month || (now.getMonth() + 1 === MIREY_BIRTHDAY.month && now.getDate() < MIREY_BIRTHDAY.day)) ? 1 : 0
  );

  // ── Confetti on special days ──────────────────────────────────────────────
  const confettiFired = useRef(false);
  useEffect(() => {
    if (confettiFired.current) return;
    const isBday = isToday(nextSapoBday) || isToday(nextMiReyBday);
    if (todayIsMesi || isBday) {
      confettiFired.current = true;
      setTimeout(() => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#ff5470', '#fabc41', '#7adaa1', '#ffb2b8', '#a78bfa'] });
      }, 800);
    }
  }, [todayIsMesi, nextSapoBday, nextMiReyBday]);

  // ── Reunion editing ───────────────────────────────────────────────────────
  const handleReunionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0) onUpdateDays(v);
  };

  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const sapoDate = `${String(SAPO_BIRTHDAY.day).padStart(2, '0')} ${monthNames[SAPO_BIRTHDAY.month - 1]}`;
  const miReyDate = `${String(MIREY_BIRTHDAY.day).padStart(2, '0')} ${monthNames[MIREY_BIRTHDAY.month - 1]}`;
  const anivDate = `27 jul`;

  return (
    <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#ff5470]/15 border border-[#ff5470]/30 px-4 py-1.5 rounded-full mb-3">
          <span className="material-symbols-outlined text-[#ff5470] text-sm">date_range</span>
          <span className="font-label-caps text-xs uppercase tracking-widest text-[#ffb2b8]">Fechas Especiales</span>
        </div>
        <h1 className="font-display-lg text-3xl md:text-4xl text-white">Nuestro Tiempo Juntos</h1>
        <p className="font-body-md text-[#e2bec0]/60 mt-2 text-sm">
          Cada día cuenta, cada momento importa 💕
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Days together — HERO CARD */}
        <CounterCard
          icon="favorite"
          emoji="💑"
          title="Días Juntos"
          subtitle={`Desde el ${anivDate} 2024`}
          valueLabel="días enamorados"
          value={daysTogether.toLocaleString('es-ES')}
          accent="#ff5470"
          bg="linear-gradient(135deg, #2E2247 0%, #3d1f35 100%)"
          big
        />

        {/* Months together */}
        <CounterCard
          icon="calendar_month"
          emoji="🌙"
          title={`Mes #${monthsTogether + 1}`}
          subtitle={`Próximo: 27 sep`}
          valueLabel={`días para el mesiversario`}
          value={todayIsMesi ? '¡HOY!' : daysToMesi}
          accent="#a78bfa"
          bg="linear-gradient(135deg, #2E2247 0%, #241b47 100%)"
          isToday={todayIsMesi}
        />

        {/* Sapo birthday */}
        <CounterCard
          icon="cake"
          emoji="🎂"
          avatar={sapoProfile.avatar}
          title={`Cumple de ${sapoProfile.name} ❤️`}
          subtitle={`${sapoDate} • ${sapoAge + 1} añitos`}
          valueLabel={isToday(nextSapoBday) ? '¡Feliz cumple! 🎉' : 'días restantes'}
          value={isToday(nextSapoBday) ? '🎂' : daysToSapoBday}
          accent="#7adaa1"
          bg="linear-gradient(135deg, #2E2247 0%, #1a2e28 100%)"
          isToday={isToday(nextSapoBday)}
        />

        {/* Mi Rey birthday */}
        <CounterCard
          icon="cake"
          emoji="🎂"
          avatar={miReyProfile.avatar}
          title={`Cumple de ${miReyProfile.name} ❤️`}
          subtitle={`${miReyDate} • ${miReyAge + 1} añitos`}
          valueLabel={isToday(nextMiReyBday) ? '¡Feliz cumple! 🎉' : 'días restantes'}
          value={isToday(nextMiReyBday) ? '🎂' : daysToMiReyBday}
          accent="#fabc41"
          bg="linear-gradient(135deg, #2E2247 0%, #2e2a14 100%)"
          isToday={isToday(nextMiReyBday)}
        />
      </div>

      {/* Reunion countdown — editable */}
      <div className="bg-[#2E2247] rounded-[2rem] border border-[#ff5470]/20 p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-[#ff5470]/15 border border-[#ff5470]/30 flex items-center justify-center text-2xl">
            ✈️
          </div>
          <div>
            <p className="font-headline-md text-white font-bold">Cuenta Regresiva al Reencuentro</p>
            <p className="font-label-mono text-xs text-[#ffb2b8]/60 uppercase tracking-wider mt-0.5">
              El día que todo cambia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p
              className="font-display-lg text-[3.5rem] leading-none text-[#ff5470]"
              style={{ textShadow: '0 0 20px #ff547060' }}
            >
              {daysToReunion}
            </p>
            <p className="font-label-mono text-[10px] text-[#ffb2b8]/60 uppercase tracking-widest mt-1">días</p>
          </div>

          <div className="w-px h-16 bg-[#ff5470]/20 hidden sm:block"></div>

          {/* Date picker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[9px] uppercase tracking-wider text-[#ffb2b8]/70">Fecha del vuelo</label>
            <input
              type="date"
              value={reunionDateLocal}
              min={todayISO}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-[#221934] border border-[#ff5470]/30 rounded-xl px-4 py-2.5 text-white font-label-mono text-sm focus:outline-none focus:border-[#ff5470]/60 cursor-pointer shadow-inner"
              style={{ colorScheme: 'dark' }}
            />
            {reunionDateLocal && (
              <p className="text-[10px] text-[#ffb2b8]/50 capitalize mt-0.5">
                {reunionDateDisplay}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dual clocks mini */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {[
          { label: `${sapoProfile.city} ${sapoProfile.country === 'Ecuador' ? '🇪🇨' : sapoProfile.country === 'Argentina' ? '🇦🇷' : '🌍'}`, time: gyeTime, name: sapoProfile.name, accent: '#7adaa1', avatar: sapoProfile.avatar },
          { label: `${miReyProfile.city} ${miReyProfile.country === 'Argentina' ? '🇦🇷' : miReyProfile.country === 'Ecuador' ? '🇪🇨' : '🌍'}`, time: argTime, name: miReyProfile.name, accent: '#fabc41', avatar: miReyProfile.avatar },
        ].map((c) => (
          <div key={c.name} className="bg-[#2E2247] rounded-2xl p-4 border border-[#5a4042]/20 flex items-center gap-3">
            <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${c.accent}50` }} />
            <div>
              <p className="font-label-mono text-[10px] uppercase tracking-widest" style={{ color: c.accent }}>{c.label}</p>
              <p className="font-['IBM_Plex_Mono',monospace] text-xl text-white font-bold">{c.time}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
