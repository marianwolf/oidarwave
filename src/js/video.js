document.addEventListener('DOMContentLoaded', () => {
    // === KONSTANTEN ===
    const SEEK_TIME = 10;
    const DATA_SAVE_MODE_KEY = 'dataSaveMode';
    const CAPTION_ENABLED_KEY = 'captionsEnabled';
    const CAPTION_TRACK_KINDS = ['subtitles', 'captions', 'metadata'];

    // === MEDIA SESSION API (Android/iOS Lock Screen & System Controls) ===
    const setupMediaSession = (stationName) => {
        if ('mediaSession' in navigator) {
            console.log('MediaSession Video: Setting metadata', stationName);
            
            navigator.mediaSession.metadata = new MediaMetadata({
                title: stationName || 'Livestream',
                artist: 'Livestream',
                album: 'Oidarwave Video',
                artwork: [
                    { src: '/favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
                    { src: '/favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
                    { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
                ]
            });

            try {
                navigator.mediaSession.setActionHandler('play', () => {
                    console.log('MediaSession: Play action');
                    videoPlayer.play();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    console.log('MediaSession: Pause action');
                    videoPlayer.pause();
                });
            } catch (e) {
                console.warn('MediaSession action handlers error:', e);
            }
        }
    };

    const clearMediaSession = () => {
        if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
            console.log('MediaSession Video: Clearing metadata');
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
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            
            // Event-Handler als benannte Funktion für mögliche Cleanup
            const onManifestParsed = () => {
                videoPlayer.play().catch(e => console.log('Autoplay failed:', e));
                updateQualityLevel();
                settingsCache.captionsEnabled ? enableCaptions() : disableCaptions();
            };
            
            const onHlsError = (event, data) => {
                console.error(`HLS.js Fehler: ${data.details}`, data);
                
                // Erweiterte Diagnose-Informationen
                if (data.response) {
                    const httpStatus = data.response.code;
                    const errorMessages = {
                        403: 'HTTP 403 - Zugriff verweigert (CORS oder Authentifizierung)',
                        404: 'HTTP 404 - Stream-URL nicht gefunden',
                        0: 'Netzwerkfehler oder CORS-Blockade'
                    };
                    console.error(`HTTP-Status: ${httpStatus} - ${errorMessages[httpStatus] || 'Unbekannt'}`);
                }

                if (data.details === 'bufferAppendError') {
                    console.error('DIAGNOSE: bufferAppendError - Fragment konnte nicht in den Buffer geschrieben werden');
                }

                if (data.fatal) {
                    const errorMessages = {
                        bufferAppendError: 'Buffer-Fehler: Fragment konnte nicht verarbeitet werden.',
                        networkError: 'Netzwerkfehler beim Laden des Streams.',
                        mediaError: 'Medienfehler: Stream konnte nicht abgespielt werden.'
                    };
                    
                    const errorMsg = errorMessages[data.details] || errorMessages[data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'networkError' : data.type === Hls.ErrorTypes.MEDIA_ERROR ? 'mediaError' : 'bufferAppendError'];
                    
                    alert(`${errorMsg} (${data.details})\n\nBitte versuchen Sie es erneut oder wechseln Sie den Sender.`);
                }
            };
            
            // Event-Listener registrieren
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
            hlsPlayer.on(Hls.Events.ERROR, onHlsError);
            hlsPlayer.on(Hls.Events.FRAG_BUFFER_FAILED, (event, data) => {
                console.error('Fragment buffer failed:', data);
            });
            
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
