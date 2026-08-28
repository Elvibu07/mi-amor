import React, { useState } from 'react';
import { MissionItem, AchievementItem, UserProfile } from '../types';
import { playCutePop, playWinSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface MisionesViewProps {
  missions: MissionItem[];
  achievements: AchievementItem[];
  onAddMission: (mission: MissionItem) => void;
  onCompleteMission: (id: string) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

export const MisionesView: React.FC<MisionesViewProps> = ({
  missions,
  achievements,
  onAddMission,
  onCompleteMission,
  sapoProfile,
  miReyProfile,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<'calma' | 'importante' | 'urgente'>('importante');
  const [author, setAuthor] = useState<'Sapo' | 'Mi Rey'>('Sapo');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMis: MissionItem = {
      id: 'mis-' + Date.now(),
      title: title.trim(),
      description: '',
      urgency,
      author,
      progress: 0,
      isCompleted: false,
    };

    onAddMission(newMis);
    playCutePop();
    setTitle('');
    setIsModalOpen(false);
  };

  const handleComplete = (id: string) => {
    onCompleteMission(id);
    playWinSound();
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#FF5470', '#FFC145', '#6FCF97', '#ffb2b8'],
    });
  };

  const activeMissions = missions.filter((m) => !m.isCompleted);

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32 text-white">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
        {/* Misiones Activas Section */}
        <div>
          <h2 className="font-headline-md text-[#ffb2b8] mb-4 px-1 flex items-center gap-2 text-2xl font-bold">
            <span className="material-symbols-outlined text-[#ff5470]">swords</span>
            Misiones Activas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeMissions.map((mis) => {
              const isUrgent = mis.urgency === 'urgente';
              const isCalma = mis.urgency === 'calma';

              return (
                <div
                  key={mis.id}
                  className="bg-[#2E2247] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative min-h-[190px] border border-white/5 hover:border-white/10 transition-all group"
                >
                  {/* Top Row with Urgency indicator & Author */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          isUrgent
                            ? 'bg-[#FF5470] shadow-[0_0_8px_#FF5470] animate-pulse'
                            : isCalma
                            ? 'bg-[#6FCF97] shadow-[0_0_8px_#6FCF97]'
                            : 'bg-[#FFC145] shadow-[0_0_8px_#FFC145]'
                        }`}
                        title={`Urgencia: ${mis.urgency || 'importante'}`}
                      ></div>
                      <span
                        className={`font-label-mono text-[11px] uppercase font-bold tracking-wider ${
                          isUrgent
                            ? 'text-[#ffb2b8]'
                            : isCalma
                            ? 'text-[#6FCF97]'
                            : 'text-[#FFC145]'
                        }`}
                      >
                        {isUrgent ? 'Urgente' : isCalma ? 'Con Calma' : 'Importante'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <img
                        alt={mis.author}
                        className="w-6 h-6 rounded-full border border-[#ffb2b8] opacity-85 object-cover"
                        src={mis.author === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar}
                      />
                      <span className="text-[11px] text-[#e2bec0] font-label-mono uppercase">
                        {mis.author}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <p className="font-body-md text-[#eaddff] flex-grow text-center flex items-center justify-center my-4 leading-snug px-2 text-sm sm:text-base">
                    {mis.title}
                  </p>

                  {/* Action Button styled per urgency */}
                  <button
                    onClick={() => handleComplete(mis.id)}
                    className={`w-full py-2.5 rounded-lg border font-label-caps text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                      isUrgent
                        ? 'border-[#FF5470] text-[#FF5470] hover:bg-[#FF5470]/15'
                        : isCalma
                        ? 'border-[#6FCF97] text-[#6FCF97] hover:bg-[#6FCF97]/15'
                        : 'border-[#FFC145] text-[#FFC145] hover:bg-[#FFC145]/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Completar Misión
                  </button>
                </div>
              );
            })}
          </div>

          {activeMissions.length === 0 && (
            <div className="bg-[#2E2247]/50 rounded-2xl p-8 text-center text-[#e2bec0] border border-dashed border-[#5a4042]/30">
              <span className="text-3xl block mb-2">🎉</span>
              <p className="font-headline-md text-white text-base">¡Todas las misiones completadas!</p>
              <p className="text-xs text-[#e2bec0]/70 mt-1">Usa el botón para registrar un nuevo objetivo.</p>
            </div>
          )}
        </div>

        {/* Vitrina de Logros Section */}
        <div>
          <h2 className="font-headline-md text-[#fabc41] mb-4 px-1 flex items-center gap-2 text-2xl font-bold">
            <span
              className="material-symbols-outlined text-[#fabc41]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            Vitrina de Logros
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Achievement Card 1 */}
            <div className="bg-[#1A1229] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border border-white/5 hover:border-white/10 hover:scale-105 transition-all">
              <span
                className="material-symbols-outlined text-[48px] text-[#FFC145]"
                style={{
                  fontVariationSettings: "'FILL' 1",
                  filter: 'drop-shadow(0 0 12px rgba(255,193,69,0.4))',
                }}
              >
                emoji_events
              </span>
              <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                Comunicación
              </span>
            </div>

            {/* Achievement Card 2 */}
            <div className="bg-[#1A1229] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border border-white/5 hover:border-white/10 hover:scale-105 transition-all">
              <span
                className="material-symbols-outlined text-[48px] text-[#6FCF97]"
                style={{
                  fontVariationSettings: "'FILL' 1",
                  filter: 'drop-shadow(0 0 12px rgba(111,207,151,0.4))',
                }}
              >
                lock_open
              </span>
              <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                Paciencia
              </span>
            </div>

            {/* Achievement Card 3 */}
            <div className="bg-[#1A1229] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border border-white/5 hover:border-white/10 hover:scale-105 transition-all">
              <span
                className="material-symbols-outlined text-[48px] text-[#FF5470]"
                style={{
                  fontVariationSettings: "'FILL' 1",
                  filter: 'drop-shadow(0 0 12px rgba(255,84,112,0.4))',
                }}
              >
                favorite
              </span>
              <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                Compromiso
              </span>
            </div>

            {/* Achievement Card 4 */}
            <div className="bg-[#1A1229] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border border-white/5 hover:border-white/10 hover:scale-105 transition-all">
              <span
                className="material-symbols-outlined text-[48px] text-[#FFC145]"
                style={{
                  fontVariationSettings: "'FILL' 1",
                  filter: 'drop-shadow(0 0 12px rgba(255,193,69,0.4))',
                }}
              >
                flight_takeoff
              </span>
              <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                Reencuentro
              </span>
            </div>
          </div>
        </div>

        {/* FAB (Floating Action Button) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 md:bottom-12 right-6 md:right-8 h-14 px-6 rounded-full bg-[#FF5470] text-white shadow-[0_8px_30px_rgba(255,84,112,0.4)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform z-40 font-bold border border-white/20 cursor-pointer"
        >
          <span className="text-2xl font-bold leading-none mb-0.5">+</span>
          <span className="font-label-caps tracking-wider text-xs md:text-sm uppercase">
            NUEVA MISIÓN
          </span>
        </button>

        {/* Footer quote */}
        <div className="mt-12 mb-4 text-center">
          <p className="font-label-mono text-[10px] text-[#e2bec0]/40 uppercase tracking-widest">
            Your private sanctuary since 2022
          </p>
        </div>
      </div>

      {/* New Mission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#2E2247] rounded-3xl shadow-2xl border border-[#5a4042]/30 flex flex-col overflow-hidden text-white animate-pop">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#5a4042]/20 bg-[#2E2247]">
              <h2 className="font-headline-md text-xl text-white tracking-tight">
                ⚔️ Nueva Misión a Mejorar
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center text-[#e2bec0] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider">
                  Objetivo o tema a mejorar:
                </label>
                <textarea
                  required
                  rows={4}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#201439] text-white font-body-md text-base rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5470] placeholder-[#e2bec0]/50 shadow-inner border border-[#5a4042]/30"
                  placeholder="Ej. Siento que a veces nos desconectamos un poco durante la semana..."
                ></textarea>
              </div>

              {/* Urgency Selector */}
              <div className="flex flex-col gap-2">
                <label className="font-label-mono text-xs text-[#e2bec0] uppercase tracking-wider">
                  Categoría de Urgencia:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUrgency('calma')}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                      urgency === 'calma'
                        ? 'bg-[#6FCF97]/20 border-[#6FCF97] text-[#6FCF97] font-bold shadow-[0_0_12px_rgba(111,207,151,0.3)]'
                        : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#6FCF97] shadow-[0_0_8px_#6FCF97]"></div>
                    <span className="text-xs font-label-caps">Con calma</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('importante')}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                      urgency === 'importante'
                        ? 'bg-[#FFC145]/20 border-[#FFC145] text-[#FFC145] font-bold shadow-[0_0_12px_rgba(255,193,69,0.3)]'
                        : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FFC145] shadow-[0_0_8px_#FFC145]"></div>
                    <span className="text-xs font-label-caps">Importante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('urgente')}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                      urgency === 'urgente'
                        ? 'bg-[#FF5470]/20 border-[#FF5470] text-[#FF5470] font-bold shadow-[0_0_12px_rgba(255,84,112,0.3)]'
                        : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5470] shadow-[0_0_8px_#FF5470] animate-pulse"></div>
                    <span className="text-xs font-label-caps">Urgente</span>
                  </button>
                </div>
              </div>

              {/* Author Selection */}
              <div className="flex flex-col gap-2">
                <span className="font-label-caps text-xs text-[#e2bec0] uppercase">
                  ¿Quién lo registra?
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthor('Sapo')}
                    className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      author === 'Sapo'
                        ? 'bg-[#201439] border-[#6FCF97] shadow-[0_0_12px_rgba(111,207,151,0.3)] ring-1 ring-[#6FCF97]'
                        : 'bg-[#201439]/50 border-transparent opacity-60'
                    }`}
                  >
                    <img
                      alt="Sapo"
                      src={sapoProfile.avatar}
                      className="w-8 h-8 rounded-full object-cover border border-[#6FCF97]"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Sapo 🐸</span>
                      <span className="text-[10px] text-[#6FCF97] font-label-mono">Guayaquil</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthor('Mi Rey')}
                    className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      author === 'Mi Rey'
                        ? 'bg-[#201439] border-[#FFC145] shadow-[0_0_12px_rgba(255,193,69,0.3)] ring-1 ring-[#FFC145]'
                        : 'bg-[#201439]/50 border-transparent opacity-60'
                    }`}
                  >
                    <img
                      alt="Mi Rey"
                      src={miReyProfile.avatar}
                      className="w-8 h-8 rounded-full object-cover border border-[#FFC145]"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Mi Rey 👑</span>
                      <span className="text-[10px] text-[#FFC145] font-label-mono">Madrid</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#FF5470] hover:bg-[#ff6b84] text-white font-headline-md text-base py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <span>Guardar Misión</span>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
