import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { playCutePop } from '../utils/audio';

interface CountdownViewProps {
  daysToReunion: number;
  onUpdateDays: (days: number) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  gyeTime: string;
  argTime: string;
}

export const CountdownView: React.FC<CountdownViewProps> = ({
  daysToReunion,
  onUpdateDays,
  sapoProfile,
  miReyProfile,
  gyeTime,
  argTime,
}) => {
  const [seconds, setSeconds] = useState(45);
  const [minutes, setMinutes] = useState(30);
  const [hours, setHours] = useState(14);
  const [isEditing, setIsEditing] = useState(false);
  const [tempDays, setTempDays] = useState(daysToReunion.toString());

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prevSec) => {
        if (prevSec <= 0) {
          setMinutes((prevMin) => {
            if (prevMin <= 0) {
              setHours((prevH) => (prevH <= 0 ? 23 : prevH - 1));
              return 59;
            }
            return prevMin - 1;
          });
          return 59;
        }
        return prevSec - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveDays = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(tempDays, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateDays(val);
      playCutePop();
    }
    setIsEditing(false);
  };

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#180c30] pb-32 flex flex-col items-center justify-center">
      <div className="flex flex-col w-full max-w-3xl items-center justify-center mx-auto">
        {/* Main Countdown Card */}
        <div className="relative w-full bg-[#2f2348] rounded-[3rem] p-6 md:p-12 shadow-2xl overflow-hidden border border-[#5a4042]/30 text-center">
          {/* Ambient Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#ff5470]/10 via-[#fabc41]/10 to-[#7adaa1]/10 blur-2xl -z-10 rounded-full opacity-60"></div>

          {/* Top Status */}
          <div className="flex justify-between items-center w-full mb-6 opacity-80 px-2">
            <span className="font-label-mono text-xs text-[#e2bec0] tracking-[0.2em] uppercase">
              Status: In-Progress
            </span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ff5470] animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-[#fabc41] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-[#7adaa1] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2 mb-8">
            <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl text-[#fabc41] tracking-tight">
              Próximo Reencuentro
            </h1>
            <span className="block font-headline-md text-base sm:text-xl text-[#e2bec0] font-normal">
              Guayaquil <span className="text-[#fabc41] mx-2 font-bold">⇄</span> Argentina
            </span>
          </div>

          {/* Countdown Blocks */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 my-8">
            {/* Days */}
            <div className="flex flex-col items-center justify-center bg-[#25193d] rounded-2xl p-3 sm:p-5 shadow-inner border border-[#5a4042]/20 relative group hover:border-[#ff5470]/40 transition-colors">
              <span className="font-display-lg text-3xl sm:text-5xl md:text-6xl text-white tabular-nums">
                {daysToReunion}
              </span>
              <span className="font-label-caps text-[10px] sm:text-xs text-[#e2bec0] uppercase mt-1">
                Días
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center justify-center bg-[#25193d] rounded-2xl p-3 sm:p-5 shadow-inner border border-[#5a4042]/20 relative group hover:border-[#fabc41]/40 transition-colors">
              <span className="font-display-lg text-3xl sm:text-5xl md:text-6xl text-white tabular-nums">
                {hours.toString().padStart(2, '0')}
              </span>
              <span className="font-label-caps text-[10px] sm:text-xs text-[#e2bec0] uppercase mt-1">
                Horas
              </span>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center justify-center bg-[#25193d] rounded-2xl p-3 sm:p-5 shadow-inner border border-[#5a4042]/20 relative group hover:border-[#7adaa1]/40 transition-colors">
              <span className="font-display-lg text-3xl sm:text-5xl md:text-6xl text-white tabular-nums">
                {minutes.toString().padStart(2, '0')}
              </span>
              <span className="font-label-caps text-[10px] sm:text-xs text-[#e2bec0] uppercase mt-1">
                Min
              </span>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center justify-center bg-[#25193d] rounded-2xl p-3 sm:p-5 shadow-inner border border-[#5a4042]/20 relative group hover:border-[#ff5470]/60 transition-colors overflow-hidden">
              <span className="font-display-lg text-3xl sm:text-5xl md:text-6xl text-[#ff5470] tabular-nums animate-pulse">
                {seconds.toString().padStart(2, '0')}
              </span>
              <span className="font-label-caps text-[10px] sm:text-xs text-[#ff5470] uppercase mt-1 font-bold">
                Seg
              </span>
            </div>
          </div>

          {/* Visual Journey Progress */}
          <div className="w-full space-y-2 mt-6 px-2">
            <div className="flex justify-between items-center font-label-mono text-xs text-[#e2bec0]">
              <span>Journey Progress</span>
              <span className="text-[#fabc41] font-bold">68%</span>
            </div>
            <div className="h-3.5 w-full bg-[#201439] rounded-full overflow-hidden shadow-inner border border-[#5a4042]/20 relative">
              <div
                className="h-full bg-[#ff5470] rounded-full relative overflow-hidden"
                style={{ width: '68%' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Romantic Quote */}
          <div className="pt-6 pb-2">
            <p className="font-body-lg text-base md:text-lg text-[#eaddff] italic opacity-90">
              "Cada segundo nos acerca más. No importa la distancia."
            </p>
          </div>

          {/* Edit date button */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => {
                setIsEditing(true);
                setTempDays(daysToReunion.toString());
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-transparent border-2 border-[#fabc41]/40 text-[#fabc41] font-label-caps text-xs uppercase tracking-wider hover:bg-[#fabc41]/10 hover:border-[#fabc41] transition-all active:scale-95 group font-bold"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">
                edit_calendar
              </span>
              Editar fecha de reencuentro
            </button>
          </div>

          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-lg"></div>
        </div>

        {/* Airport Flight Cards */}
        <div className="w-full max-w-3xl mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#2f2348] rounded-2xl p-4 flex items-center gap-4 border border-[#5a4042]/20 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#25193d] flex items-center justify-center text-[#7adaa1]">
              <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
            </div>
            <div>
              <div className="font-label-caps text-[10px] text-[#e2bec0] uppercase tracking-wider">
                Salida • {gyeTime}
              </div>
              <div className="font-headline-md text-base text-white">GYE (Guayaquil, EC)</div>
            </div>
          </div>

          <div className="bg-[#2f2348] rounded-2xl p-4 flex items-center gap-4 border border-[#5a4042]/20 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-[#25193d] flex items-center justify-center text-[#fabc41]">
              <span className="material-symbols-outlined text-2xl">flight_land</span>
            </div>
            <div>
              <div className="font-label-caps text-[10px] text-[#fabc41] uppercase tracking-wider">
                Llegada • {argTime}
              </div>
              <div className="font-headline-md text-base text-white">ARG (Argentina, ES)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2f2348] border border-[#5a4042]/30 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl animate-pop">
            <h3 className="font-headline-lg text-xl mb-4 text-[#fabc41]">Editar Días Faltantes</h3>
            <form onSubmit={handleSaveDays} className="space-y-4">
              <div>
                <label className="block text-xs font-label-mono text-[#e2bec0] mb-1">
                  DÍAS PARA EL REENCUENTRO
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={tempDays}
                  onChange={(e) => setTempDays(e.target.value)}
                  className="w-full bg-[#201439] border border-[#5a4042]/40 rounded-xl p-3 text-white text-2xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#fabc41]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs font-label-caps uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#fabc41] text-[#422d00] font-bold text-xs font-label-caps uppercase shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
