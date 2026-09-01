import React, { useState, useRef, useEffect } from 'react';
import { MovieItem, SeriesItem, EpisodeReview, UserProfile } from '../types';
import confetti from 'canvas-confetti';
import { playCutePop } from '../utils/audio';

interface NochePeliculasViewProps {
  movies: MovieItem[];
  onAddMovie: (movie: MovieItem) => void;
  onUpdateMovie: (id: string, update: Partial<MovieItem>) => void;
  onDeleteMovie: (id: string) => void;
  series: SeriesItem[];
  onAddSeries: (s: SeriesItem) => void;
  onUpdateSeries: (id: string, update: Partial<SeriesItem>) => void;
  onDeleteSeries: (id: string) => void;
  currentUser: 'Sapo' | 'Mi Rey';
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

const GENRES = ['Romántica', 'Comedia', 'Terror', 'Acción', 'Animación', 'Thriller', 'Drama', 'Documental', 'Sci-Fi', 'Anime', 'Fantasía'];

const STATUS_LABELS: Record<MovieItem['status'] | SeriesItem['status'], string> = {
  pendiente: 'Pendiente',
  viendo: 'Viendo ahora',
  vista: 'Ya la vimos',
  terminada: 'Terminada',
};

const STATUS_COLORS: Record<MovieItem['status'] | SeriesItem['status'], string> = {
  pendiente: '#a78bfa',
  viendo: '#fabc41',
  vista: '#7adaa1',
  terminada: '#7adaa1',
};

// ── Shared UI Components ──────────────────────────────────────────────────

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; color?: string; readonly?: boolean }> = ({
  value, onChange, color = '#fabc41', readonly = false
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        onClick={() => !readonly && onChange?.(s)}
        disabled={readonly}
        className={`transition-transform ${!readonly ? 'hover:scale-125' : ''}`}
        style={{ color: s <= value ? color : '#5a4042', cursor: readonly ? 'default' : 'pointer' }}
      >
        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: s <= value ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </span>
      </button>
    ))}
  </div>
);

const SyncCountdown: React.FC<{ title: string; onEnd: () => void }> = ({ title, onEnd }) => {
  const [count, setCount] = useState(5);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    if (count <= 0) { onEnd(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, started, onEnd]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center gap-6">
      <p className="font-label-caps text-xs uppercase tracking-widest text-[#fabc41]">🍿 Noche de Película</p>
      <p className="font-headline-md text-2xl text-white text-center px-6">"{title}"</p>

      {!started ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-[#e2bec0]/70 text-center max-w-xs">
            Cuando los dos estén listos con la película pausada en el inicio, presionen ¡Play!
          </p>
          <button
            onClick={() => setStarted(true)}
            className="flex items-center gap-2 bg-[#fabc41] hover:bg-[#ffd06b] text-[#180c30] font-headline-md font-bold px-8 py-4 rounded-2xl text-xl shadow-[0_4px_30px_rgba(250,188,65,0.5)] transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined text-2xl">play_arrow</span>
            ¡Play sincronizado!
          </button>
        </div>
      ) : count > 0 ? (
        <div
          key={count}
          className="text-[10rem] font-display-lg leading-none animate-pop"
          style={{ color: '#fabc41', textShadow: '0 0 60px #fabc4160' }}
        >
          {count}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 animate-pop">
          <p className="text-[5rem]">▶️</p>
          <p className="font-display-lg text-4xl text-white">¡PLAY!</p>
        </div>
      )}

      <button
        onClick={onEnd}
        className="text-xs text-[#e2bec0]/40 hover:text-[#e2bec0]/70 mt-4 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
export const NochePeliculasView: React.FC<NochePeliculasViewProps> = ({
  movies, onAddMovie, onUpdateMovie, onDeleteMovie,
  series, onAddSeries, onUpdateSeries, onDeleteSeries,
  currentUser, sapoProfile, miReyProfile,
}) => {
  const [activeSection, setActiveSection] = useState<'peliculas' | 'series' | 'anime'>('peliculas');
  const [tab, setTab] = useState<'pendiente' | 'viendo' | 'vista' | 'terminada' | 'todas'>('pendiente');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);

  // Movie Modals
  const [addingMovie, setAddingMovie] = useState(false);
  const [syncMovie, setSyncMovie] = useState<MovieItem | null>(null);
  const [reviewingMovie, setReviewingMovie] = useState<MovieItem | null>(null);
  const [viewingMovieComments, setViewingMovieComments] = useState<MovieItem | null>(null);

  // Series Modals
  const [addingSeries, setAddingSeries] = useState(false);
  const [loggingEpisodeFor, setLoggingEpisodeFor] = useState<SeriesItem | null>(null);
  const [viewingSeriesEpisodes, setViewingSeriesEpisodes] = useState<SeriesItem | null>(null);

  // Forms
  const [form, setForm] = useState({ title: '', genre: '', year: '', animeType: '' });
  const [seriesSeasonsConfig, setSeriesSeasonsConfig] = useState<{ seasonNumber: number; totalEpisodes: number }[]>([{ seasonNumber: 1, totalEpisodes: 12 }]);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
  const [episodeForm, setEpisodeForm] = useState({ seasonNumber: 1, episodeNumber: 1, rating: 0, comment: '' });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const seriesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedGenreFilter(null);
  }, [activeSection, tab]);

  // ── Derived Data ────────────────────────────────────────────────────────
  const getName = (role: 'Sapo' | 'Mi Rey' | 'Juntos' | string) => {
    if (role === 'Sapo') return sapoProfile.name;
    if (role === 'Mi Rey') return miReyProfile.name;
    return role;
  };

  const currentItems = activeSection === 'peliculas'
    ? movies
    : activeSection === 'anime'
      ? series.filter(s => s.isAnime)
      : series.filter(s => !s.isAnime);

  const filteredByTab = tab === 'todas'
    ? currentItems
    : currentItems.filter((i) => {
      if (activeSection === 'peliculas') return i.status === tab;
      if (activeSection === 'series' || activeSection === 'anime') {
        if (tab === 'vista') return false;
        return i.status === tab;
      }
      return false;
    });

  const filtered = selectedGenreFilter
    ? filteredByTab.filter(i => {
      if (activeSection === 'anime') {
        return (i as SeriesItem).animeType === selectedGenreFilter;
      }
      return i.genre === selectedGenreFilter;
    })
    : filteredByTab;

  const getStats = (status: string) => currentItems.filter(i => i.status === status).length;

  const availableGenres = Array.from(new Set(
    currentItems.map(i => activeSection === 'anime' ? (i as SeriesItem).animeType : i.genre).filter(Boolean)
  )) as string[];

  const tabs = activeSection === 'peliculas' ? [
    { key: 'pendiente', label: 'Pendientes', count: getStats('pendiente'), color: '#a78bfa' },
    { key: 'viendo', label: 'Viendo', count: getStats('viendo'), color: '#fabc41' },
    { key: 'vista', label: 'Vistas', count: getStats('vista'), color: '#7adaa1' },
    { key: 'todas', label: 'Todas', count: movies.length, color: '#e2bec0' },
  ] as const : [
    { key: 'pendiente', label: 'Pendientes', count: getStats('pendiente'), color: '#a78bfa' },
    { key: 'viendo', label: 'Viendo', count: getStats('viendo'), color: '#fabc41' },
    { key: 'terminada', label: 'Terminadas', count: getStats('terminada'), color: '#7adaa1' },
    { key: 'todas', label: 'Todas', count: currentItems.length, color: '#e2bec0' },
  ] as const;

  // ── Handlers: Movies ────────────────────────────────────────────────────
  const handleAddMovieSubmit = () => {
    if (!form.title.trim()) return;
    onAddMovie({
      id: `movie-${Date.now()}`,
      title: form.title.trim(),
      genre: form.genre || undefined,
      year: form.year || undefined,
      suggestedBy: currentUser,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    });
    setForm({ title: '', genre: '', year: '', animeType: '' });
    setAddingMovie(false);
    playCutePop();
  };

  const startWatchingMovie = (movie: MovieItem) => {
    onUpdateMovie(movie.id, { status: 'viendo' });
    setSyncMovie(movie);
  };

  const markMovieWatched = (movie: MovieItem) => {
    onUpdateMovie(movie.id, { status: 'vista', watchedAt: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) });
    setReviewingMovie(movie);
    setReviewData({ rating: 0, comment: '' });
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#fabc41', '#ff5470', '#7adaa1'] });
  };

  const submitMovieReview = () => {
    if (!reviewingMovie) return;
    const update: Partial<MovieItem> = currentUser === 'Sapo'
      ? { sapoRating: reviewData.rating, sapoComment: reviewData.comment || undefined }
      : { miReyRating: reviewData.rating, miReyComment: reviewData.comment || undefined };
    onUpdateMovie(reviewingMovie.id, update);
    setReviewingMovie(null);
    playCutePop();
  };

  // ── Handlers: Series ────────────────────────────────────────────────────
  const handleAddSeriesSubmit = () => {
    if (!form.title.trim() || seriesSeasonsConfig.length === 0) return;
    onAddSeries({
      id: `series-${Date.now()}`,
      title: form.title.trim(),
      genre: form.genre || undefined,
      isAnime: activeSection === 'anime',
      animeType: activeSection === 'anime' ? (form.animeType || undefined) : undefined,
      suggestedBy: currentUser,
      status: 'pendiente',
      seasonsConfig: seriesSeasonsConfig,
      currentSeason: 1,
      currentEpisode: 0,
      episodes: [],
      createdAt: new Date().toISOString(),
    });
    setForm({ title: '', genre: '', year: '', animeType: '' });
    setSeriesSeasonsConfig([{ seasonNumber: 1, totalEpisodes: 12 }]);
    setAddingSeries(false);
    playCutePop();
  };

  const startWatchingSeries = (s: SeriesItem) => {
    onUpdateSeries(s.id, { status: 'viendo' });
    playCutePop();
  };

  const revertSeriesToWatching = (s: SeriesItem) => {
    onUpdateSeries(s.id, { status: 'viendo' });
    playCutePop();
  };

  const incrementSeriesEpisode = (s: SeriesItem) => {
    if (!s.seasonsConfig || s.seasonsConfig.length === 0) return;

    let nextEp = (s.currentEpisode || 0) + 1;
    let nextSeason = s.currentSeason || 1;
    let newStatus = s.status;

    const currentSeasonConfig = s.seasonsConfig.find(sc => sc.seasonNumber === nextSeason);

    if (currentSeasonConfig && nextEp > currentSeasonConfig.totalEpisodes) {
      // Move to next season
      const nextSeasonConfig = s.seasonsConfig.find(sc => sc.seasonNumber === nextSeason + 1);
      if (nextSeasonConfig) {
        nextSeason += 1;
        nextEp = 1;
      } else {
        // Finished the last season
        nextEp = currentSeasonConfig.totalEpisodes; // clamp
        newStatus = 'terminada';
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#a78bfa', '#ff5470', '#7adaa1'] });
      }
    }

    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const newEpReview = {
      id: `ep-${Date.now()}`,
      seasonNumber: nextSeason,
      episodeNumber: nextEp,
      watchedAt: dateStr,
    };

    onUpdateSeries(s.id, {
      currentSeason: nextSeason,
      currentEpisode: nextEp,
      status: newStatus,
      episodes: [...s.episodes, newEpReview]
    });

    playCutePop();
  };

  const markSeriesCompleted = (s: SeriesItem) => {
    onUpdateSeries(s.id, { status: 'terminada' });
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#a78bfa', '#ff5470', '#7adaa1'] });
  };

  const openLogEpisode = (s: SeriesItem) => {
    let defaultS = 1;
    let defaultEp = 1;
    if (s.episodes.length > 0) {
      const latest = s.episodes.reduce((prev, current) => (prev.seasonNumber > current.seasonNumber || (prev.seasonNumber === current.seasonNumber && prev.episodeNumber > current.episodeNumber)) ? prev : current);
      defaultS = latest.seasonNumber;
      defaultEp = latest.episodeNumber;
    } else {
      defaultS = s.currentSeason || 1;
      defaultEp = s.currentEpisode || 1;
    }
    setEpisodeForm({ seasonNumber: defaultS, episodeNumber: defaultEp, rating: 0, comment: '' });
    setLoggingEpisodeFor(s);
  };

  const submitEpisodeReview = () => {
    if (!loggingEpisodeFor) return;

    // Check if this episode already exists
    const existingEpIdx = loggingEpisodeFor.episodes.findIndex(e => e.episodeNumber === episodeForm.episodeNumber && e.seasonNumber === episodeForm.seasonNumber);
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    let newEpisodes = [...loggingEpisodeFor.episodes];

    if (existingEpIdx >= 0) {
      // Update existing
      const ep = { ...newEpisodes[existingEpIdx] };
      if (currentUser === 'Sapo') {
        ep.sapoRating = episodeForm.rating;
        ep.sapoComment = episodeForm.comment || undefined;
      } else {
        ep.miReyRating = episodeForm.rating;
        ep.miReyComment = episodeForm.comment || undefined;
      }
      newEpisodes[existingEpIdx] = ep;
    } else {
      // Add new
      const newEp: EpisodeReview = {
        id: `ep-${Date.now()}`,
        seasonNumber: episodeForm.seasonNumber,
        episodeNumber: episodeForm.episodeNumber,
        watchedAt: dateStr,
        sapoRating: currentUser === 'Sapo' ? episodeForm.rating : undefined,
        sapoComment: currentUser === 'Sapo' ? (episodeForm.comment || undefined) : undefined,
        miReyRating: currentUser === 'Mi Rey' ? episodeForm.rating : undefined,
        miReyComment: currentUser === 'Mi Rey' ? (episodeForm.comment || undefined) : undefined,
      };
      newEpisodes.push(newEp);
    }

    onUpdateSeries(loggingEpisodeFor.id, { episodes: newEpisodes });
    setLoggingEpisodeFor(null);
    playCutePop();
  };

  // ── Render Helpers ──────────────────────────────────────────────────────
  const avgRating = (sapoR?: number, miReyR?: number) => {
    const r = [sapoR, miReyR].filter(Boolean) as number[];
    if (r.length === 0) return null;
    return r.reduce((a, b) => a + b, 0) / r.length;
  };

  return (
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full relative">
      {/* ── MODALS ── */}
      {syncMovie && (
        <SyncCountdown title={syncMovie.title} onEnd={() => setSyncMovie(null)} />
      )}

      {/* Review Movie Modal */}
      {reviewingMovie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2E2247] border border-[#5a4042]/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">🎬</p>
              <h3 className="font-headline-md text-white font-bold">¿Qué te pareció?</h3>
              <p className="text-sm text-[#e2bec0]/60 mt-1">"{reviewingMovie.title}"</p>
            </div>
            <div className="flex justify-center mb-4">
              <StarRating value={reviewData.rating} onChange={(v) => setReviewData((p) => ({ ...p, rating: v }))} />
            </div>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData((p) => ({ ...p, comment: e.target.value }))}
              placeholder="Mini reseña (opcional)..."
              rows={3}
              className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white text-sm placeholder-[#e2bec0]/30 focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setReviewingMovie(null)} className="flex-1 py-2.5 rounded-xl text-sm text-[#e2bec0]/60 bg-[#221934] hover:text-white transition-colors">
                Después
              </button>
              <button onClick={submitMovieReview} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#180c30] bg-[#fabc41] hover:bg-[#ffd06b] transition-all">
                Guardar ⭐
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Movie Comments Modal */}
      {viewingMovieComments && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2E2247] border border-[#5a4042]/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingMovieComments(null)}
              className="absolute top-4 right-4 text-[#e2bec0] hover:text-white w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center transition-colors"
            >✕</button>
            <div className="text-center mb-6">
              <p className="text-3xl mb-2">💬</p>
              <h3 className="font-headline-md text-white font-bold text-lg leading-tight">{viewingMovieComments.title}</h3>
              <p className="text-xs text-[#e2bec0]/60 mt-1">Reseñas y comentarios</p>
            </div>
            <div className="space-y-4">
              {viewingMovieComments.sapoRating && (
                <div className="bg-[#201439] p-4 rounded-2xl border border-[#7adaa1]/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white flex items-center gap-2">🐸 {sapoProfile.name}</span>
                    <span className="text-[#fabc41] tracking-widest text-sm">{'⭐'.repeat(viewingMovieComments.sapoRating)}</span>
                  </div>
                  {viewingMovieComments.sapoComment ? (
                    <p className="text-sm text-[#e2bec0] italic">"{viewingMovieComments.sapoComment}"</p>
                  ) : <p className="text-xs text-[#e2bec0]/40 italic">Sin comentarios.</p>}
                </div>
              )}
              {viewingMovieComments.miReyRating && (
                <div className="bg-[#201439] p-4 rounded-2xl border border-[#fabc41]/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white flex items-center gap-2">👑 {miReyProfile.name}</span>
                    <span className="text-[#fabc41] tracking-widest text-sm">{'⭐'.repeat(viewingMovieComments.miReyRating)}</span>
                  </div>
                  {viewingMovieComments.miReyComment ? (
                    <p className="text-sm text-[#e2bec0] italic">"{viewingMovieComments.miReyComment}"</p>
                  ) : <p className="text-xs text-[#e2bec0]/40 italic">Sin comentarios.</p>}
                </div>
              )}
              {!viewingMovieComments.sapoRating && !viewingMovieComments.miReyRating && (
                <p className="text-center text-sm text-[#e2bec0]/50 italic py-4">Aún no hay calificaciones.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Episode Modal */}
      {loggingEpisodeFor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2E2247] border border-[#a78bfa]/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">📺</p>
              <h3 className="font-headline-md text-white font-bold text-lg leading-tight">{loggingEpisodeFor.title}</h3>
              <p className="text-xs text-[#e2bec0]/60 mt-1">Registrar episodio visto</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] uppercase font-label-mono tracking-widest text-[#e2bec0]/70 mb-1 block">Temporada</label>
                <input
                  type="number"
                  min={1}
                  value={episodeForm.seasonNumber}
                  onChange={(e) => setEpisodeForm(p => ({ ...p, seasonNumber: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-label-mono tracking-widest text-[#e2bec0]/70 mb-1 block">Episodio</label>
                <input
                  type="number"
                  min={1}
                  value={episodeForm.episodeNumber}
                  onChange={(e) => setEpisodeForm(p => ({ ...p, episodeNumber: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <StarRating color="#a78bfa" value={episodeForm.rating} onChange={(v) => setEpisodeForm((p) => ({ ...p, rating: v }))} />
            </div>

            <textarea
              value={episodeForm.comment}
              onChange={(e) => setEpisodeForm((p) => ({ ...p, comment: e.target.value }))}
              placeholder="¿Qué tal este episodio? (opcional)"
              rows={3}
              className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white text-sm placeholder-[#e2bec0]/30 focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setLoggingEpisodeFor(null)} className="flex-1 py-2.5 rounded-xl text-sm text-[#e2bec0]/60 bg-[#221934] hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={submitEpisodeReview} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#a78bfa] hover:bg-[#b8a1fb] transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Series Episodes Modal */}
      {viewingSeriesEpisodes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2E2247] border border-[#5a4042]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setViewingSeriesEpisodes(null)}
              className="absolute top-4 right-4 text-[#e2bec0] hover:text-white w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center transition-colors"
            >✕</button>
            <div className="text-center mb-6 shrink-0">
              <h3 className="font-headline-md text-white font-bold text-xl leading-tight mt-2">{viewingSeriesEpisodes.title}</h3>
              <p className="text-xs text-[#e2bec0]/60 mt-1">Historial de episodios</p>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
              {viewingSeriesEpisodes.episodes.length === 0 ? (
                <p className="text-center text-sm text-[#e2bec0]/50 italic py-8">Todavía no han registrado episodios.</p>
              ) : (
                [...viewingSeriesEpisodes.episodes]
                  .sort((a, b) => b.seasonNumber !== a.seasonNumber ? b.seasonNumber - a.seasonNumber : b.episodeNumber - a.episodeNumber)
                  .map(ep => (
                    <div key={ep.id} className="bg-[#201439] rounded-2xl border border-[#5a4042]/30 p-4">
                      <div className="flex justify-between items-end mb-3 border-b border-[#5a4042]/20 pb-2">
                        <span className="font-bold text-white font-headline-md">Temp {ep.seasonNumber || 1} • Ep {ep.episodeNumber}</span>
                        <span className="text-[10px] text-[#e2bec0]/50 font-label-mono">{ep.watchedAt}</span>
                      </div>

                      <div className="space-y-3">
                        {ep.sapoRating ? (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-[#7adaa1] uppercase"> {sapoProfile.name}</span>
                              <span className="text-[#a78bfa] text-[10px] tracking-widest">{'⭐'.repeat(ep.sapoRating)}</span>
                            </div>
                            {ep.sapoComment && <p className="text-xs text-[#e2bec0] italic">"{ep.sapoComment}"</p>}
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#e2bec0]/40 italic">🐸 Sin reseña de {sapoProfile.name}</div>
                        )}

                        {ep.miReyRating ? (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-[#fabc41] uppercase">👑 {miReyProfile.name}</span>
                              <span className="text-[#a78bfa] text-[10px] tracking-widest">{'⭐'.repeat(ep.miReyRating)}</span>
                            </div>
                            {ep.miReyComment && <p className="text-xs text-[#e2bec0] italic">"{ep.miReyComment}"</p>}
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#e2bec0]/40 italic">👑 Sin reseña de {miReyProfile.name}</div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Movie/Series Modal */}
      {(addingMovie || addingSeries) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`bg-[#2E2247] border rounded-3xl max-w-sm w-full p-6 shadow-2xl ${addingMovie ? 'border-[#fabc41]/20' : 'border-[#a78bfa]/20'}`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{addingMovie ? '🎬' : activeSection === 'anime' ? '🌸' : '📺'}</span>
              <h3 className="font-headline-md text-white font-bold">
                Agregar {addingMovie ? 'Película' : activeSection === 'anime' ? 'Anime' : 'Serie'}
              </h3>
            </div>

            <div className="space-y-3 mb-5">
              <input
                ref={addingMovie ? titleInputRef : seriesInputRef}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (addingMovie ? handleAddMovieSubmit() : handleAddSeriesSubmit())}
                placeholder="Título..."
                className={`w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-4 py-3 text-white placeholder-[#e2bec0]/30 focus:outline-none focus:border-[${addingMovie ? '#fabc41' : '#a78bfa'}]/40 text-sm`}
              />
              <div className="grid grid-cols-2 gap-2">
                {activeSection === 'anime' ? (
                  <select
                    value={form.animeType}
                    onChange={(e) => setForm((p) => ({ ...p, animeType: e.target.value }))}
                    className="w-full bg-[#221934] border border-[#5a4042]/30 rounded-xl px-3 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Tipo de Anime...</option>
                    {['Shonen', 'Shojo', 'Seinen', 'Isekai', 'Romance', 'Acción', 'Comedia', 'Drama', 'Slice of Life', 'Spokon'].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <select
                    value={form.genre}
                    onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                    className="bg-[#221934] border border-[#5a4042]/30 rounded-xl px-3 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Género...</option>
                    {GENRES.filter(g => activeSection === 'peliculas' || g !== 'Anime').map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
                {addingMovie ? (
                  <input
                    value={form.year}
                    onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                    placeholder="Año..."
                    maxLength={4}
                    className="bg-[#221934] border border-[#5a4042]/30 rounded-xl px-3 py-3 text-sm text-white placeholder-[#e2bec0]/30 focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2 bg-[#221934] border border-[#5a4042]/30 rounded-xl px-3 py-3 text-sm">
                    <span className="text-[#e2bec0]/60">Temporadas:</span>
                    <button onClick={() => setSeriesSeasonsConfig(p => p.length > 1 ? p.slice(0, -1) : p)} className="text-[#a78bfa] hover:text-white font-bold px-1">-</button>
                    <span className="text-white w-4 text-center font-bold">{seriesSeasonsConfig.length}</span>
                    <button onClick={() => setSeriesSeasonsConfig(p => [...p, { seasonNumber: p.length + 1, totalEpisodes: 12 }])} className="text-[#a78bfa] hover:text-white font-bold px-1">+</button>
                  </div>
                )}
              </div>

              {addingSeries && (
                <div className="bg-[#221934] border border-[#5a4042]/20 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {seriesSeasonsConfig.map((sc, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-white font-bold">Temporada {sc.seasonNumber}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={sc.totalEpisodes}
                          onChange={(e) => {
                            const newConfig = [...seriesSeasonsConfig];
                            newConfig[i].totalEpisodes = parseInt(e.target.value) || 1;
                            setSeriesSeasonsConfig(newConfig);
                          }}
                          className="bg-[#180c30] text-center w-12 rounded px-1 py-0.5 text-white border border-[#5a4042]/30 focus:outline-none focus:border-[#a78bfa]/50"
                        />
                        <span className="text-[#e2bec0]/50 text-xs">eps</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-[#e2bec0]/40 font-label-mono">Sugerida por: {getName(currentUser)}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setAddingMovie(false); setAddingSeries(false); setForm({ title: '', genre: '', year: '', animeType: '' }); setSeriesSeasonsConfig([{ seasonNumber: 1, totalEpisodes: 12 }]); }} className="flex-1 py-2.5 rounded-xl text-sm text-[#e2bec0]/60 bg-[#221934] hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={addingMovie ? handleAddMovieSubmit : handleAddSeriesSubmit}
                disabled={!form.title.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 ${addingMovie ? 'bg-[#fabc41] hover:bg-[#ffd06b] text-[#180c30]' : activeSection === 'anime' ? 'bg-[#ff5470] hover:bg-[#ff7a90]' : 'bg-[#a78bfa] hover:bg-[#b8a1fb]'
                  }`}
              >
                Agregar {addingMovie ? '🎬' : activeSection === 'anime' ? '🌸' : '📺'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER & TOGGLE ── */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Toggle Peliculas/Series */}
        <div className="flex justify-center w-full">
          <div className="bg-[#201439] p-1 rounded-full border border-[#5a4042]/30 flex items-center">
            <button
              onClick={() => { setActiveSection('peliculas'); setTab('pendiente'); }}
              className={`px-6 py-2 rounded-full font-label-caps uppercase text-[10px] tracking-widest transition-all ${activeSection === 'peliculas'
                  ? 'bg-[#fabc41] text-[#13062b] font-bold shadow-[0_0_15px_rgba(250,188,65,0.3)]'
                  : 'text-[#e2bec0] hover:text-white'
                }`}
            >
              🎬 Películas
            </button>
            <button
              onClick={() => { setActiveSection('series'); setTab('pendiente'); }}
              className={`px-6 py-2 rounded-full font-label-caps uppercase text-[10px] tracking-widest transition-all ${activeSection === 'series'
                  ? 'bg-[#a78bfa] text-white font-bold shadow-[0_0_15px_rgba(167,139,250,0.3)]'
                  : 'text-[#e2bec0] hover:text-white'
                }`}
            >
              📺 Series
            </button>
            <button
              onClick={() => { setActiveSection('anime'); setTab('pendiente'); }}
              className={`px-6 py-2 rounded-full font-label-caps uppercase text-[10px] tracking-widest transition-all ${activeSection === 'anime'
                  ? 'bg-[#ff5470] text-white font-bold shadow-[0_0_15px_rgba(255,84,112,0.3)]'
                  : 'text-[#e2bec0] hover:text-white'
                }`}
            >
              🌸 Anime
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 border ${activeSection === 'peliculas' ? 'bg-[#fabc41]/15 border-[#fabc41]/30 text-[#fabc41]' : activeSection === 'series' ? 'bg-[#a78bfa]/15 border-[#a78bfa]/30 text-[#a78bfa]' : 'bg-[#ff5470]/15 border-[#ff5470]/30 text-[#ff5470]'}`}>
              <span className="text-sm">{activeSection === 'peliculas' ? '🍿' : activeSection === 'series' ? '📺' : '🌸'}</span>
              <span className="font-label-caps text-[10px] uppercase tracking-widest">
                {activeSection === 'peliculas' ? 'Noche de Películas' : activeSection === 'series' ? 'Maratón de Series' : 'Maratón Otaku'}
              </span>
            </div>
            <h1 className="font-display-lg text-2xl md:text-3xl text-white">
              {activeSection === 'peliculas' ? 'Nuestra Filmoteca' : activeSection === 'series' ? 'Nuestra Serieteca' : 'Nuestra Animeteca'}
            </h1>
            <p className="text-sm text-[#e2bec0]/50 mt-1 font-body-md">
              {activeSection === 'peliculas'
                ? `${movies.filter(m => m.status === 'vista').length} películas vistas juntos 🎬`
                : activeSection === 'series'
                  ? `${series.filter(s => s.status === 'terminada' && !s.isAnime).length} series terminadas 🏆`
                  : `${series.filter(s => s.status === 'terminada' && s.isAnime).length} animes terminados 🏆`
              }
            </p>
          </div>
          <button
            onClick={() => {
              if (activeSection === 'peliculas') { setAddingMovie(true); setTimeout(() => titleInputRef.current?.focus(), 100); }
              else { setAddingSeries(true); setTimeout(() => seriesInputRef.current?.focus(), 100); }
            }}
            className={`flex items-center gap-2 font-headline-md font-bold px-4 py-2.5 rounded-2xl text-sm transition-all hover:scale-105 ${activeSection === 'peliculas'
                ? 'bg-[#fabc41] hover:bg-[#ffd06b] text-[#180c30] shadow-[0_4px_20px_rgba(250,188,65,0.4)]'
                : activeSection === 'series'
                  ? 'bg-[#a78bfa] hover:bg-[#b8a1fb] text-white shadow-[0_4px_20px_rgba(167,139,250,0.4)]'
                  : 'bg-[#ff5470] hover:bg-[#ff7a90] text-white shadow-[0_4px_20px_rgba(255,84,112,0.4)]'
              }`}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Agregar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-label-caps uppercase tracking-wide whitespace-nowrap transition-all"
            style={{
              background: tab === t.key ? `${t.color}25` : '#2E2247',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: tab === t.key ? `${t.color}60` : '#5a4042/20',
              color: tab === t.key ? t.color : '#e2bec0',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: tab === t.key ? t.color : '#5a4042', color: tab === t.key ? '#180c30' : '#e2bec0' }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Genre Filter */}
      {availableGenres.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar items-center">
          <span className="text-xs text-[#e2bec0]/60 font-label-caps uppercase mr-1">Filtro:</span>
          <button
            onClick={() => setSelectedGenreFilter(null)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${selectedGenreFilter === null ? 'bg-white/10 text-white' : 'text-[#e2bec0]/50 hover:bg-white/5'
              }`}
          >
            Todos
          </button>
          {availableGenres.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenreFilter(g)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedGenreFilter === g ? 'bg-[#ff5470]/20 text-[#ff5470] border border-[#ff5470]/30' : 'bg-[#2E2247] border border-[#5a4042]/20 text-[#e2bec0]/70 hover:text-white'
                }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#e2bec0]/40">
          <p className="text-5xl mb-4">{activeSection === 'peliculas' ? '🎬' : '📺'}</p>
          <p className="font-headline-md text-lg text-white/60">Sin {activeSection === 'peliculas' ? 'películas' : 'series'} aquí</p>
          <p className="text-sm mt-1">¡Agrega la primera sugerencia!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item) => {
            if (activeSection === 'peliculas') {
              const movie = item as MovieItem;
              const avg = avgRating(movie.sapoRating, movie.miReyRating);
              const statusColor = STATUS_COLORS[movie.status];

              return (
                <div
                  key={movie.id}
                  className="bg-[#2E2247] border border-[#5a4042]/20 rounded-2xl p-4 transition-all hover:border-[#5a4042]/40"
                  style={{ borderColor: movie.status === 'viendo' ? `${statusColor}60` : undefined }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${statusColor}15` }}>
                      {movie.status === 'pendiente' ? '🎬' : movie.status === 'viendo' ? '▶️' : '✅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline-md text-white font-bold text-sm leading-tight">{movie.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {movie.genre && <span className="text-[10px] text-[#e2bec0]/50">{movie.genre}</span>}
                        {movie.year && <span className="text-[10px] text-[#e2bec0]/30">• {movie.year}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[10px] font-label-caps uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ background: `${statusColor}20`, color: statusColor }}
                      >
                        {STATUS_LABELS[movie.status]}
                      </span>
                      <button
                        onClick={() => { if (window.confirm('¿Seguro que quieres eliminar esta película?')) onDeleteMovie(movie.id); }}
                        className="text-[#e2bec0]/30 hover:text-[#ff5470] transition-colors flex items-center justify-center"
                        title="Eliminar película"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#e2bec0]/40 font-label-mono mb-3">
                    💡 Sugerida por {getName(movie.suggestedBy)}
                    {movie.watchedAt && ` • Vista ${movie.watchedAt}`}
                  </p>

                  {/* Ratings Button */}
                  {movie.status === 'vista' && (movie.sapoRating || movie.miReyRating) && (
                    <button
                      onClick={() => setViewingMovieComments(movie)}
                      className="flex items-center gap-3 w-full mb-3 p-2 rounded-xl bg-[#201439] hover:bg-[#2a1d45] border border-[#5a4042]/20 transition-colors group/rating"
                    >
                      <div className="flex flex-1 gap-3 text-[10px] text-[#e2bec0]/60 font-label-mono">
                        {movie.sapoRating && (
                          <div className="flex items-center gap-1">
                            <span>🐸</span>
                            <span className="text-[#fabc41]">{'⭐'.repeat(movie.sapoRating)}</span>
                          </div>
                        )}
                        {movie.miReyRating && (
                          <div className="flex items-center gap-1">
                            <span>👑</span>
                            <span className="text-[#fabc41]">{'⭐'.repeat(movie.miReyRating)}</span>
                          </div>
                        )}
                      </div>
                      {avg && (
                        <span className="text-[#7adaa1] text-[10px] font-label-mono font-bold whitespace-nowrap">
                          Prom: {avg.toFixed(1)}/5
                        </span>
                      )}
                      <span className="material-symbols-outlined text-[#e2bec0]/40 group-hover/rating:text-white text-sm transition-colors">
                        chat_bubble
                      </span>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {movie.status === 'pendiente' && (
                      <button onClick={() => startWatchingMovie(movie)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-[#180c30] bg-[#fabc41] hover:bg-[#ffd06b] transition-all">
                        <span className="material-symbols-outlined text-sm">play_arrow</span> ¡Ver ahora! 🍿
                      </button>
                    )}
                    {movie.status === 'viendo' && (
                      <button onClick={() => markMovieWatched(movie)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#7adaa1]/80 hover:bg-[#7adaa1] transition-all text-[#180c30]">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Terminamos 🎉
                      </button>
                    )}
                    {movie.status === 'vista' && (
                      <>
                        {currentUser === 'Sapo' && !movie.sapoRating && (
                          <button onClick={() => { setReviewingMovie(movie); setReviewData({ rating: 0, comment: '' }); }} className="flex-1 py-2 rounded-xl text-xs font-bold text-[#180c30] bg-[#7adaa1]/80 hover:bg-[#7adaa1] transition-all">
                            Calificar ⭐
                          </button>
                        )}
                        {currentUser === 'Mi Rey' && !movie.miReyRating && (
                          <button onClick={() => { setReviewingMovie(movie); setReviewData({ rating: 0, comment: '' }); }} className="flex-1 py-2 rounded-xl text-xs font-bold text-[#180c30] bg-[#7adaa1]/80 hover:bg-[#7adaa1] transition-all">
                            Calificar ⭐
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            } else {
              // SERIES CARD
              const seriesItem = item as SeriesItem;
              const statusColor = STATUS_COLORS[seriesItem.status];
              const maxEp = seriesItem.episodes.length > 0 ? Math.max(...seriesItem.episodes.map(e => e.episodeNumber)) : 0;

              return (
                <div
                  key={seriesItem.id}
                  className="bg-[#2E2247] border border-[#5a4042]/20 rounded-2xl p-4 transition-all hover:border-[#5a4042]/40 flex flex-col"
                  style={{ borderColor: seriesItem.status === 'viendo' ? `${statusColor}60` : undefined }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${statusColor}15` }}>
                      {seriesItem.status === 'pendiente' ? '📺' : seriesItem.status === 'viendo' ? '🔥' : '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline-md text-white font-bold text-sm leading-tight">{seriesItem.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {seriesItem.genre && <span className="text-[10px] text-[#e2bec0]/50">{seriesItem.genre}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[10px] font-label-caps uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ background: `${statusColor}20`, color: statusColor }}
                      >
                        {STATUS_LABELS[seriesItem.status]}
                      </span>
                      <button
                        onClick={() => { if (window.confirm('¿Seguro que quieres eliminar esta serie?')) onDeleteSeries(seriesItem.id); }}
                        className="text-[#e2bec0]/30 hover:text-[#ff5470] transition-colors flex items-center justify-center"
                        title="Eliminar serie"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-[10px] text-[#e2bec0]/60 font-label-mono">
                    <span>💡 Sugerida por {getName(seriesItem.suggestedBy)}</span>
                  </div>

                  {seriesItem.status !== 'pendiente' && seriesItem.seasonsConfig && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-[#e2bec0]/80 font-label-mono mb-1">
                        <span>Temporada {seriesItem.currentSeason || 1}</span>
                        <span>Ep {seriesItem.currentEpisode || 0} / {seriesItem.seasonsConfig.find(sc => sc.seasonNumber === (seriesItem.currentSeason || 1))?.totalEpisodes || '?'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#180c30] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#a78bfa] transition-all duration-500"
                          style={{ width: `${Math.min(100, ((seriesItem.currentEpisode || 0) / (seriesItem.seasonsConfig.find(sc => sc.seasonNumber === (seriesItem.currentSeason || 1))?.totalEpisodes || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {seriesItem.episodes.length > 0 && (
                    <button
                      onClick={() => setViewingSeriesEpisodes(seriesItem)}
                      className="flex items-center justify-between w-full mb-3 p-2 rounded-xl bg-[#201439] hover:bg-[#2a1d45] border border-[#5a4042]/20 transition-colors group/rating"
                    >
                      <span className="text-xs text-[#e2bec0] font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#a78bfa]">format_list_bulleted</span>
                        Ver {seriesItem.episodes.length} episodios registrados
                      </span>
                      <span className="material-symbols-outlined text-[#e2bec0]/40 group-hover/rating:text-white text-sm transition-colors">
                        arrow_forward
                      </span>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {seriesItem.status === 'pendiente' && (
                      <button onClick={() => startWatchingSeries(seriesItem)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-[#a78bfa] hover:bg-[#b8a1fb] transition-all">
                        <span className="material-symbols-outlined text-sm">play_arrow</span> ¡Empezar Serie!
                      </button>
                    )}
                    {seriesItem.status === 'viendo' && (
                      <>
                        <button onClick={() => incrementSeriesEpisode(seriesItem)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-[#a78bfa] hover:bg-[#b8a1fb] transition-all">
                          <span className="material-symbols-outlined text-sm">add</span> 1 Episodio
                        </button>
                        <button onClick={() => openLogEpisode(seriesItem)} className="px-3 py-2 rounded-xl text-xs font-bold bg-[#201439] hover:bg-[#2a1d45] text-[#e2bec0] transition-all border border-[#5a4042]/20 flex items-center justify-center" title="Dejar Reseña">
                          <span className="material-symbols-outlined text-sm">rate_review</span>
                        </button>
                      </>
                    )}
                    {seriesItem.status === 'terminada' && (
                      <>
                        <div className="flex-1 py-2 rounded-xl text-xs font-bold text-center bg-[#7adaa1]/20 text-[#7adaa1] border border-[#7adaa1]/30">
                          ¡Completada! 🎉
                        </div>
                        <button onClick={() => revertSeriesToWatching(seriesItem)} className="px-3 py-2 rounded-xl text-xs font-bold bg-[#201439] hover:bg-[#2a1d45] text-[#e2bec0] transition-all border border-[#5a4042]/20 flex items-center justify-center" title="Volver a ver (Nueva Temporada)">
                          <span className="material-symbols-outlined text-sm">replay</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </main>
  );
};
