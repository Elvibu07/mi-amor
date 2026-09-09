export type ViewType = 
  | 'lobby' 
  | 'memory-vault' 
  | 'misiones' 
  | 'muro-notas' 
  | 'fechas-especiales'
  | 'juegos' 
  | 'tictactoe' 
  | 'sopa-letras' 
  | 'battleship'
  | 'cartas'
  | 'peliculas'
  | 'settings';

export type UserPartner = 'Baby' | 'Mi Rey';

export interface UserProfile {
  name: string;
  avatar: string;
  city: string;
  country: string;
  timezone: string; // e.g. "UTC-5" or "UTC+1"
  statusPhrase: string;
  pushAlerts: boolean;
  soundEffects: boolean;
  isTraveling?: boolean;
  pin?: string; // hashed 4-digit PIN
}

export interface MemoryItem {
  id: string;
  title?: string;
  quote: string;
  date: string;
  location: string;
  imageUrl: string;
  capturedBy: 'Baby' | 'Mi Rey' | 'Together';
  rotation?: string;
  isWide?: boolean;
  album?: 'recuerdos' | 'cumpleanos' | 'juntos' | 'lugares' | 'nosotros';
  isFeatured?: boolean;
}

export interface NoteItem {
  id: string;
  text: string;
  author: 'Baby' | 'Mi Rey';
  dateStr: string;
  category: 'lindos' | 'mejorar';
  urgency?: 'calma' | 'importante' | 'urgente';
  tapeColor?: string;
  tapeRotation?: string;
  isFavorite?: boolean;
}

export interface MissionItem {
  id: string;
  title: string;
  description: string;
  urgency: 'calma' | 'importante' | 'urgente';
  author: 'Baby' | 'Mi Rey';
  progress: number;
  isCompleted: boolean;
  dateCreated?: string;
}

export interface GoalItem {
  id: string;
  title: string;
  description?: string;
  category: 'distancia' | 'reencuentro' | 'argentina' | 'guayaquil' | 'futuro';
  author: 'Baby' | 'Mi Rey' | 'Juntos';
  isCompleted: boolean;
  completedAt?: string;
  dateCreated?: string;
  icon?: string;
}

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  description: string;
  from: 'Baby' | 'Mi Rey';
  to: 'Baby' | 'Mi Rey';
  themeColor: 'pink' | 'amber' | 'emerald' | 'purple' | 'cyan';
  isRedeemed: boolean;
  redeemedAt?: string;
  category: string;
  icon?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  icon: string;
  color: 'tertiary' | 'secondary' | 'primary' | 'muted';
  isUnlocked: boolean;
}

export interface GameScore {
  victoriasGYE: number;
  victoriasMAD: number;
}

// ─── New Types ───────────────────────────────────────────────────────────────

/** A love letter from one person to the other */
export interface LetterItem {
  id: string;
  title: string;
  body: string;
  from: 'Baby' | 'Mi Rey';
  to: 'Baby' | 'Mi Rey';
  dateStr: string;
  createdAt: string; // ISO date string
  isRead: boolean;
  mood?: 'romantic' | 'fun' | 'grateful' | 'missing';
}

/** A movie in the shared watchlist */
export interface MovieItem {
  id: string;
  title: string;
  posterUrl?: string;
  genre?: string;
  year?: string;
  suggestedBy: 'Baby' | 'Mi Rey' | 'Juntos';
  status: 'pendiente' | 'viendo' | 'vista';
  watchedAt?: string;
  babyRating?: number;   // 1-5
  miReyRating?: number;  // 1-5
  babyComment?: string;
  miReyComment?: string;
  createdAt: string;
}

export interface SeasonConfig {
  seasonNumber: number;
  totalEpisodes: number;
}

/** Review for a single episode of a series */
export interface EpisodeReview {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: string;
  babyRating?: number;
  babyComment?: string;
  miReyRating?: number;
  miReyComment?: string;
}

/** A series or anime in the shared watchlist */
export interface SeriesItem {
  id: string;
  title: string;
  genre?: string;
  isAnime?: boolean;
  animeType?: string;
  suggestedBy: 'Baby' | 'Mi Rey' | 'Juntos';
  status: 'pendiente' | 'viendo' | 'terminada';
  seasonsConfig: SeasonConfig[];
  currentSeason: number;
  currentEpisode: number;
  episodes: EpisodeReview[];
  createdAt: string;
}

/** Shared music playback state */
export interface MusicState {
  youtubeId: string;
  title: string;
  isPlaying: boolean;
  timestamp: number;
  updatedAt: number; // to calculate offset
  setBy: 'Baby' | 'Mi Rey';
  isPlaylist?: boolean;
  playlistId?: string;
  playlistIndex?: number;
}

/** A synchronised movie-night countdown session */
export interface MovieSyncSession {
  active: boolean;
  movieTitle: string;
  countdownStartedAt: string; // ISO date, the moment both hit play
  startedBy: 'Baby' | 'Mi Rey';
}

/** Special dates configuration */
export interface SpecialDatesConfig {
  anniversaryDate: string;   // ISO: "2024-07-27"
  babyBirthday: string;      // ISO: "2005-06-07"
  miReyBirthday: string;     // ISO: "2001-03-28"
  reunionDate?: string;      // ISO: upcoming reunion
}

/** Love Event for sending affection */
export interface LoveEvent {
  timestamp: number;
  sender: 'Baby' | 'Mi Rey';
}
