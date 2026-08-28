import React from 'react';
import { ViewType, UserProfile } from '../types';

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  gyeTime: string;
  madTime: string;
  daysToReunion: number;
  unreadLetters?: number;
  currentUser?: 'Sapo' | 'Mi Rey';
  onLogout?: () => void;
}

interface NavBtnProps {
  view: ViewType;
  activeViews?: ViewType[];
  label: string;
  icon: string;
  activeColor?: string;
  badge?: number;
  currentView: ViewType;
  onNavigate: (v: ViewType) => void;
  mobile?: boolean;
}

const NavBtn: React.FC<NavBtnProps> = ({
  view, activeViews, label, icon, activeColor = 'text-[#ffb2b8]', badge = 0,
  currentView, onNavigate, mobile,
}) => {
  const isActive = activeViews
    ? activeViews.includes(currentView)
    : currentView === view;

  if (mobile) {
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
          isActive ? `bg-[#3a2e54] ${activeColor} font-bold` : 'text-[#e2bec0]'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {label}
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#ff5470] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => onNavigate(view)}
      className={`relative flex items-center px-4 py-2 rounded-xl transition-all font-medium text-sm gap-2 ${
        isActive
          ? `bg-[#3a2e54] ${activeColor} font-bold shadow-inner`
          : 'text-[#e2bec0] hover:bg-[#3a2e54]/50 hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
      {badge > 0 && (
        <span className="bg-[#ff5470] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  sapoProfile,
  miReyProfile,
  gyeTime,
  madTime,
  daysToReunion,
  unreadLetters = 0,
  currentUser,
  onLogout,
}) => {
  const myProfile = currentUser === 'Sapo' ? sapoProfile : miReyProfile;

  return (
    <header className="bg-[#2E2247]/70 backdrop-blur-md z-50 sticky top-0 px-4 md:px-8 py-3 shadow-md border-b border-[#5a4042]/20">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Brand */}
        <button
          onClick={() => onNavigate('lobby')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-10 h-10 bg-[#ff5470] rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(255,84,112,0.4)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[#5d0019] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-2xl md:text-[26px] text-[#ffb2b8] tracking-tight leading-none">Our Lobby</span>
            <span className="font-label-mono text-[10px] text-[#7adaa1] uppercase tracking-wider hidden sm:block">Refugio Activo</span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavBtn view="lobby" label="Lobby" icon="house_siding" currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="memory-vault" label="Vault" icon="photo_library" currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="misiones" label="Metas" icon="confirmation_number" currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="muro-notas" label="Notas" icon="sticky_note_2" currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="cartas" label="Cartas" icon="mail" activeColor="text-[#ff5470]" badge={unreadLetters} currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="peliculas" label="Películas" icon="movie" activeColor="text-[#fabc41]" currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="fechas-especiales" label="Fechas" icon="date_range" activeColor="text-[#a78bfa]" currentView={currentView} onNavigate={onNavigate} />
          <NavBtn view="juegos" activeViews={['juegos', 'tictactoe', 'sopa-letras', 'battleship']} label="Juegos" icon="sports_esports" activeColor="text-[#fabc41]" currentView={currentView} onNavigate={onNavigate} />
        </nav>

        {/* Right side: clocks + profile */}
        <div className="flex items-center gap-3">
          {/* Dual time HUD capsule */}
          <div className="hidden sm:flex items-center gap-3 bg-[#201439]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#5a4042]/30 shadow-inner">
            <div className="flex flex-col items-end pr-2.5 border-r border-[#5a4042]/30">
              <span className="text-[9px] text-[#e2bec0] font-label-mono uppercase tracking-wider">{miReyProfile.city}</span>
              <span className="text-xs font-label-mono font-bold text-[#fabc41]">{madTime}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-[#e2bec0] font-label-mono uppercase tracking-wider">{sapoProfile.city}</span>
              <span className="text-xs font-label-mono font-bold text-[#7adaa1]">{gyeTime}</span>
            </div>
          </div>

          {/* Current user + settings */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 bg-[#221934]/60 px-2.5 py-1.5 rounded-full border border-[#5a4042]/30">
                <img
                  src={myProfile.avatar}
                  alt={currentUser}
                  className="w-6 h-6 rounded-full object-cover"
                  style={{ border: `1.5px solid ${currentUser === 'Sapo' ? '#7adaa1' : '#fabc41'}60` }}
                />
                <span className="text-[11px] font-label-caps uppercase tracking-wide" style={{ color: currentUser === 'Sapo' ? '#7adaa1' : '#fabc41' }}>
                  {currentUser === 'Sapo' ? '🐸' : '👑'} {myProfile.name}
                </span>
              </div>
            )}

            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 bg-[#221934]/60 hover:bg-[#3a2e54] px-2.5 py-1.5 rounded-full border border-[#5a4042]/30 transition-all group"
              title="Configuración"
            >
              <div className="flex -space-x-2">
                <img alt={sapoProfile.name} src={sapoProfile.avatar} className="w-8 h-8 rounded-full border-2 border-[#3a2e54] object-cover ring-1 ring-[#7adaa1]/40" />
                <img alt={miReyProfile.name} src={miReyProfile.avatar} className="w-8 h-8 rounded-full border-2 border-[#3a2e54] object-cover ring-1 ring-[#fabc41]/40" />
              </div>
              <span className="material-symbols-outlined text-[#e2bec0] text-sm group-hover:rotate-45 transition-transform">settings</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-[#221934] hover:bg-[#3a2e54] flex items-center justify-center text-[#e2bec0]/50 hover:text-[#ff5470] transition-all"
                title="Cerrar sesión"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="flex lg:hidden items-center justify-around gap-0.5 pt-2.5 mt-2 border-t border-[#5a4042]/20 overflow-x-auto no-scrollbar">
        <NavBtn view="lobby" label="Lobby" icon="house_siding" currentView={currentView} onNavigate={onNavigate} mobile />
        <NavBtn view="memory-vault" label="Vault" icon="photo_library" currentView={currentView} onNavigate={onNavigate} mobile />
        <NavBtn view="cartas" label="Cartas" icon="mail" activeColor="text-[#ff5470]" badge={unreadLetters} currentView={currentView} onNavigate={onNavigate} mobile />
        <NavBtn view="peliculas" label="Pelis" icon="movie" activeColor="text-[#fabc41]" currentView={currentView} onNavigate={onNavigate} mobile />
        <NavBtn view="fechas-especiales" label="Fechas" icon="date_range" activeColor="text-[#a78bfa]" currentView={currentView} onNavigate={onNavigate} mobile />
        <NavBtn view="juegos" activeViews={['juegos', 'tictactoe', 'sopa-letras', 'battleship']} label="Juegos" icon="sports_esports" activeColor="text-[#fabc41]" currentView={currentView} onNavigate={onNavigate} mobile />
        <NavBtn view="misiones" label="Metas" icon="confirmation_number" currentView={currentView} onNavigate={onNavigate} mobile />
      </div>
    </header>
  );
};
