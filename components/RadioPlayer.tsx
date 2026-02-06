'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { radioStations, RadioStation } from '@/lib/stations';

interface PlayerStatus {
  isOnline: boolean;
  hasError: boolean;
  isStalled: boolean;
  isPaused: boolean;
}

export default function RadioPlayer() {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [songTitle, setSongTitle] = useState<string>('');
  const [status, setStatus] = useState<PlayerStatus>({
    isOnline: true,
    hasError: false,
    isStalled: false,
    isPaused: true,
  });
  const [activeButtonIndex, setActiveButtonIndex] = useState<number>(-1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const metadataIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStatusClass = useCallback(() => {
    if (!navigator.onLine) return 'error';
    if (status.hasError) return 'error';
    if (status.isPaused) return 'paused';
    if (status.isStalled) return 'buffering';
    return 'online';
  }, [status]);

  const fetchMetadata = useCallback(async (metadataUrl: string) => {
    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`Netzwerkfehler: ${response.status}`);
      }

      let trackTitle: string | null = null;

      if (metadataUrl.endsWith('.txt')) {
        const text = await response.text();
        trackTitle = text.split('\n')[0].trim();
      } else {
        const json = await response.json();
        const title = (json?.song_now_title as string) ||
                      ((json?.playlistItem as Record<string, unknown>)?.title as string) ||
                      undefined;
        const artist = (json?.name as string) ||
                       (json?.subtitle as string) ||
                       (json?.song_now_interpret as string) ||
                       ((json?.playlistItem as Record<string, unknown>)?.artist as string) ||
                       undefined;

        if (title && artist) {
          trackTitle = `${title} - ${artist}`;
        } else if (title) {
          trackTitle = title;
        } else if (artist) {
          trackTitle = artist;
        }
      }

      if (trackTitle && trackTitle.length > 0) {
        setSongTitle(trackTitle);
      } else {
        setSongTitle('Keine Titelinformationen');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Metadaten:', error);
      setSongTitle('Metadaten nicht verfügbar');
    }
  }, []);

  const selectStation = useCallback((station: RadioStation, index: number) => {
    setCurrentStation(station);
    setActiveButtonIndex(index);
    setSongTitle('Lädt...');

    if (audioRef.current) {
      audioRef.current.src = station.url;
      audioRef.current.load();
    }

    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
    }

    if (station.metadataUrl) {
      fetchMetadata(station.metadataUrl);
      metadataIntervalRef.current = setInterval(() => {
        fetchMetadata(station.metadataUrl!);
      }, 1000);
    } else {
      setSongTitle('Metadaten nicht verfügbar');
    }
  }, [fetchMetadata]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (!audioRef.current) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        audioRef.current.volume = Math.min(1, audioRef.current.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1);
        break;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setStatus(prev => ({ ...prev, isStalled: true }));
    };

    const handleCanPlay = () => {
      setStatus(prev => ({ ...prev, isStalled: false, hasError: false }));
      if (audio.paused) {
        audio.play();
      }
    };

    const handlePlaying = () => {
      setStatus(prev => ({ ...prev, isStalled: false, hasError: false, isPaused: false }));
    };

    const handlePause = () => {
      setStatus(prev => ({ ...prev, isPaused: true }));
    };

    const handleWaiting = () => {
      setStatus(prev => ({ ...prev, isStalled: true }));
    };

    const handleError = () => {
      setStatus(prev => ({ ...prev, hasError: true, isStalled: false }));
    };

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);

      if (metadataIntervalRef.current) {
        clearInterval(metadataIntervalRef.current);
      }
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const savedUrl = localStorage.getItem('lastStationAudioUrl');
    let station = radioStations[0];

    if (savedUrl) {
      const savedStation = radioStations.find(s => s.url === savedUrl);
      if (savedStation) {
        station = savedStation;
      }
    }

    const savedIndex = radioStations.findIndex(s => s.url === station.url);
    selectStation(station, savedIndex);
  }, [selectStation]);

  return (
    <section className="player-section">
      <div className="station-selector">
        <h2>📻 Sender auswählen</h2>
        <div className="station-grid">
          {radioStations.map((station, index) => (
            <button
              key={station.url}
              className={`station-btn ${activeButtonIndex === index ? 'active' : ''}`}
              onClick={() => selectStation(station, index)}
            >
              {station.name}
            </button>
          ))}
        </div>
      </div>

      <div className="player-controls">
        <div className="current-station">
          <span className={`status-indicator ${getStatusClass()}`}></span>
          <span>{currentStation?.name || 'Sender auswählen'}</span>
        </div>
        <div className="audio-controls">
          <audio
            ref={audioRef}
            controls
            preload="none"
          >
            Ihr Browser unterstützt leider keine HTML5-Audiowiedergabe.
          </audio>
          <span>{songTitle}</span>
        </div>
      </div>
    </section>
  );
}
