import React, { useState, useEffect } from 'react';
import {
  ViewType, UserProfile, MemoryItem, NoteItem, MissionItem, AchievementItem,
  GameScore, GoalItem, CouponItem, LetterItem, MovieItem, SeriesItem,
} from './types';
import {
  initialProfiles, initialMemories, initialNotes, initialMissions,
  initialAchievements, initialGoals, initialCoupons,
} from './data/initialData';
import { Navigation } from './components/Navigation';
import { LoginView } from './components/LoginView';
import { LobbyView } from './components/LobbyView';
import { MemoryVaultView } from './components/MemoryVaultView';
import { MuroNotasView } from './components/MuroNotasView';
import { MetasYBoletosView } from './components/MetasYBoletosView';
import { FechasEspecialesView } from './components/FechasEspecialesView';
import { useSyncedCollection, useSyncedDoc } from './lib/useFirestore';
import { CartasView } from './components/CartasView';
import { NochePeliculasView } from './components/NochePeliculasView';
import { SalonJuegosView } from './components/SalonJuegosView';
import { TicTacToeGame } from './components/TicTacToeGame';
import { WordSearchGame } from './components/WordSearchGame';
import { BattleshipGame } from './components/BattleshipGame';
import { SettingsView } from './components/SettingsView';
import { MiniMusicPlayer } from './components/MiniMusicPlayer';
import confetti from 'canvas-confetti';
import { playHeartSound } from './utils/audio';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Session ────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<'Sapo' | 'Mi Rey' | null>(() => {
    const saved = sessionStorage.getItem('ourlobby_session');
    return saved as 'Sapo' | 'Mi Rey' | null;
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<ViewType>('lobby');

  // ── Profiles ───────────────────────────────────────────────────────────────
  const [sapoProfile, setSapoProfile] = useSyncedDoc<UserProfile>('shared', 'sapo_profile', 'ourlobby_profile_sapo', initialProfiles.sapo);
  const [miReyProfile, setMiReyProfile] = useSyncedDoc<UserProfile>('shared', 'mirey_profile', 'ourlobby_profile_mirey', initialProfiles.miRey);

  // ── Memories ───────────────────────────────────────────────────────────────
  const [memories, addMemory, updateMemory, deleteMemory] = useSyncedCollection<MemoryItem>('memories', 'ourlobby_memories', initialMemories);

  // ── Notes ──────────────────────────────────────────────────────────────────
  const [notes, addNote, updateNote] = useSyncedCollection<NoteItem>('notes', 'ourlobby_notes', initialNotes);

  // ── Goals ──────────────────────────────────────────────────────────────────
  const [goals, addGoal, updateGoal] = useSyncedCollection<GoalItem>('goals', 'ourlobby_goals', initialGoals);

  // ── Coupons ────────────────────────────────────────────────────────────────
  const [coupons, addCoupon, updateCoupon] = useSyncedCollection<CouponItem>('coupons', 'ourlobby_coupons', initialCoupons);

  // ── Missions ───────────────────────────────────────────────────────────────
  const [missions, addMission, updateMission] = useSyncedCollection<MissionItem>('missions', 'ourlobby_missions', initialMissions);

  // ── Achievements ───────────────────────────────────────────────────────────
  const [achievements] = useSyncedCollection<AchievementItem>('achievements', 'ourlobby_achievements', initialAchievements);

  // ── Letters (NEW) ──────────────────────────────────────────────────────────
  const [letters, addLetter, updateLetter] = useSyncedCollection<LetterItem>('letters', 'ourlobby_letters', []);

  // ── Movies (NEW) ───────────────────────────────────────────────────────────
  const [movies, addMovie, updateMovie] = useSyncedCollection<MovieItem>('movies', 'ourlobby_movies', []);

  // ── Series (NEW) ───────────────────────────────────────────────────────────
  const [series, addSeries, updateSeries] = useSyncedCollection<SeriesItem>('series', 'ourlobby_series', []);

  // ── Days to reunion ────────────────────────────────────────────────────────
  const [daysToReunion, setDaysToReunion] = useState<number>(() => {
    const saved = localStorage.getItem('ourlobby_reunion_days');
    return saved ? parseInt(saved, 10) : 42;
  });

  // ── Game Score ─────────────────────────────────────────────────────────────
  const [gameScore, setGameScore] = useSyncedDoc<GameScore>('shared', 'game_score', 'ourlobby_gamescore', { victoriasGYE: 0, victoriasMAD: 0 });

  // ── Dual Clocks ────────────────────────────────────────────────────────────
  const [gyeTime, setGyeTime] = useState('--:--');
  const [madTime, setMadTime] = useState('--:--');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      // Use the timezone stored in each profile (updates when they travel)
      const sapoTz = sapoProfile.timezone?.startsWith('America/') || sapoProfile.timezone?.startsWith('Europe/') || sapoProfile.timezone?.startsWith('Asia/')
        ? sapoProfile.timezone
        : 'America/Guayaquil';
      const miReyTz = miReyProfile.timezone?.startsWith('America/') || miReyProfile.timezone?.startsWith('Europe/') || miReyProfile.timezone?.startsWith('Asia/')
        ? miReyProfile.timezone
        : 'Europe/Madrid';
      setGyeTime(now.toLocaleTimeString('es-EC', { timeZone: sapoTz, hour: '2-digit', minute: '2-digit', hour12: false }));
      setMadTime(now.toLocaleTimeString('es-ES', { timeZone: miReyTz, hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTimes();
    const id = setInterval(updateTimes, 1000);
    return () => clearInterval(id);
  }, [sapoProfile.timezone, miReyProfile.timezone]);

  // ── Persist to localStorage (Only daysToReunion since others use Firebase hooks) ────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('ourlobby_reunion_days', daysToReunion.toString()); }, [daysToReunion]);

  // ── Session persistence ────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) sessionStorage.setItem('ourlobby_session', currentUser);
    else sessionStorage.removeItem('ourlobby_session');
  }, [currentUser]);

  // ── Handlers: Memories ─────────────────────────────────────────────────────
  const handleAddMemory = addMemory;

  // ── Handlers: Notes ────────────────────────────────────────────────────────
  const handleAddNote = addNote;
  const handleToggleFavoriteNote = (id: string) => {
    const n = notes.find(x => x.id === id);
    if (n) updateNote(id, { isFavorite: !n.isFavorite });
  };

  // ── Handlers: Goals ────────────────────────────────────────────────────────
  const handleAddGoal = addGoal;
  const handleToggleGoal = (id: string) => {
    const g = goals.find(x => x.id === id);
    if (g) updateGoal(id, { isCompleted: !g.isCompleted, completedAt: !g.isCompleted ? 'Cumplida con amor 💕' : undefined });
  };

  // ── Handlers: Coupons ──────────────────────────────────────────────────────
  const handleAddCoupon = addCoupon;
  const handleRedeemCoupon = (id: string) => updateCoupon(id, { isRedeemed: true, redeemedAt: `Canjeado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ✨` });
  const handleUnredeemCoupon = (id: string) => updateCoupon(id, { isRedeemed: false, redeemedAt: undefined });

  // ── Handlers: Missions ─────────────────────────────────────────────────────
  const handleAddMission = addMission;
  const handleCompleteMission = (id: string) => {
    updateMission(id, { isCompleted: true, progress: 100 });
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  };

  // ── Handlers: Letters (NEW) ────────────────────────────────────────────────
  const handleAddLetter = addLetter;
  const handleMarkLetterRead = (id: string) => updateLetter(id, { isRead: true });

  // ── Handlers: Movies (NEW) ─────────────────────────────────────────────────
  const handleAddMovie = addMovie;
  const handleUpdateMovie = updateMovie;

  // ── Handlers: Series (NEW) ─────────────────────────────────────────────────
  const handleAddSeries = addSeries;
  const handleUpdateSeries = updateSeries;

  // ── Handlers: Love & Games ─────────────────────────────────────────────────
  const handleSendLove = () => {
    playHeartSound();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 }, colors: ['#ff5470', '#fabc41', '#7adaa1', '#ffb2b8'] });
  };

  const handleUpdateScore = (winner: 'Sapo' | 'Mi Rey') =>
    setGameScore((p) => ({
      victoriasGYE: winner === 'Sapo' ? p.victoriasGYE + 1 : p.victoriasGYE,
      victoriasMAD: winner === 'Mi Rey' ? p.victoriasMAD + 1 : p.victoriasMAD,
    }));

  // ── Session: Login / Logout ────────────────────────────────────────────────
  const handleLogin = (user: 'Sapo' | 'Mi Rey') => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unreadLetters = currentUser
    ? letters.filter((l) => l.to === currentUser && !l.isRead).length
    : 0;

  const navigate = (view: ViewType) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Login Gate ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <LoginView
        sapoProfile={sapoProfile}
        miReyProfile={miReyProfile}
        onLogin={handleLogin}
      />
    );
  }

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#180c30] text-[#eaddff] font-body-md flex flex-col selection:bg-[#ff5470] selection:text-white">
      {/* Navigation */}
      <Navigation
        currentView={currentView}
        onNavigate={navigate}
        sapoProfile={sapoProfile}
        miReyProfile={miReyProfile}
        gyeTime={gyeTime}
        madTime={madTime}
        daysToReunion={daysToReunion}
        unreadLetters={unreadLetters}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Mini Player when not in lobby */}
      {currentView !== 'lobby' && (
        <MiniMusicPlayer
          currentUser={currentUser}
          sapoProfile={sapoProfile}
          miReyProfile={miReyProfile}
        />
      )}

      {/* View Router — Lobby uses CSS hidden (keeps YouTube iframe alive) */}
      <div className="flex-1">
        {/* Lobby always mounted, toggled via CSS so YouTube iframe stays alive */}
        <div className={currentView === 'lobby' ? '' : 'hidden'}>
          <LobbyView
            onNavigate={navigate}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            gyeTime={gyeTime}
            madTime={madTime}
            daysToReunion={daysToReunion}
            onSendLove={handleSendLove}
            currentUser={currentUser}
            memories={memories}
          />
        </div>

        {currentView === 'memory-vault' && (
          <MemoryVaultView
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={deleteMemory}
            onUpdateMemory={updateMemory}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
          />
        )}

        {currentView === 'muro-notas' && (
          <MuroNotasView
            notes={notes}
            onAddNote={handleAddNote}
            onToggleFavorite={handleToggleFavoriteNote}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            daysToReunion={daysToReunion}
          />
        )}

        {currentView === 'misiones' && (
          <MetasYBoletosView
            goals={goals}
            coupons={coupons}
            onAddGoal={handleAddGoal}
            onToggleGoal={handleToggleGoal}
            onAddCoupon={handleAddCoupon}
            onRedeemCoupon={handleRedeemCoupon}
            onUnredeemCoupon={handleUnredeemCoupon}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
          />
        )}

        {currentView === 'fechas-especiales' && (
          <FechasEspecialesView
            daysToReunion={daysToReunion}
            onUpdateDays={setDaysToReunion}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            gyeTime={gyeTime}
            madTime={madTime}
          />
        )}

        {currentView === 'cartas' && (
          <CartasView
            letters={letters}
            onAddLetter={handleAddLetter}
            onMarkRead={handleMarkLetterRead}
            currentUser={currentUser}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
          />
        )}

        {currentView === 'peliculas' && (
          <NochePeliculasView
            movies={movies}
            onAddMovie={handleAddMovie}
            onUpdateMovie={handleUpdateMovie}
            series={series}
            onAddSeries={handleAddSeries}
            onUpdateSeries={handleUpdateSeries}
            currentUser={currentUser}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
          />
        )}

        {currentView === 'juegos' && (
          <SalonJuegosView
            onSelectGame={(game) => { setCurrentView(game); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            gameScore={gameScore}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
          />
        )}

        {currentView === 'tictactoe' && (
          <TicTacToeGame
            onBack={() => setCurrentView('juegos')}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            onUpdateScore={handleUpdateScore}
            currentUser={currentUser || 'Sapo'}
          />
        )}

        {currentView === 'sopa-letras' && (
          <WordSearchGame
            onBack={() => setCurrentView('juegos')}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            currentUser={currentUser || 'Sapo'}
            onUpdateScore={handleUpdateScore}
          />
        )}

        {currentView === 'battleship' && (
          <BattleshipGame
            onBack={() => setCurrentView('juegos')}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            onUpdateScore={handleUpdateScore}
            currentUser={currentUser || 'Sapo'}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            sapoProfile={sapoProfile}
            miReyProfile={miReyProfile}
            onUpdateSapoProfile={setSapoProfile}
            onUpdateMiReyProfile={setMiReyProfile}
            onBackToLobby={() => setCurrentView('lobby')}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#13062b] py-8 border-t border-[#5a4042]/20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#ffb2b8]">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <span className="font-headline-md tracking-tight text-white">{sapoProfile.name} & {miReyProfile.name}</span>
          </div>
          <p className="font-body-md text-xs text-[#e2bec0]/70 text-center">
            Tu santuario privado desde 2026
          </p>
          <div className="flex items-center gap-4 text-xs font-label-caps uppercase text-[#e2bec0]">
            <button onClick={() => navigate('memory-vault')} className="hover:text-[#ffb2b8] transition-colors">Vault</button>
            <button onClick={() => navigate('cartas')} className="hover:text-[#ff5470] transition-colors flex items-center gap-1">
              Cartas
              {unreadLetters > 0 && <span className="bg-[#ff5470] text-white text-[8px] font-bold px-1 py-0.5 rounded-full">{unreadLetters}</span>}
            </button>
            <button onClick={() => navigate('juegos')} className="hover:text-[#fabc41] transition-colors">Juegos</button>
            <button onClick={() => navigate('settings')} className="hover:text-[#7adaa1] transition-colors">Config</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
