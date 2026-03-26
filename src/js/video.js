document.addEventListener('DOMContentLoaded', () => {
    // === KONSTANTEN ===
    const SEEK_TIME = 10;
    const DATA_SAVE_MODE_KEY = 'dataSaveMode';
    const CAPTION_ENABLED_KEY = 'captionsEnabled';
    const CAPTION_TRACK_KINDS = ['subtitles', 'captions', 'metadata'];

    const dataModeToggle = document.getElementById('dataModeToggle');
    const captionToggle = document.getElementById('captionToggle');
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const rewindButton = document.getElementById('rewindButton');
    const forwardButton = document.getElementById('forwardButton');
    let hlsPlayer = null;

    videoPlayer.setAttribute('playsinline', '');
    videoPlayer.setAttribute('webkit-playsinline', '');

    // Automatisch alle neuen Tracks deaktivieren
    videoPlayer.textTracks.addEventListener('addtrack', (event) => {
        const isCaptionsEnabled = localStorage.getItem(CAPTION_ENABLED_KEY) === 'true';
        if (!isCaptionsEnabled && event.track) {
            event.track.mode = 'disabled';
        }
    });

    // Helper: Deaktiviert alle Text-Tracks
    const disableAllTextTracks = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = false;
        for (let i = videoPlayer.textTracks.length - 1; i >= 0; i--) {
            videoPlayer.textTracks[i].mode = 'disabled';
        }
    };

    // Helper: Findet den ersten verfügbaren Untertitel-Track
    const findCaptionTrack = () => {
        return Array.from(videoPlayer.textTracks).find(track => CAPTION_TRACK_KINDS.includes(track.kind)) || videoPlayer.textTracks[0];
    };

    const updateQualityLevel = () => {
        if (!hlsPlayer || hlsPlayer.levels.length === 0) return;
        const isDataSaveModeEnabled = localStorage.getItem(DATA_SAVE_MODE_KEY) === 'true';
        hlsPlayer.currentLevel = isDataSaveModeEnabled ? 0 : -1;
    };

    // Untertitel standardmäßig deaktivieren
    const disableCaptions = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = false;
        disableAllTextTracks();
    };

    // Untertitel aktivieren/deaktivieren
    const toggleCaptions = () => {
        const isCaptionsEnabled = captionToggle.getAttribute('aria-pressed') === 'true';
        const newState = !isCaptionsEnabled;
        
        captionToggle.setAttribute('aria-pressed', newState);
        localStorage.setItem(CAPTION_ENABLED_KEY, newState);
        
        if (newState) {
            if (hlsPlayer) hlsPlayer.subtitleDisplay = true;
            const track = findCaptionTrack();
            if (track) track.mode = 'showing';
        } else {
            disableCaptions();
        }
    };

    // Initialisiere Caption-Button-Status
    const initializeCaptions = () => {
        const isCaptionsEnabled = localStorage.getItem(CAPTION_ENABLED_KEY) === 'true';
        captionToggle.setAttribute('aria-pressed', isCaptionsEnabled);
        
        if (isCaptionsEnabled) {
            const track = findCaptionTrack();
            if (track) track.mode = 'showing';
        } else {
            disableCaptions();
        }
    };

    // Helper: Stellt gespeicherten Caption-Status wieder her
    const restoreCaptionState = () => {
        if (localStorage.getItem(CAPTION_ENABLED_KEY) !== 'true') {
            disableCaptions();
        }
    };

    const setupHlsPlayer = (url) => {
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
        disableAllTextTracks();
        
        if (window.Hls && Hls.isSupported()) {
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play().catch(e => console.log('Autoplay failed:', e));
                updateQualityLevel();
                restoreCaptionState();
            });
            
            hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
                console.error(`HLS.js Fehler: ${data.details}`, data);
                console.error('Diagnose-Informationen:', {
                    type: data.type,
                    details: data.details,
                    fatal: data.fatal,
                    url: hlsPlayer.url,
                    error: data.error,
                    response: data.response ? {
                        code: data.response.code,
                        text: data.response.text,
                        abort: data.response.aborted
                    } : null
                });

                // Spezifische Fehlerdiagnose
                if (data.response) {
                    console.error('HTTP-Status:', data.response.code);
                    if (data.response.code === 403) {
                        console.error('DIAGNOSE: HTTP 403 - Zugriff verweigert (CORS oder Authentifizierung)');
                    } else if (data.response.code === 404) {
                        console.error('DIAGNOSE: HTTP 404 - Stream-URL nicht gefunden');
                    } else if (data.response.code === 0) {
                        console.error('DIAGNOSE: Netzwerkfehler oder CORS-Blockade');
                    }
                }

                // bufferAppendError spezifisch behandeln
                if (data.details === 'bufferAppendError') {
                    console.error('DIAGNOSE: bufferAppendError - Fragment konnte nicht in den Buffer geschrieben werden');
                    console.error('Mögliche Ursachen:');
                    console.error('  1. CORS-Problem: Server erlaubt keinen Cross-Origin-Zugriff');
                    console.error('  2. Netzwerkfehler: Verbindung wurde unterbrochen');
                    console.error('  3. Codec-Problem: Browser unterstützt den Video-Codec nicht');
                    console.error('  4. Stream-URL veraltet oder ungültig');
                }

                if (data.fatal) {
                    let errorMessage = 'Kritischer Fehler beim Laden des Streams.';
                    let diagnosis = '';

                    if (data.details === 'bufferAppendError') {
                        errorMessage = 'Buffer-Fehler: Fragment konnte nicht verarbeitet werden.';
                        diagnosis = '\n\nDiagnose:\n- CORS: Stream erlaubt keinen Zugriff\n- Netzwerk: Verbindung wurde unterbrochen\n- Codec: Browser unterstützt das Videoformat nicht\n- URL: Stream-URL ist möglicherweise veraltet';
                    } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        errorMessage = 'Netzwerkfehler beim Laden des Streams.';
                        diagnosis = '\n\nDiagnose:\n- Internetverbindung prüfen\n- Stream-Server möglicherweise nicht erreichbar\n- CORS-Blockade möglich';
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        errorMessage = 'Medienfehler: Stream konnte nicht abgespielt werden.';
                        diagnosis = '\n\nDiagnose:\n- Video-Codec wird nicht unterstützt\n- Stream-Format möglicherweise inkompatibel';
                    }

                    alert(`${errorMessage} (${data.details})${diagnosis}\n\nBitte versuchen Sie es erneut oder wechseln Sie den Sender.`);
                }
            });
            
            hlsPlayer.on(Hls.Events.FRAG_BUFFER_FAILED, (event, data) => {
                console.error('Fragment buffer failed:', data);
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.play().catch(e => console.log('Autoplay failed on native player:', e));
                restoreCaptionState();
            }, { once: true });
        } else {
            console.error('HLS is not supported by your browser.');
            alert('Ihr Browser unterstützt dieses Videoformat nicht.');
        }
    };
    
    // Seek-Funktion: negativ für zurück, positiv für vorwärts
    const seek = (seconds) => {
        const newTime = videoPlayer.currentTime + seconds;
        videoPlayer.currentTime = Math.max(0, Math.min(videoPlayer.duration || Infinity, newTime));
    };

    const toggleDataSaveMode = () => {
        const currentState = dataModeToggle.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;
        dataModeToggle.setAttribute('aria-pressed', newState);
        localStorage.setItem(DATA_SAVE_MODE_KEY, newState);
        updateQualityLevel();
    };

    const initializeEventListeners = () => {
        stationButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStationDisplay.textContent = button.dataset.name;
                setupHlsPlayer(button.dataset.url);
            });
        });
        
        dataModeToggle.addEventListener('click', toggleDataSaveMode);
        captionToggle.addEventListener('click', toggleCaptions);
        if (rewindButton) rewindButton.addEventListener('click', () => seek(-SEEK_TIME));
        if (forwardButton) forwardButton.addEventListener('click', () => seek(SEEK_TIME));
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                videoPlayer.play().catch(e => console.log('Attempt to resume playback failed:', e));
            }
        });
        
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
        });
    };

    const initializePlayer = () => {
        const isDataSaveModeEnabled = localStorage.getItem(DATA_SAVE_MODE_KEY) === 'true';
        dataModeToggle.setAttribute('aria-pressed', isDataSaveModeEnabled);
        
        initializeCaptions();
        
        const firstStationButton = stationButtons[0];
        if (firstStationButton) {
            currentStationDisplay.textContent = firstStationButton.dataset.name;
            setupHlsPlayer(firstStationButton.dataset.url);
        }
    };

    initializeEventListeners();
    initializePlayer();
});