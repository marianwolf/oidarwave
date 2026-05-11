document.addEventListener('DOMContentLoaded', () => {
    // === KONSTANTEN ===
    const SEEK_TIME = 10;
    const DATA_SAVE_MODE_KEY = 'dataSaveMode';
    const CAPTION_ENABLED_KEY = 'captionsEnabled';
    const CAPTION_TRACK_KINDS = ['subtitles', 'captions', 'metadata'];

    // === MEDIA SESSION API (Android/iOS Lock Screen & System Controls) ===
    const setupMediaSession = (stationName) => {
        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: stationName || 'Livestream',
                    artist: 'Livestream',
                    album: 'Oidarwave Video',
                    artwork: [
                        { src: '/favicon/favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
                        { src: '/favicon/favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
                        { src: '/favicon/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
                    ]
                });

                navigator.mediaSession.setActionHandler('play', () => {
                    videoPlayer?.play();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    videoPlayer?.pause();
                });
            } catch (e) {
                console.warn('MediaSession Einrichtung fehlgeschlagen:', e);
            }
        }
    };

    const clearMediaSession = () => {
        if ('mediaSession' in navigator && navigator.mediaSession?.metadata) {
            navigator.mediaSession.metadata = null;
        }
    };

    // === DOM-REFERENZEN CACHEN ===
    const dataModeToggle = document.getElementById('dataModeToggle');
    const captionToggle = document.getElementById('captionToggle');
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const rewindButton = document.getElementById('rewindButton');
    const forwardButton = document.getElementById('forwardButton');

    if (!videoPlayer) {
        console.warn('Video-Element nicht gefunden.');
        return;
    }

    // iOS: Inline-Wiedergabe ermöglichen
    videoPlayer.setAttribute('playsinline', '');
    videoPlayer.setAttribute('webkit-playsinline', '');

    // === STATE CACHING ===
    let hlsPlayer = null;
    let settingsCache = {
        dataSaveMode: (() => {
            try {
                return localStorage.getItem(DATA_SAVE_MODE_KEY) === 'true';
            } catch (e) {
                console.warn('localStorage Zugriff fehlgeschlagen:', e);
                return false;
            }
        })(),
        captionsEnabled: (() => {
            try {
                return localStorage.getItem(CAPTION_ENABLED_KEY) === 'true';
            } catch (e) {
                console.warn('localStorage Zugriff fehlgeschlagen:', e);
                return false;
            }
        })()
    };

    // Automatisch alle neuen Tracks deaktivieren
    videoPlayer.textTracks.addEventListener('addtrack', (event) => {
        if (!settingsCache.captionsEnabled && event.track) {
            event.track.mode = 'disabled';
        }
    });

    // === HELPER FUNCTIONS ===
    
    // Optimiert: for...of statt rückwärts-Iteration
    const disableAllTextTracks = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = false;
        for (const track of videoPlayer.textTracks) {
            track.mode = 'disabled';
        }
    };

    // Optimiert: Optional chaining und konsistenter Rückgabewert
    const findCaptionTrack = () => {
        return Array.from(videoPlayer.textTracks)
            .find(track => CAPTION_TRACK_KINDS.includes(track?.kind)) ?? null;
    };

    const updateQualityLevel = () => {
        if (!hlsPlayer || hlsPlayer.levels.length === 0) return;
        hlsPlayer.currentLevel = settingsCache.dataSaveMode ? 0 : -1;
    };

    // === CAPTION MANAGEMENT ===
    
    const disableCaptions = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = false;
        disableAllTextTracks();
    };

    const enableCaptions = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = true;
        const track = findCaptionTrack();
        if (track) track.mode = 'showing';
    };

    const toggleCaptions = () => {
        const newState = !settingsCache.captionsEnabled;
        settingsCache.captionsEnabled = newState;
        
        captionToggle.setAttribute('aria-pressed', String(newState));
        try {
            localStorage.setItem(CAPTION_ENABLED_KEY, String(newState));
        } catch (e) {
            console.warn('localStorage speichern fehlgeschlagen:', e);
        }
        
        newState ? enableCaptions() : disableCaptions();
    };

    const initializeCaptions = () => {
        captionToggle.setAttribute('aria-pressed', String(settingsCache.captionsEnabled));
        settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
    };

    // === HLS PLAYER SETUP ===
    
    const setupHlsPlayer = (url) => {
        // Cleanup vorheriger Player
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
        disableAllTextTracks();
        
        if (window.Hls?.isSupported()) {
            hlsPlayer = new Hls({
                xhrSetup: function(xhr, url) {
                    xhr.withCredentials = false; // Keine Credentials senden, hilft oft bei CORS Problemen
                }
            });
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            
            const onManifestParsed = () => {
                videoPlayer.play().catch(e => console.log('Autoplay failed:', e));
                updateQualityLevel();
                settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
            };
            
            const onHlsError = (event, data) => {
                console.error(`HLS.js Fehler: ${data.details}`, data);
                
                if (data.response) {
                    const httpStatus = data.response.code;
                    console.error(`HTTP-Status: ${httpStatus}`);
                }

                // Error Recovery für bufferAppendError und andere Medienfehler
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn("Fataler Netzwerkfehler, versuche Neustart des Ladevorgangs...");
                            hlsPlayer.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn("Fataler Medienfehler, versuche Wiederherstellung...");
                            hlsPlayer.recoverMediaError();
                            break;
                        default:
                            console.error("Nicht behebbarer Fehler, Player wird gestoppt.");
                            hlsPlayer.destroy();
                            hlsPlayer = null;
                            alert(`Ein schwerwiegender Fehler ist aufgetreten (${data.details}). Bitte laden Sie die Seite neu.`);
                            break;
                    }
                } else if (data.details === 'bufferAppendError') {
                    console.warn('bufferAppendError aufgetreten, versuche Wiederherstellung des Buffers...');
                    hlsPlayer.recoverMediaError();
                }
            };
            
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
            hlsPlayer.on(Hls.Events.ERROR, onHlsError);
            
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.play().catch(e => console.log('Autoplay failed on native player:', e));
                settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
            }, { once: true });
        } else {
            console.error('HLS is not supported by your browser.');
            alert('Ihr Browser unterstützt dieses Videoformat nicht.');
        }
    };
    
    // === SEEK FUNCTIONALITY ===
    
    const seek = (seconds) => {
        const { currentTime, duration } = videoPlayer;
        videoPlayer.currentTime = Math.max(0, Math.min(duration || Infinity, currentTime + seconds));
    };

    // === DATA SAVE MODE ===
    
    const toggleDataSaveMode = () => {
        settingsCache.dataSaveMode = !settingsCache.dataSaveMode;
        dataModeToggle.setAttribute('aria-pressed', String(settingsCache.dataSaveMode));
        try {
            localStorage.setItem(DATA_SAVE_MODE_KEY, String(settingsCache.dataSaveMode));
        } catch (e) {
            console.warn('localStorage speichern fehlgeschlagen:', e);
        }
        updateQualityLevel();
    };

    // === EVENT LISTENERS ===
    
    const initializeEventListeners = () => {
        // Station buttons - Event Delegation für bessere Performance
        stationButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStationDisplay.textContent = button.dataset.name;
                setupHlsPlayer(button.dataset.url);
                setupMediaSession(button.dataset.name);
            }, { passive: true });
        });
        
        dataModeToggle.addEventListener('click', toggleDataSaveMode, { passive: true });
        captionToggle.addEventListener('click', toggleCaptions, { passive: true });
        if (rewindButton) rewindButton.addEventListener('click', () => seek(-SEEK_TIME), { passive: true });
        if (forwardButton) forwardButton.addEventListener('click', () => seek(SEEK_TIME), { passive: true });
        
        // Visibility change - mit passiven Optionen
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                videoPlayer.play().catch(e => console.log('Resume playback failed:', e));
            }
        }, { passive: true });
        
        // Update Media Session when playback state changes
        videoPlayer.addEventListener('pause', () => {
            console.log('Video: Paused - updating MediaSession');
        });
        
        videoPlayer.addEventListener('playing', () => {
            console.log('Video: Playing - MediaSession active');
        });
        
        // Tastatur-Navigation
        document.addEventListener('keydown', (event) => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
            
            if (isInputFocused) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    seek(-SEEK_TIME);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    seek(SEEK_TIME);
                    break;
            }
        }, { passive: false });
    };

    // === INITIALIZATION ===
    
    const initializePlayer = () => {
        dataModeToggle.setAttribute('aria-pressed', String(settingsCache.dataSaveMode));
        initializeCaptions();
        
        const firstStationButton = stationButtons[0];
        if (firstStationButton) {
            currentStationDisplay.textContent = firstStationButton.dataset.name;
            setupHlsPlayer(firstStationButton.dataset.url);
            setupMediaSession(firstStationButton.dataset.name);
        }
    };

    // === START ===
    initializeEventListeners();
    initializePlayer();
});
