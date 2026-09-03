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
        logError(ErrorCode.PLAYER_INIT_NO_ELEMENT, null, { selector: '#videoPlayer', page: location.pathname });
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
    const getSetting = (key) => {
        try { return localStorage.getItem(key) === 'true'; }
        catch (e) { logStorageError(ErrorCode.STORAGE_READ, e, key); return false; }
    };

    let settingsCache = {
        dataSaveMode: getSetting(DATA_SAVE_MODE_KEY),
        captionsEnabled: getSetting(CAPTION_ENABLED_KEY)
    };
    
    const saveSetting = (key, value, toggleElement) => {
        if (toggleElement) toggleElement.setAttribute('aria-pressed', String(value));
        try { localStorage.setItem(key, String(value)); }
        catch (e) { logStorageError(ErrorCode.STORAGE_WRITE, e, key); }
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
        settingsCache.captionsEnabled = !settingsCache.captionsEnabled;
        saveSetting(CAPTION_ENABLED_KEY, settingsCache.captionsEnabled, captionToggle);
        settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
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
                xhrSetup: function(xhr) {
                    xhr.withCredentials = false; // Keine Credentials senden, hilft oft bei CORS Problemen
                }
            });
            const playerInstance = hlsPlayer;
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            
            const onManifestParsed = () => {
                if (hlsPlayer !== playerInstance) return;
                clearStatusMessage();
                videoPlayer.play().catch(e => handlePlayError(e, 'manifest-parsed'));
                updateQualityLevel();
                settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
            };
            
            const onHlsError = (event, data) => {
                if (hlsPlayer !== playerInstance) return;

                const mappedType = HlsErrorMap[data.type] || data.type;
                const ctx = {
                  type: data.type,
                  mappedType,
                  fatal: data.fatal,
                  details: data.details,
                  url: hlsPlayer?.url
                };

                if (data.response) {
                  ctx.httpStatus = data.response.code;
                  ctx.httpUrl = data.response.url;
                }
                if (data.error && data.error.code !== undefined) {
                  ctx.systemErrorCode = data.error.code;
                }

                if (data.fatal) {
                  logError(ErrorCode.HLS_FATAL, null, ctx);
                } else {
                  logError(ErrorCode[`HLS_${mappedType}`] || 'HLS_ERROR', null, ctx);
                }

                // Error Recovery für Netzwerk- und Medienfehler
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            if (retryState.count < MAX_RETRIES) {
                                const delay = RETRY_BASE_DELAY * Math.pow(2, retryState.count);
                                logWarn('HLS_NETWORK_RETRY', null, { attempt: retryState.count + 1, max: MAX_RETRIES, delayMs: delay });
                                retryState.timerId = setTimeout(() => {
                                    retryState.count++;
                                    if (hlsPlayer === playerInstance) {
                                        hlsPlayer.startLoad();
                                    }
                                }, delay);
                            } else {
                                logError(ErrorCode.HLS_NETWORK, null, { retries: MAX_RETRIES, url: hlsPlayer?.url });
                                if (hlsPlayer) {
                                    hlsPlayer.destroy();
                                    hlsPlayer = null;
                                }
                                showStatusMessage(`Netzwerkfehler: Nach ${MAX_RETRIES} Versuchen keine Verbindung. Bitte Internetverbindung prüfen und Seite neu laden.`, 'error', 0);
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            logWarn(ErrorCode.HLS_MEDIA, null, { action: 'recoverMediaError' });
                            if (hlsPlayer) {
                                hlsPlayer.recoverMediaError();
                            }
                            break;
                        default:
                            logError(ErrorCode.HLS_FATAL, null, { details: data.details, type: data.type });
                            if (hlsPlayer) {
                                hlsPlayer.destroy();
                                hlsPlayer = null;
                            }
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
                videoPlayer.play().catch(e => handlePlayError(e, 'native-player'));
                settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
            }, { once: true });
        } else {
            logError(ErrorCode.HLS_FATAL, null, { reason: 'HLS not supported by browser' });
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
        saveSetting(DATA_SAVE_MODE_KEY, settingsCache.dataSaveMode, dataModeToggle);
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
                videoPlayer.play().catch(e => handlePlayError(e, 'visibilitychange-resume'));
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
