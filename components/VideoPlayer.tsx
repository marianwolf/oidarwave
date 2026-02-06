'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { videoStations, VideoStation } from '@/lib/stations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    Hls?: {
      isSupported: () => boolean;
      new: () => unknown;
      Events: {
        MANIFEST_PARSED: string;
        ERROR: string;
      };
      ErrorTypes: {
        NETWORK_ERROR: string;
        MEDIA_ERROR: string;
      };
    };
  }
}

export default function VideoPlayer() {
  const [currentStation, setCurrentStation] = useState<VideoStation | null>(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number>(-1);
  const [isDataSaveMode, setIsDataSaveMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);

  const DATA_SAVE_MODE_KEY = 'dataSaveMode';

  const toggleDataSaveMode = useCallback(() => {
    const newState = !isDataSaveMode;
    setIsDataSaveMode(newState);
    localStorage.setItem(DATA_SAVE_MODE_KEY, newState.toString());

    if (hlsRef.current && hlsRef.current.levels && hlsRef.current.levels.length > 0) {
      hlsRef.current.currentLevel = newState ? 0 : -1;
    }
  }, [isDataSaveMode]);

  const setupHlsPlayer = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    for (const track of video.textTracks) {
      track.mode = 'hidden';
    }

    if (window.Hls && typeof window.Hls.isSupported === 'function') {
      const hls = new window.Hls.new();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e: Error) => {
          console.log('Autoplay failed, user interaction may be required:', e);
        });

        if (hlsRef.current && hlsRef.current.levels && hlsRef.current.levels.length > 0) {
          const isDataSave = localStorage.getItem(DATA_SAVE_MODE_KEY) === 'true';
          hlsRef.current.currentLevel = isDataSave ? 0 : -1;
        }
      });

      hls.on(window.Hls.Events.ERROR, (_event: unknown, data: { type: string; details: string; fatal: boolean }) => {
        console.error(`HLS.js error: ${data.details}`, data);
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...');
              hlsRef.current?.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...');
              hlsRef.current?.recoverMediaError();
              break;
            default:
              alert(`Kritischer Fehler beim Laden des Streams (${data.details}). Bitte versuchen Sie es erneut oder wechseln Sie den Sender.`);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e: Error) => console.log('Autoplay failed on native player:', e));
      }, { once: true });
    } else {
      console.error('HLS is not supported by your browser and Hls.js is not available.');
      alert('Ihr Browser unterstützt dieses Videoformat nicht und HLS.js ist nicht geladen.');
    }
  }, []);

  const selectStation = useCallback((station: VideoStation, index: number) => {
    setCurrentStation(station);
    setActiveButtonIndex(index);
    setupHlsPlayer(station.url);
  }, [setupHlsPlayer]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
        break;
    }
  }, []);

  useEffect(() => {
    const savedDataSaveMode = localStorage.getItem(DATA_SAVE_MODE_KEY) === 'true';
    setIsDataSaveMode(savedDataSaveMode);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.setAttribute('webkit-playsinline', '');
    }

    const firstStation = videoStations[0];
    const firstIndex = 0;
    setCurrentStation(firstStation);
    setActiveButtonIndex(firstIndex);
    setupHlsPlayer(firstStation.url);
  }, [setupHlsPlayer]);

  return (
    <section className="player-section">
      <div className="station-selector">
        <h2>🎥 Sender auswählen</h2>
        <div className="station-grid">
          {videoStations.map((station, index) => (
            <button
              key={station.url}
              className={`station-btn ${activeButtonIndex === index ? 'active' : ''}`}
              onClick={() => selectStation(station, index)}
            >
              {station.name}
            </button>
          ))}
          <button
            id="dataModeToggle"
            className={`data-mode-toggle ${isDataSaveMode ? 'active' : ''}`}
            onClick={toggleDataSaveMode}
            aria-pressed={isDataSaveMode}
          >
            Datensparmodus
          </button>
        </div>
      </div>

      <div className="player-controls">
        <div className="current-station">
          <span className="status-indicator online"></span>
          <span>{currentStation?.name || 'Sender auswählen'}</span>
        </div>
        <div className="video-container">
          <video
            ref={videoRef}
            id="videoPlayer"
            controls
            preload="none"
            playsInline
            webkitPlaysInline
          >
            Ihr Browser unterstützt leider keine HTML5-Videowiedergabe.
          </video>
        </div>
      </div>
    </section>
  );
}
