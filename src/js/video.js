document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle');
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const rewindButton = document.getElementById('rewindButton');
    const forwardButton = document.getElementById('forwardButton');
    const localStorageKey = 'dataSaveMode';
    let hlsPlayer = null;
    const seekTime = 10;

    videoPlayer.setAttribute('playsinline', '');
    videoPlayer.setAttribute('webkit-playsinline', '');

    const updateQualityLevel = () => {
        if (!hlsPlayer || hlsPlayer.levels.length === 0) {
            return;
        }
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        hlsPlayer.currentLevel = isDataSaveModeEnabled ? 0 : -1;
    };

    const setupHlsPlayer = (url) => {
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
        for (const track of videoPlayer.textTracks) {
            track.mode = 'hidden';
        }
        if (window.Hls && Hls.isSupported()) {
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);
            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play()
                    .catch(e => {
                        console.log('Autoplay failed, user interaction may be required:', e);
                    });
                updateQualityLevel();
            });
            hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
                console.error(`HLS.js fatal error: ${data.details}`, data);
                console.error('Diagnostic info:', {
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
                
                    // Prüfe auf Netzwerkprobleme
                    if (data.response) {
                        console.error('HTTP-Status:', data.response.code);
                        if (data.response.code === 403) {
                            console.error('DIAGNOSE: HTTP 403 - Zugriff verweigert (wahrscheinlich CORS oder Auth)');
                        } else if (data.response.code === 404) {
                            console.error('DIAGNOSE: HTTP 404 - Stream-URL nicht gefunden (URL geändert?)');
                        } else if (data.response.code === 0) {
                            console.error('DIAGNOSE: Netzwerkfehler oder CORS-Blockade');
                        }
                    }

                    if (data.fatal) {
                        alert(`Kritischer Fehler beim Laden des Streams (${data.details}).\n\nDiagnose:\n- CORS: Stream erlaubt keinen Zugriff\n- URL: Stream-URL ist möglicherweise veraltet\n\nBitte versuchen Sie es erneut oder wechseln Sie den Sender.`);
                    }
                });
                hlsPlayer.on(Hls.Events.FRAG_BUFFER_FAILED, (event, data) => {
                    console.error('Fragment buffer failed:', data);
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => videoPlayer.play().catch(e => console.log('Autoplay failed on native player:', e)), { once: true });
        } else {
            console.error('HLS is not supported by your browser.');
            alert('Ihr Browser unterstützt dieses Videoformat nicht.');
        }
    };
    
    const rewind = () => {
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - seekTime);
    };
    const forward = () => {
        videoPlayer.currentTime = Math.min(videoPlayer.duration || Infinity, videoPlayer.currentTime + seekTime);
    };

    const toggleDataSaveMode = () => {
        const currentState = dataModeToggle.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;
        dataModeToggle.setAttribute('aria-pressed', newState);
        localStorage.setItem(localStorageKey, newState);
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
        if (rewindButton) {
            rewindButton.addEventListener('click', rewind);
        }
        if (forwardButton) {
            forwardButton.addEventListener('click', forward);
        }
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                videoPlayer.play().catch(e => console.log('Attempt to resume playback failed:', e));
            }
        });
        document.addEventListener('keydown', (event) => {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
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
        });
    };

    const initializePlayer = () => {
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        dataModeToggle.setAttribute('aria-pressed', isDataSaveModeEnabled);
        
        const firstStationButton = stationButtons[0];
        if (firstStationButton) {
            currentStationDisplay.textContent = firstStationButton.dataset.name;
            setupHlsPlayer(firstStationButton.dataset.url);
        }
    };

    initializeEventListeners();
    initializePlayer();
});