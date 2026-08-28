import React, { useEffect, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { MusicState } from '../types';
import { useSyncedDoc } from '../lib/useFirestore';

export const GlobalYouTubeSync: React.FC = () => {
  const [musicState] = useSyncedDoc<MusicState | null>('shared', 'music_state', 'ourlobby_music', null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    if (!musicState || !playerRef.current) return;
    const player = playerRef.current;
    
    const playerState = player.getPlayerState();
    const currentTime = player.getCurrentTime();

    if (musicState.isPlaying && playerState !== 1) {
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
  }, [musicState]);

  if (!musicState) return null;

  return (
    <div className="fixed -top-full -left-full w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-[-9999]">
      <YouTube
        videoId={musicState.youtubeId}
        opts={{
          width: '1',
          height: '1',
          playerVars: { autoplay: 1, controls: 0, disablekb: 1 },
        }}
        onReady={(e) => {
          playerRef.current = e.target;
          if (!musicState.isPlaying) e.target.pauseVideo();
        }}
      />
    </div>
  );
};
