/**
 * HLS Video Player - Initialisiert und verwaltet HLS-Videowiedergabe mit Hls.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle') as HTMLButtonElement | null;
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement | null;
    const currentStationDisplay = document.getElementById('currentStation') as HTMLElement | null;
    const rewindButton = document.getElementById('rewindButton') as HTMLButtonElement | null;
    const forwardButton = document.getElementById('forwardButton') as HTMLButtonElement | null;
    const localStorageKey = 'dataSaveMode';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hlsPlayer: any = null;
    const seekTime = 10;

    if (!videoPlayer) return;

    videoPlayer.setAttribute('playsinline', '');
    videoPlayer.setAttribute('webkit-playsinline', '');

    /**
     * Aktualisiert das Qualitätslevel basierend auf dem Data-Save-Modus
     */
    const updateQualityLevel = (): void => {
        if (!hlsPlayer || (hlsPlayer.levels && hlsPlayer.levels.length === 0)) {
            return;
        }
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        hlsPlayer.currentLevel = isDataSaveModeEnabled ? 0 : -1;
    };

    /**
     * Richtet den HLS-Player ein
     */
    const setupHlsPlayer = (url: string): void => {
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
        
        for (const track of videoPlayer.textTracks) {
            track.mode = 'hidden';
        }
        
        // Prüfen ob Hls.js verfügbar ist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const HlsAny = (window as unknown as { Hls?: any }).Hls;
        if (HlsAny && typeof HlsAny.isSupported === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const HlsConstructor = HlsAny.new as new () => any;
            hlsPlayer = new HlsConstructor();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            
            hlsPlayer.on(HlsAny.Events.MANIFEST_PARSED, () => {
                videoPlayer.play()
                    .catch((e: Error) => {
                        console.log('Autoplay failed, user interaction may be required:', e);
                    });
                updateQualityLevel();
            });
            
            hlsPlayer.on(HlsAny.Events.ERROR, (_event: unknown, data: { type: string; details: string; fatal: boolean }) => {
                console.error(`HLS.js error: ${data.details}`, data);
                if (data.fatal) {
                    switch (data.type) {
                        case HlsAny.ErrorTypes.NETWORK_ERROR:
                            console.error('Network error, trying to recover...');
                            hlsPlayer?.startLoad();
                            break;
                        case HlsAny.ErrorTypes.MEDIA_ERROR:
                            console.error('Media error, trying to recover...');
                            hlsPlayer?.recoverMediaError();
                            break;
                        default:
                            alert(`Kritischer Fehler beim Laden des Streams (${data.details}). Bitte versuchen Sie es erneut oder wechseln Sie den Sender.`);
                            break;
                    }
                }
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.play().catch((e: Error) => console.log('Autoplay failed on native player:', e));
            }, { once: true });
        } else {
            console.error('HLS is not supported by your browser and Hls.js is not available.');
            alert('Ihr Browser unterstützt dieses Videoformat nicht und HLS.js ist nicht geladen.');
        }
    };
    
    /**
     * Spult zurück
     */
    const rewind = (): void => {
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - seekTime);
    };
    
    /**
     * Spult vorwärts
     */
    const forward = (): void => {
        videoPlayer.currentTime = Math.min(videoPlayer.duration || Infinity, videoPlayer.currentTime + seekTime);
    };

    /**
     * Schaltet den Data-Save-Modus um
     */
    const toggleDataSaveMode = (): void => {
        const currentState = dataModeToggle?.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;
        if (dataModeToggle) {
            dataModeToggle.setAttribute('aria-pressed', newState.toString());
        }
        localStorage.setItem(localStorageKey, newState.toString());
        updateQualityLevel();
    };

    /**
     * Behandelt Tastatureingaben
     */
    const handleKeyDown = (event: KeyboardEvent): void => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
            return;
        }
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                rewind();
                break;
            case 'ArrowRight':
                event.preventDefault();
                forward();
                break;
        }
    };

    /**
     * Initialisiert alle Event Listener
     */
    const initializeEventListeners = (): void => {
        stationButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const btn = button as HTMLElement;
                if (currentStationDisplay && btn.dataset.name) {
                    currentStationDisplay.textContent = btn.dataset.name;
                }
                if (btn.dataset.url) {
                    setupHlsPlayer(btn.dataset.url);
                }
            });
        });
        
        if (dataModeToggle) {
            dataModeToggle.addEventListener('click', toggleDataSaveMode);
        }
        
        rewindButton?.addEventListener('click', rewind);
        forwardButton?.addEventListener('click', forward);
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                videoPlayer.play().catch((e: Error) => console.log('Attempt to resume playback failed:', e));
            }
        });
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Bereinigung beim Verlassen der Seite
        window.addEventListener('beforeunload', () => {
            hlsPlayer?.destroy();
        });
    };

    /**
     * Initialisiert den Player
     */
    const initializePlayer = (): void => {
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        if (dataModeToggle) {
            dataModeToggle.setAttribute('aria-pressed', isDataSaveModeEnabled.toString());
        }
        
        const firstStationButton = stationButtons[0] as HTMLElement | undefined;
        if (firstStationButton && currentStationDisplay && firstStationButton.dataset.name) {
            currentStationDisplay.textContent = firstStationButton.dataset.name;
            if (firstStationButton.dataset.url) {
                setupHlsPlayer(firstStationButton.dataset.url);
            }
        }
    };

    initializeEventListeners();
    initializePlayer();
});
