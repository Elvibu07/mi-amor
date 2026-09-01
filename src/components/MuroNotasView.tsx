import React, { useState } from 'react';
import { NoteItem, UserProfile } from '../types';
import { playCutePop, playHeartSound, playWinSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface MuroNotasViewProps {
  notes: NoteItem[];
  onAddNote: (note: NoteItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  daysToReunion: number;
  currentUser?: 'Sapo' | 'Mi Rey' | null;
}

export const MuroNotasView: React.FC<MuroNotasViewProps> = ({
  notes,
  onAddNote,
  onToggleFavorite,
  onDeleteNote,
  sapoProfile,
  miReyProfile,
  daysToReunion,
  currentUser,
}) => {
  const formatDate = (dateStr: string) => {
    if (dateStr === 'Justo ahora') return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const diff = Date.now() - d.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Hoy';
      if (days === 1) return 'Ayer';
      if (days < 7) return `Hace ${days} días`;
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };
  const [activeCategory, setActiveCategory] = useState<'lindos' | 'mejorar'>(() => {
    return (sessionStorage.getItem('muro_notas_tab') as 'lindos' | 'mejorar') || 'mejorar';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ourlobby_achievements') || '[]'); } catch { return []; }
  });

  // New Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [newAuthor, setNewAuthor] = useState<'Sapo' | 'Mi Rey'>('Sapo');
  const [newUrgency, setNewUrgency] = useState<'calma' | 'importante' | 'urgente'>('importante');

  const filteredNotes = notes.filter((n) => n.category === activeCategory);
  const activeMissions = filteredNotes.filter((n) => !n.isFavorite);
  const resolvedMissions = filteredNotes.filter((n) => n.isFavorite);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const tapeColors = [
      'bg-primary/30 rotate-2',
      'bg-tertiary/30 -rotate-3',
      'bg-secondary/30 rotate-1',
      'bg-primary/30 -rotate-2',
    ];

    const randomTape = tapeColors[Math.floor(Math.random() * tapeColors.length)];
    const [tapeColor, tapeRotation] = randomTape.split(' ');

    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      text: newNoteText.trim(),
      author: currentUser || newAuthor,
      dateStr: new Date().toISOString(),
      category: activeCategory,
      urgency: activeCategory === 'mejorar' ? newUrgency : undefined,
      tapeColor,
      tapeRotation,
      isFavorite: activeCategory === 'mejorar' ? false : true,
    };

    onAddNote(newNote);
    playCutePop();
    setNewNoteText('');
    setIsModalOpen(false);
  };

  const handleCompleteMission = (id: string, isReopen?: boolean) => {
    onToggleFavorite(id);
    if (!isReopen) {
      playWinSound();
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#FF5470', '#FFC145', '#6FCF97', '#ffb2b8'],
      });
    }
  };

  const toggleAchievement = (id: string) => {
    const isUnlocked = unlockedAchievements.includes(id);
    const newUnlocked = isUnlocked
      ? unlockedAchievements.filter(x => x !== id)
      : [...unlockedAchievements, id];
    setUnlockedAchievements(newUnlocked);
    localStorage.setItem('ourlobby_achievements', JSON.stringify(newUnlocked));
    if (!isUnlocked) {
      playHeartSound();
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 }, colors: ['#fabc41'] });
    }
  };

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32 text-white">
      <div className="flex flex-col w-full relative max-w-5xl mx-auto min-h-[80vh]">
        {/* Tabs Navigation (Exact Layout from user's design) */}
        <div className="flex gap-3 mb-8 px-1 mt-2">
          <button
            onClick={() => {
              setActiveCategory('lindos');
              playCutePop();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-label-caps text-center transition-all cursor-pointer font-bold ${
              activeCategory === 'lindos'
                ? 'bg-[#FF5470] text-white shadow-md shadow-[#FF5470]/20 shadow-[0_0_20px_rgba(255,84,112,0.15)]'
                : 'bg-transparent border border-[#5a4042]/40 text-[#e2bec0] hover:bg-white/5'
            }`}
          >
            Mensajes Lindos
          </button>
          <button
            onClick={() => {
              setActiveCategory('mejorar');
              playCutePop();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-label-caps text-center transition-all cursor-pointer font-bold ${
              activeCategory === 'mejorar'
                ? 'bg-[#FF5470] text-white shadow-md shadow-[#FF5470]/20 shadow-[0_0_20px_rgba(255,84,112,0.15)]'
                : 'bg-transparent border border-[#5a4042]/40 text-[#e2bec0] hover:bg-white/5'
            }`}
          >
            Errores / Mejorar
          </button>
        </div>

        {/* --- VIEW: ERRORES / MEJORAR (Exact design with urgency categories) --- */}
        {activeCategory === 'mejorar' && (
          <div className="flex flex-col w-full">
            {/* Misiones Activas Section */}
            <div className="mb-10">
              <h2 className="font-headline-md text-[#ffb2b8] mb-4 px-1 flex items-center gap-2 text-2xl font-bold">
                <span className="material-symbols-outlined text-[#ff5470]">swords</span>
                Misiones Activas
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeMissions.map((note) => {
                  const isUrgent = note.urgency === 'urgente';
                  const isCalma = note.urgency === 'calma';

                  return (
                    <div
                      key={note.id}
                      className="bg-[#2E2247] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative min-h-[190px] border border-white/5 hover:border-white/10 transition-all group"
                    >
                      {/* Top Bar with Urgency Dot & Partner Avatar */}
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
                            title={`Urgencia: ${note.urgency || 'importante'}`}
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
                            alt={note.author}
                            className="w-6 h-6 rounded-full border border-[#ffb2b8] opacity-85 object-cover"
                            src={note.author === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar}
                          />
                          <span className="text-[11px] text-[#e2bec0] font-label-mono uppercase">
                            {note.author === 'Sapo' ? sapoProfile.name : miReyProfile.name}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="font-body-md text-[#eaddff] flex-grow text-center flex items-center justify-center my-4 leading-snug px-2 text-sm sm:text-base">
                        {note.text}
                      </p>

                      {/* Action Button styled per urgency */}
                      <button
                        onClick={() => handleCompleteMission(note.id, false)}
                        className={`w-full py-2.5 rounded-lg border font-label-caps text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
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
                <div className="bg-[#2E2247]/50 rounded-2xl p-8 text-center text-[#e2bec0] border border-dashed border-[#5a4042]/30 my-4">
                  <span className="text-3xl block mb-2">🎉</span>
                  <p className="font-headline-md text-white text-base">¡No hay misiones pendientes!</p>
                  <p className="text-xs text-[#e2bec0]/70 mt-1">Usa el botón de abajo para registrar una nueva.</p>
                </div>
              )}

              {/* Misiones Resueltas Section */}
              {resolvedMissions.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-headline-md text-[#6FCF97] mb-4 px-1 flex items-center gap-2 text-xl font-bold">
                    <span className="material-symbols-outlined text-[#6FCF97]">task_alt</span>
                    Misiones Resueltas
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-70">
                    {resolvedMissions.map((note) => (
                      <div
                        key={note.id}
                        className="bg-[#2E2247]/40 rounded-2xl p-4 flex flex-col justify-between shadow-inner relative border border-[#6FCF97]/20"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-label-mono text-[10px] uppercase text-[#6FCF97] font-bold tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">done_all</span> Resuelta
                          </span>
                          <span className="text-[10px] text-[#e2bec0]/70 font-label-mono uppercase">
                            {note.author === 'Sapo' ? sapoProfile.name : miReyProfile.name}
                          </span>
                        </div>
                        <p className="font-body-md text-[#eaddff]/80 text-center my-3 text-sm line-through decoration-[#FF5470]/50">
                          {note.text}
                        </p>
                        <button
                          onClick={() => handleCompleteMission(note.id, true)}
                          className="w-full py-1.5 rounded-lg text-[#e2bec0]/60 hover:text-[#e2bec0] text-[10px] uppercase tracking-wider font-bold transition-all"
                        >
                          Reabrir Misión
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {filteredNotes.length === 0 && (
                <div className="bg-[#2E2247]/50 rounded-2xl p-8 text-center text-[#e2bec0] border border-dashed border-[#5a4042]/30">
                  <span className="text-3xl block mb-2">🎉</span>
                  <p className="font-headline-md text-white text-base">¡No hay misiones pendientes!</p>
                  <p className="text-xs text-[#e2bec0]/70 mt-1">Usa el botón de abajo para registrar una nueva.</p>
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
                <div 
                  onClick={() => toggleAchievement('comunicacion')}
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border transition-all cursor-pointer select-none ${
                    unlockedAchievements.includes('comunicacion') 
                      ? 'bg-[#2E2247] border-[#FFC145]/30 scale-105' 
                      : 'bg-[#1A1229] border-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[48px] text-[#FFC145]"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      filter: unlockedAchievements.includes('comunicacion') ? 'drop-shadow(0 0 12px rgba(255,193,69,0.4))' : 'none',
                    }}
                  >
                    emoji_events
                  </span>
                  <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                    Comunicación
                  </span>
                </div>

                {/* Achievement Card 2 */}
                <div 
                  onClick={() => toggleAchievement('paciencia')}
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border transition-all cursor-pointer select-none ${
                    unlockedAchievements.includes('paciencia') 
                      ? 'bg-[#2E2247] border-[#6FCF97]/30 scale-105' 
                      : 'bg-[#1A1229] border-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[48px] text-[#6FCF97]"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      filter: unlockedAchievements.includes('paciencia') ? 'drop-shadow(0 0 12px rgba(111,207,151,0.4))' : 'none',
                    }}
                  >
                    lock_open
                  </span>
                  <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                    Paciencia
                  </span>
                </div>

                {/* Achievement Card 3 */}
                <div 
                  onClick={() => toggleAchievement('compromiso')}
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border transition-all cursor-pointer select-none ${
                    unlockedAchievements.includes('compromiso') 
                      ? 'bg-[#2E2247] border-[#FF5470]/30 scale-105' 
                      : 'bg-[#1A1229] border-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[48px] text-[#FF5470]"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      filter: unlockedAchievements.includes('compromiso') ? 'drop-shadow(0 0 12px rgba(255,84,112,0.4))' : 'none',
                    }}
                  >
                    favorite
                  </span>
                  <span className="font-label-caps text-[12px] text-[#e2bec0] uppercase text-center font-bold tracking-wider">
                    Compromiso
                  </span>
                </div>

                {/* Achievement Card 4 */}
                <div 
                  onClick={() => toggleAchievement('reencuentro')}
                  className={`rounded-2xl p-4 flex flex-col items-center justify-center shadow-md aspect-square gap-3 border transition-all cursor-pointer select-none ${
                    unlockedAchievements.includes('reencuentro') 
                      ? 'bg-[#2E2247] border-[#ffb2b8]/30 scale-105' 
                      : 'bg-[#1A1229] border-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[48px] text-[#ffb2b8]"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      filter: unlockedAchievements.includes('reencuentro') ? 'drop-shadow(0 0 12px rgba(255,178,184,0.4))' : 'none',
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
          </div>
        )}

        {/* --- VIEW: MENSAJES LINDOS --- */}
        {activeCategory === 'lindos' && (
          <div className="flex flex-col w-full">
            {/* Countdown Mini Card */}
            <div className="bg-[#2E2247] rounded-3xl p-6 shadow-xl relative overflow-hidden mb-8 border border-[#5a4042]/20">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h2 className="font-headline-md text-xl text-[#fabc41] font-bold">
                    Muro de Amor
                  </h2>
                  <p className="text-xs text-[#e2bec0] mt-0.5">
                    Nuestras palabras y promesas favoritas para leer cada día.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#201439] px-4 py-2 rounded-2xl border border-[#5a4042]/30">
                  <span className="text-sm font-label-caps text-[#e2bec0] uppercase">Faltan</span>
                  <span className="font-display-lg text-2xl text-[#fabc41] font-bold">{daysToReunion}</span>
                  <span className="text-sm font-label-caps text-[#e2bec0] uppercase">Días</span>
                </div>
              </div>
            </div>

            {/* Masonry Grid for Cute Notes */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="break-inside-avoid bg-[#2E2247] rounded-2xl p-6 relative flex flex-col gap-4 group hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-2xl border border-[#5a4042]/20"
                >
                  {/* Tape Accent */}
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 ${
                      note.tapeColor || 'bg-[#ffb2b8]/30'
                    } ${note.tapeRotation || 'rotate-2'} backdrop-blur-sm z-10 mix-blend-screen rounded-xs pointer-events-none shadow-sm`}
                  ></div>

                  <div className="flex-1 relative pt-2">
                    <span className="text-4xl text-[#ff5470] font-display-lg leading-none absolute top-0 left-0 opacity-40 select-none">
                      "
                    </span>
                    <p className="font-body-lg text-base md:text-lg text-[#eaddff] italic relative z-10 pl-5 pt-2 leading-relaxed">
                      {note.text}
                    </p>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>

                  {/* Author and favorite */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                      <img
                        alt={note.author}
                        src={note.author === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar}
                        className={`w-8 h-8 rounded-full object-cover shadow-sm bg-[#3a2e54] border ${
                          note.author === 'Sapo' ? 'border-[#7adaa1]' : 'border-[#fabc41]'
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-caps text-xs text-white tracking-wider uppercase font-bold">
                          {note.author === 'Sapo' ? sapoProfile.name : miReyProfile.name}
                        </span>
                        <span className="font-label-mono text-[10px] text-[#e2bec0]/70">
                          {formatDate(note.dateStr)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onDeleteNote && (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Seguro que deseas eliminar esta nota?')) {
                              onDeleteNote(note.id);
                            }
                          }}
                          className="text-[#e2bec0]/50 hover:text-[#ff5470] hover:scale-110 transition-all p-1.5 rounded-full hover:bg-white/5"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onToggleFavorite(note.id);
                          playHeartSound();
                        }}
                        className="text-[#ff5470] hover:scale-125 transition-transform p-1.5 rounded-full hover:bg-white/5"
                        title="Dar amor"
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={{ fontVariationSettings: note.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAB (Floating Action Button - Matching user's design) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 md:bottom-12 right-6 md:right-8 h-14 px-6 rounded-full bg-[#FF5470] text-white shadow-[0_8px_30px_rgba(255,84,112,0.4)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform z-40 font-bold border border-white/20 cursor-pointer"
        >
          <span className="text-2xl font-bold leading-none mb-0.5">+</span>
          <span className="font-label-caps tracking-wider text-xs md:text-sm uppercase">
            {activeCategory === 'mejorar' ? 'NUEVA MISIÓN' : 'NUEVA NOTA'}
          </span>
        </button>

        {/* Footer quote */}
        <div className="mt-12 mb-4 text-center">
          <p className="font-label-mono text-[10px] text-[#e2bec0]/40 uppercase tracking-widest">
            
          </p>
        </div>
      </div>

      {/* New Mission / New Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#2E2247] rounded-3xl shadow-2xl border border-[#5a4042]/30 flex flex-col overflow-hidden text-white animate-pop">
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#5a4042]/20 bg-[#2E2247]">
              <h2 className="font-headline-md text-xl text-white tracking-tight">
                {activeCategory === 'mejorar' ? '⚔️ Nueva Misión a Mejorar' : '💌 Dejar una nota linda'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center text-[#e2bec0] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider">
                  {activeCategory === 'mejorar' ? 'Objetivo o tema a mejorar:' : 'Mensaje:'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full bg-[#201439] text-white font-body-md text-base rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5470] placeholder-[#e2bec0]/50 shadow-inner border border-[#5a4042]/30"
                  placeholder={
                    activeCategory === 'mejorar'
                      ? 'Ej. Siento que a veces nos desconectamos un poco durante la semana...'
                      : '¿Qué quieres recordarle hoy a tu persona favorita?'
                  }
                ></textarea>
              </div>

              {/* Urgency Selector (Categoría de Urgencia) */}
              {activeCategory === 'mejorar' && (
                <div className="flex flex-col gap-2">
                  <label className="font-label-mono text-xs text-[#e2bec0] uppercase tracking-wider">
                    Categoría de Urgencia:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNewUrgency('calma')}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                        newUrgency === 'calma'
                          ? 'bg-[#6FCF97]/20 border-[#6FCF97] text-[#6FCF97] font-bold shadow-[0_0_12px_rgba(111,207,151,0.3)]'
                          : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-[#6FCF97] shadow-[0_0_8px_#6FCF97]"></div>
                      <span className="text-xs font-label-caps">Con calma</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewUrgency('importante')}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                        newUrgency === 'importante'
                          ? 'bg-[#FFC145]/20 border-[#FFC145] text-[#FFC145] font-bold shadow-[0_0_12px_rgba(255,193,69,0.3)]'
                          : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FFC145] shadow-[0_0_8px_#FFC145]"></div>
                      <span className="text-xs font-label-caps">Importante</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewUrgency('urgente')}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                        newUrgency === 'urgente'
                          ? 'bg-[#FF5470]/20 border-[#FF5470] text-[#FF5470] font-bold shadow-[0_0_12px_rgba(255,84,112,0.3)]'
                          : 'bg-[#201439] border-[#5a4042]/30 text-[#e2bec0]'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-[#FF5470] shadow-[0_0_8px_#FF5470] animate-pulse"></div>
                      <span className="text-xs font-label-caps">Urgente</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Author Selection */}
              {!currentUser && (
                <div className="flex flex-col gap-2">
                  <span className="font-label-caps text-xs text-[#e2bec0] uppercase">
                    ¿Quién lo registra?
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNewAuthor('Sapo')}
                      className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        newAuthor === 'Sapo'
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
                        <span className="text-xs font-bold text-white block">{sapoProfile.name} </span>
                        <span className="text-[10px] text-[#6FCF97] font-label-mono">{sapoProfile.city}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewAuthor('Mi Rey')}
                      className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        newAuthor === 'Mi Rey'
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
                        <span className="text-xs font-bold text-white block">{miReyProfile.name} </span>
                        <span className="text-[10px] text-[#FFC145] font-label-mono">{miReyProfile.city}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#FF5470] hover:bg-[#ff6b84] text-white font-headline-md text-base py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <span>{activeCategory === 'mejorar' ? 'Guardar Misión' : 'Pegar en el Muro'}</span>
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
