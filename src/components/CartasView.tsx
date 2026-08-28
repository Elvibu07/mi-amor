import React, { useState, useRef } from 'react';
import { LetterItem, UserProfile } from '../types';
import confetti from 'canvas-confetti';
import { playCutePop } from '../utils/audio';

interface CartasViewProps {
  letters: LetterItem[];
  onAddLetter: (letter: LetterItem) => void;
  onMarkRead: (id: string) => void;
  currentUser: 'Sapo' | 'Mi Rey';
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

const MOODS = [
  { key: 'romantic', label: 'Romántico', icon: '💕', color: '#ff5470' },
  { key: 'fun', label: 'Chistoso', icon: '😄', color: '#fabc41' },
  { key: 'grateful', label: 'Agradecido', icon: '🙏', color: '#7adaa1' },
  { key: 'missing', label: 'Te extraño', icon: '🌙', color: '#a78bfa' },
] as const;

export const CartasView: React.FC<CartasViewProps> = ({
  letters,
  onAddLetter,
  onMarkRead,
  currentUser,
  sapoProfile,
  miReyProfile,
}) => {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<LetterItem['mood']>('romantic');
  const [openLetter, setOpenLetter] = useState<LetterItem | null>(null);
  const [animOpen, setAnimOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const otherUser = currentUser === 'Sapo' ? 'Mi Rey' : 'Sapo';
  const otherProfile = currentUser === 'Sapo' ? miReyProfile : sapoProfile;
  const myProfile = currentUser === 'Sapo' ? sapoProfile : miReyProfile;

  const getName = (role: 'Sapo' | 'Mi Rey') => role === 'Sapo' ? sapoProfile.name : miReyProfile.name;

  const unreadCount = letters.filter(
    (l) => l.to === currentUser && !l.isRead
  ).length;

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return;

    const letter: LetterItem = {
      id: `letter-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      from: currentUser,
      to: otherUser,
      dateStr: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      isRead: false,
      mood,
    };

    onAddLetter(letter);
    setComposing(false);
    setTitle('');
    setBody('');
    setMood('romantic');

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 }, colors: ['#ff5470', '#fabc41', '#ffb2b8'] });
    playCutePop();
  };

  const openLetterCard = (letter: LetterItem) => {
    setOpenLetter(letter);
    setAnimOpen(false);
    setTimeout(() => setAnimOpen(true), 50);
    if (!letter.isRead && letter.to === currentUser) {
      onMarkRead(letter.id);
    }
  };

  const getMoodData = (m?: LetterItem['mood']) => MOODS.find((x) => x.key === m) ?? MOODS[0];

  const myLetters = letters.filter((l) => l.from === currentUser);
  const received = letters.filter((l) => l.to === currentUser);

  return (
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#ff5470]/15 border border-[#ff5470]/30 px-3 py-1 rounded-full mb-2">
            <span className="text-sm">💌</span>
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-[#ffb2b8]">Cartas de Amor</span>
            {unreadCount > 0 && (
              <span className="bg-[#ff5470] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="font-display-lg text-2xl md:text-3xl text-white">Para {otherProfile.name} 💕</h1>
          <p className="font-body-md text-sm text-[#e2bec0]/50 mt-1">
            Palabras que el tiempo no borrará
          </p>
        </div>
        <button
          onClick={() => { setComposing(true); setTimeout(() => titleRef.current?.focus(), 100); }}
          className="flex items-center gap-2 bg-[#ff5470] hover:bg-[#ff6b84] text-white px-4 py-2.5 rounded-2xl font-headline-md text-sm shadow-[0_4px_20px_rgba(255,84,112,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          Escribir carta
        </button>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1336] border border-[#5a4042]/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            {/* Envelope top decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff5470] w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg">
              💌
            </div>

            <button
              onClick={() => setComposing(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#221934] flex items-center justify-center text-[#e2bec0] hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="flex items-center gap-2 mb-5 mt-2">
              <img src={myProfile.avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-[#ff5470]/40" />
              <p className="font-label-mono text-xs text-[#e2bec0]/60">
                De <span className="text-[#ff5470] font-bold">{getName(currentUser)}</span> → <span className="text-white">{getName(otherUser)}</span>
              </p>
            </div>

            {/* Mood selector */}
            <div className="flex gap-2 mb-4">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-label-caps uppercase tracking-wide transition-all ${
                    mood === m.key ? 'text-white scale-105' : 'text-[#e2bec0]/50 hover:text-[#e2bec0]'
                  }`}
                  style={{
                    background: mood === m.key ? `${m.color}30` : '#221934',
                    border: `1px solid ${mood === m.key ? m.color + '60' : '#5a4042/20'}`,
                    borderColor: mood === m.key ? `${m.color}60` : '#5a4042',
                  }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la carta..."
              maxLength={80}
              className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white font-headline-md text-base placeholder-[#e2bec0]/30 focus:outline-none focus:border-[#ff5470]/50 mb-3"
            />

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Mi amor,\n\n`}
              rows={8}
              maxLength={2000}
              className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white font-body-md text-sm placeholder-[#e2bec0]/30 focus:outline-none focus:border-[#ff5470]/50 resize-none leading-relaxed mb-3"
            />

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-[#e2bec0]/30 font-label-mono">{body.length}/2000</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setComposing(false)}
                  className="px-4 py-2 rounded-xl text-sm text-[#e2bec0]/60 hover:text-[#e2bec0] bg-[#221934] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={!title.trim() || !body.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-headline-md text-white bg-[#ff5470] hover:bg-[#ff6b84] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_rgba(255,84,112,0.4)]"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  Enviar 💕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open letter modal */}
      {openLetter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setOpenLetter(null)}>
          <div
            className={`bg-[#fdf8f0] max-w-md w-full rounded-3xl p-8 shadow-2xl transition-all duration-500 relative ${
              animOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Georgia, serif', color: '#1a0a0a' }}
          >
            {/* Wax seal */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-lg"
              style={{ background: getMoodData(openLetter.mood).color }}
            >
              {getMoodData(openLetter.mood).icon}
            </div>

            <div className="text-center mt-3 mb-5">
              <p className="text-[10px] uppercase tracking-widest text-[#1a0a0a]/40" style={{ fontFamily: 'Inter, sans-serif' }}>
                {openLetter.dateStr}
              </p>
              <h2 className="text-xl font-bold mt-1 text-[#1a0a0a]">{openLetter.title}</h2>
              <p className="text-xs text-[#1a0a0a]/50 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                De {getName(openLetter.from)} • Para {getName(openLetter.to)}
              </p>
            </div>

            <div
              className="text-sm leading-[1.9] whitespace-pre-line text-[#1a0a0a]/80 max-h-72 overflow-y-auto mb-5"
              style={{ borderTop: '1px solid #1a0a0a20', borderBottom: '1px solid #1a0a0a20', padding: '1rem 0' }}
            >
              {openLetter.body}
            </div>

            <p className="text-right text-sm italic text-[#1a0a0a]/60">
              Con todo mi amor, {getName(openLetter.from)} 💕
            </p>

            <button
              onClick={() => setOpenLetter(null)}
              className="mt-4 w-full py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: getMoodData(openLetter.mood).color }}
            >
              Cerrar carta
            </button>
          </div>
        </div>
      )}

      {/* Letters grid */}
      {letters.length === 0 ? (
        <div className="text-center py-20 text-[#e2bec0]/40">
          <p className="text-5xl mb-4">💌</p>
          <p className="font-headline-md text-lg text-white/60">Aún no hay cartas</p>
          <p className="text-sm mt-2">Escribe la primera carta para {otherProfile.name} 💕</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Received */}
          {received.length > 0 && (
            <section>
              <h2 className="font-label-caps text-xs uppercase tracking-widest text-[#ffb2b8] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">mail</span>
                Cartas recibidas ({received.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {received.map((letter) => {
                  const m = getMoodData(letter.mood);
                  return (
                    <button
                      key={letter.id}
                      onClick={() => openLetterCard(letter)}
                      className="text-left bg-[#2E2247] hover:bg-[#3a2e54] border rounded-2xl p-4 transition-all hover:scale-[1.02] relative group"
                      style={{ borderColor: `${m.color}30` }}
                    >
                      {!letter.isRead && (
                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#ff5470] animate-pulse" />
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: `${m.color}20` }}
                        >
                          {m.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-headline-md text-white text-sm font-bold truncate">{letter.title}</p>
                          <p className="font-label-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: m.color }}>
                            De {getName(letter.from)} • {letter.dateStr}
                          </p>
                          <p className="text-[#e2bec0]/50 text-xs mt-1.5 line-clamp-2 leading-relaxed">{letter.body}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sent */}
          {myLetters.length > 0 && (
            <section>
              <h2 className="font-label-caps text-xs uppercase tracking-widest text-[#7adaa1] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">send</span>
                Cartas enviadas ({myLetters.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myLetters.map((letter) => {
                  const m = getMoodData(letter.mood);
                  return (
                    <button
                      key={letter.id}
                      onClick={() => openLetterCard(letter)}
                      className="text-left bg-[#2E2247]/60 hover:bg-[#2E2247] border border-[#5a4042]/20 rounded-2xl p-4 transition-all hover:scale-[1.02] opacity-80 hover:opacity-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#221934] flex items-center justify-center text-base flex-shrink-0">
                          {m.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-headline-md text-white/80 text-sm font-bold truncate">{letter.title}</p>
                          <p className="font-label-mono text-[10px] uppercase tracking-wider text-[#e2bec0]/40 mt-0.5">
                            Para {getName(letter.to)} • {letter.dateStr}
                          </p>
                          <p className="text-[#e2bec0]/40 text-xs mt-1.5 line-clamp-2 leading-relaxed">{letter.body}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
};
