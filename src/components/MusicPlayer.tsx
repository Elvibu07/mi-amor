import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { MusicState, UserProfile } from '../types';
import { useSyncedDoc } from '../lib/useFirestore';
import { playCutePop } from '../utils/audio';
import getYouTubeID from 'get-youtube-id';

interface MusicPlayerProps {
  currentUser: 'Sapo' | 'Mi Rey';
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ currentUser, sapoProfile, miReyProfile }) => {
  const [musicState, setMusicState] = useSyncedDoc<MusicState | null>('shared', 'music_state', 'ourlobby_music', null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [localVolume, setLocalVolume] = useState(() => {
    const saved = localStorage.getItem('ourlobby_music_volume');
    return saved ? parseInt(saved, 10) : 100;
  });

  // Listen for local volume changes from MiniMusicPlayer
  useEffect(() => {
    const handleVolumeChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setLocalVolume(customEvent.detail);
      if (playerRef.current) {
        playerRef.current.setVolume(customEvent.detail);
      }
    };
    window.addEventListener('change-local-volume', handleVolumeChange);
    return () => window.removeEventListener('change-local-volume', handleVolumeChange);
  }, []);

  // Sync volume when player mounts or localVolume changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(localVolume);
    }
  }, [localVolume]);

  // Sync player when musicState changes
  useEffect(() => {
    if (!musicState || !playerRef.current) return;
    const player = playerRef.current;
    
    try {
      // Check if we need to update state
      const playerState = player.getPlayerState(); // 1 = playing, 2 = paused
      const currentTime = player.getCurrentTime();

      if (musicState.isPlaying && playerState !== 1) {
        // Calculate where it should be based on updatedAt
        const timePassed = (Date.now() - musicState.updatedAt) / 1000;
        const targetTime = musicState.timestamp + timePassed;
        if (Math.abs(currentTime - targetTime) > 2) {
          player.seekTo(targetTime, true);
        }
        player.playVideo();
      } else if (!musicState.isPlaying && playerState !== 2) {
        player.pauseVideo();
        if (Math.abs(currentTime - musicState.timestamp) > 2) {
          player.seekTo(musicState.timestamp, true);
        }
      }

      // Check playlist index sync
      if (musicState.isPlaylist && musicState.playlistIndex !== undefined && player.getPlaylistIndex) {
        const currentIndex = player.getPlaylistIndex();
        if (currentIndex !== -1 && currentIndex !== musicState.playlistIndex) {
          player.playVideoAt(musicState.playlistIndex);
        }
      }
    } catch (error) {
      // Ignore errors that happen when player is unmounted or reloading
      console.warn("YouTube player API error:", error);
    }
  }, [musicState]);

  const handlePlay = () => {
    if (!musicState || !playerRef.current) return;
    playCutePop();
    try {
      const time = playerRef.current.getCurrentTime();
      setMusicState({
        ...musicState,
        isPlaying: true,
        timestamp: time,
        updatedAt: Date.now(),
        setBy: currentUser,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePause = () => {
    if (!musicState || !playerRef.current) return;
    playCutePop();
    try {
      const time = playerRef.current.getCurrentTime();
      setMusicState({
        ...musicState,
        isPlaying: false,
        timestamp: time,
        updatedAt: Date.now(),
        setBy: currentUser,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSetSong = (e: React.FormEvent) => {
    e.preventDefault();
    const id = getYouTubeID(inputUrl);
    
    let listParam = null;
    try {
      const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
      listParam = urlObj.searchParams.get('list');
    } catch (err) {
      // ignore
    }

    if (!id && !listParam) return;
    
    playCutePop();
    setMusicState({
      youtubeId: id || '',
      isPlaylist: !!listParam,
      playlistId: listParam || undefined,
      playlistIndex: 0,
      title: listParam ? 'YouTube Playlist' : 'YouTube Sync',
      isPlaying: true,
      timestamp: 0,
      updatedAt: Date.now(),
      setBy: currentUser,
    });
    setInputUrl('');
  };

  const handleNextTrack = () => {
    if (!musicState || !musicState.isPlaylist || !playerRef.current) return;
    playCutePop();
    try {
      const currentIndex = playerRef.current.getPlaylistIndex() || 0;
      setMusicState({
        ...musicState,
        playlistIndex: currentIndex + 1,
        timestamp: 0,
        updatedAt: Date.now(),
        setBy: currentUser
      });
    } catch(e) {
      console.warn(e);
    }
  };

  const getName = (role: 'Sapo' | 'Mi Rey') => {
    return role === 'Sapo' ? sapoProfile.name : miReyProfile.name;
  };

  // If there's no music state, show the empty card
  if (!musicState) {
    return (
      <div className="w-full lg:w-[32%] bg-[#2E2247] rounded-[2rem] p-5 flex flex-col justify-between shadow-xl border border-[#5a4042]/20 relative overflow-hidden group">
        <div className="z-10 flex flex-col h-full justify-between items-center text-center p-2">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="material-symbols-outlined text-[#e2bec0]/50 cursor-not-allowed">queue_music</span>
            <span className="font-label-caps text-[10px] text-[#e2bec0]/50 uppercase tracking-widest bg-[#201439] px-3 py-1 rounded-full border border-[#5a4042]/30">
              Sin Música
            </span>
            <span className="material-symbols-outlined text-[#e2bec0]">favorite</span>
          </div>

          <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden relative shadow-2xl my-2 bg-[#201439] flex flex-col items-center justify-center border border-[#5a4042]/30 text-[#e2bec0]/50">
             <span className="material-symbols-outlined text-4xl mb-2">music_off</span>
             <span className="text-xs font-label-mono">Ninguna canción</span>
          </div>

          <form onSubmit={handleSetSong} className="flex flex-col gap-2 w-full mt-4">
             <p className="text-[10px] text-[#e2bec0]/60 uppercase font-label-mono mb-1">Pon algo para los dos:</p>
             <div className="flex gap-2 w-full">
               <input
                 type="text"
                 value={inputUrl}
                 onChange={(e) => setInputUrl(e.target.value)}
                 placeholder="Link de YouTube..."
                 className="flex-1 bg-[#201439] border border-[#5a4042]/40 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-[#7adaa1]/50 transition-colors"
               />
               <button type="submit" disabled={!inputUrl} className="bg-[#7adaa1] disabled:opacity-50 text-[#180c30] px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95">→</button>
             </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[32%] bg-[#2E2247] rounded-[2rem] p-5 flex flex-col justify-between shadow-xl border border-[#5a4042]/20 relative overflow-hidden group">
      {/* Blurred Background Art (Optional, use a default color if no cover) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110 z-0 transition-opacity duration-1000 group-hover:opacity-35" 
        style={{ backgroundColor: '#7adaa1' }}
      ></div>

      <div className="z-10 flex flex-col h-full justify-between items-center text-center p-2">
        <div className="w-full flex justify-between items-center mb-3">
          <button 
            onClick={musicState.isPlaylist ? handleNextTrack : undefined}
            className={`material-symbols-outlined transition-colors ${musicState.isPlaylist ? 'text-[#7adaa1] hover:text-white cursor-pointer active:scale-95' : 'text-[#e2bec0]/50 cursor-not-allowed'}`}
            title={musicState.isPlaylist ? "Siguiente canción" : "No es una playlist"}
          >
            queue_music
          </button>
          <span className="font-label-caps text-[10px] text-[#7adaa1] uppercase tracking-widest bg-[#7adaa1]/10 px-3 py-1 rounded-full border border-[#7adaa1]/20">
            {musicState.isPlaying ? 'Now Playing 🎵' : 'Paused'}
          </span>
          <span className="material-symbols-outlined text-[#e2bec0]">favorite</span>
        </div>

        {/* YouTube Video Container replacing the Cover Image */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden relative shadow-2xl my-2 border border-white/10 bg-black group-hover:scale-105 transition-transform duration-500">
          <YouTube
            videoId={musicState.youtubeId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: { 
                autoplay: 1, 
                controls: 0, 
                disablekb: 1,
                ...(musicState.isPlaylist ? { listType: 'playlist', list: musicState.playlistId } : {})
              },
            }}
            onReady={(e) => {
              playerRef.current = e.target;
              if (!musicState.isPlaying) e.target.pauseVideo();
            }}
            className="w-full h-full pointer-events-none"
          />
          {musicState.isPlaying && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
              <div className="w-1 h-3 bg-[#ff5470] animate-pulse"></div>
              <div className="w-1 h-5 bg-[#fabc41] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-2 bg-[#7adaa1] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center my-3 w-full">
          <span className="font-headline-md text-white text-lg sm:text-xl leading-tight truncate w-full">
            {musicState.title}
          </span>
          <span className="font-body-md text-[#e2bec0] text-xs sm:text-sm mt-0.5 truncate w-full flex items-center justify-center gap-1">
             <span className="material-symbols-outlined text-[14px]">person</span>
             Puesta por {getName(musicState.setBy)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-col w-full gap-3 mb-3">
          <div className="flex items-center justify-center gap-6 w-full bg-[#221934]/60 py-2.5 px-4 rounded-full backdrop-blur-sm border border-[#5a4042]/20">
            <button 
              onClick={musicState.isPlaying ? handlePause : handlePlay}
              aria-label={musicState.isPlaying ? "Pause" : "Play"}
              className="w-13 h-13 p-3 bg-[#ff5470] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_16px_rgba(255,84,112,0.5)]"
            >
              <span className="material-symbols-outlined text-2xl">
                {musicState.isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-[#e2bec0]/70 text-sm">volume_down</span>
            <input 
              type="range" 
              min="0" max="100" 
              value={localVolume}
              onChange={(e) => {
                const vol = parseInt(e.target.value, 10);
                setLocalVolume(vol);
                localStorage.setItem('ourlobby_music_volume', vol.toString());
              }}
              className="flex-1 h-1.5 bg-[#201439] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#7adaa1] [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="material-symbols-outlined text-[#e2bec0]/70 text-sm">volume_up</span>
          </div>
        </div>

        <form onSubmit={handleSetSong} className="flex gap-2 w-full">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Cambiar (link de YouTube)"
            className="flex-1 bg-[#201439] border border-[#5a4042]/40 rounded-xl px-3 py-1.5 text-[10px] outline-none text-white placeholder-[#e2bec0]/30 focus:border-[#7adaa1]/50 transition-colors"
          />
          <button type="submit" disabled={!inputUrl} className="bg-[#5a4042]/40 text-[#e2bec0] disabled:opacity-50 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-[#5a4042] transition-colors">↻</button>
        </form>
      </div>
    </div>
  );
};
