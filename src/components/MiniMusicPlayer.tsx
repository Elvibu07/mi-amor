import React from 'react';
import { MusicState, UserProfile } from '../types';
import { useSyncedDoc } from '../lib/useFirestore';
import { playCutePop } from '../utils/audio';

interface MiniMusicPlayerProps {
  currentUser: 'Sapo' | 'Mi Rey';
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

export const MiniMusicPlayer: React.FC<MiniMusicPlayerProps> = ({ currentUser, sapoProfile, miReyProfile }) => {
  const [musicState, setMusicState] = useSyncedDoc<MusicState | null>('shared', 'music_state', 'ourlobby_music', null);

  if (!musicState) return null;

  const handlePlay = () => {
    playCutePop();
    // En el global no podemos obtener el tiempo exacto tan facil sin la ref de YT,
    // pero podemos asumir que el timestamp actualiza el estado. 
    // Para simplificar, usamos el ultimo timestamp guardado.
    setMusicState({
      ...musicState,
      isPlaying: true,
      updatedAt: Date.now(),
      setBy: currentUser,
    });
  };

  const handlePause = () => {
    playCutePop();
    // Calculamos donde se quedo asumiendo que estaba sonando
    const timePassed = (Date.now() - musicState.updatedAt) / 1000;
    setMusicState({
      ...musicState,
      isPlaying: false,
      timestamp: musicState.timestamp + timePassed,
      updatedAt: Date.now(),
      setBy: currentUser,
    });
  };

  const getName = (role: 'Sapo' | 'Mi Rey') => {
    return role === 'Sapo' ? sapoProfile.name : miReyProfile.name;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-[#2f2348]/95 backdrop-blur-md border border-[#5a4042]/50 shadow-2xl rounded-2xl p-3 w-64 flex flex-col gap-2 transition-all hover:border-[#7adaa1]/40">
      <div className="flex justify-between items-center">
        <h4 className="font-headline-md text-[10px] text-[#7adaa1] uppercase tracking-widest flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">music_note</span>
          {musicState.isPlaying ? 'Sonando Ahora' : 'Pausado'}
        </h4>
        {musicState.isPlaying && (
          <div className="flex items-end gap-0.5 h-3">
            <div className="w-1 h-3 bg-[#ff5470] animate-pulse"></div>
            <div className="w-1 h-full bg-[#fabc41] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-2 bg-[#7adaa1] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <img 
          src={`https://img.youtube.com/vi/${musicState.youtubeId}/hqdefault.jpg`} 
          alt="Thumbnail" 
          className="w-12 h-12 rounded-lg object-cover bg-black"
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="font-headline-md text-white text-xs truncate">{musicState.title}</span>
          <span className="text-[9px] text-[#e2bec0]/70 font-label-mono truncate">Puesta por {getName(musicState.setBy)}</span>
        </div>
        <button 
          onClick={musicState.isPlaying ? handlePause : handlePlay}
          className="w-10 h-10 shrink-0 rounded-full bg-[#ff5470] text-white flex items-center justify-center hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">
            {musicState.isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
      </div>
    </div>
  );
};
