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
    const statusIndicator = document.getElementById('statusIndicator');
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
    let retryState = {
        count: 0,
        timerId: null
    };
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
    let statusMessageTimeout = null;

    // Show non-blocking status message in the status indicator
    const showStatusMessage = (message, type = 'error', duration = 5000) => {
        if (statusMessageTimeout) {
            clearTimeout(statusMessageTimeout);
            statusMessageTimeout = null;
        }
        statusIndicator.textContent = message;
        statusIndicator.classList.add('text', type);
        if (duration > 0) {
            statusMessageTimeout = setTimeout(() => {
                statusIndicator.textContent = '';
                statusIndicator.classList.remove('text', type);
                statusMessageTimeout = null;
            }, duration);
        }
    };

    const clearStatusMessage = () => {
        if (statusMessageTimeout) {
            clearTimeout(statusMessageTimeout);
            statusMessageTimeout = null;
        }
        statusIndicator.textContent = '';
        statusIndicator.classList.remove('text', 'error', 'online', 'buffering', 'paused');
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

    const MAX_RETRIES = 3;
    const RETRY_BASE_DELAY = 1000; // 1 Sekunde Basis-Wartezeit

    const setupHlsPlayer = (url) => {
        // Cleanup vorheriger Player
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
        // Retry-Zustand zurücksetzen
        if (retryState.timerId) {
            clearTimeout(retryState.timerId);
            retryState.timerId = null;
        }
        retryState.count = 0;
        disableAllTextTracks();
        
        if (window.Hls?.isSupported()) {
            // HLS.js uses XHR which requires CORS
            videoPlayer.setAttribute('crossorigin', 'anonymous');
            hlsPlayer = new Hls({
                xhrSetup: function(xhr, url) {
                    xhr.withCredentials = false; // Keine Credentials senden, hilft oft bei CORS Problemen
                }
            });
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            
            const onManifestParsed = () => {
                clearStatusMessage();
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

                // Error Recovery für Netzwerk- und Medienfehler
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            if (retryState.count < MAX_RETRIES) {
                                const delay = RETRY_BASE_DELAY * Math.pow(2, retryState.count);
                                console.warn(`Fataler Netzwerkfehler (Versuch ${retryState.count + 1}/${MAX_RETRIES}), nächster Versuch in ${delay}ms...`);
                                retryState.timerId = setTimeout(() => {
                                    retryState.count++;
                                    if (hlsPlayer) {
                                        hlsPlayer.startLoad();
                                    }
                                }, delay);
                            } else {
                                console.error(`Maximale Wiederholungsanzahl (${MAX_RETRIES}) erreicht. Netzwerkfehler können nicht behoben werden.`);
                                hlsPlayer.destroy();
                                hlsPlayer = null;
                                showStatusMessage(`Netzwerkfehler: Nach ${MAX_RETRIES} Versuchen keine Verbindung. Bitte Internetverbindung prüfen und Seite neu laden.`, 'error', 0);
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn("Fataler Medienfehler, versuche Wiederherstellung...");
                            hlsPlayer.recoverMediaError();
                            break;
                        default:
                            console.error("Nicht behebbarer Fehler, Player wird gestoppt.");
                            hlsPlayer.destroy();
                            hlsPlayer = null;
                            showStatusMessage(`Schwerwiegender Fehler: ${data.details}. Bitte Seite neu laden.`, 'error', 0);
                            break;
                    }
                }
                // HLS.js handles non-fatal errors automatically; no manual recovery needed for bufferAppendError
            };
            
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
            hlsPlayer.on(Hls.Events.ERROR, onHlsError);
            
        } else if(videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // Native Safari HLS: Remove crossorigin to avoid CORS enforcement for streams without headers
            videoPlayer.removeAttribute('crossorigin');
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => {
                clearStatusMessage();
                videoPlayer.play().catch(e => console.log('Autoplay failed on native player:', e));
                settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
            }, { once: true });
        } else {
            console.error('HLS is not supported by your browser.');
            showStatusMessage('Ihr Browser unterstützt dieses Videoformat nicht.', 'error', 0);
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
                clearStatusMessage();
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
