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
        
        // Prüfen ob Hls.js verfügbar ist
        if (window.Hls && typeof Hls.isSupported === 'function') {
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
                console.error(`HLS.js error: ${data.details}`, data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Network error, trying to recover...');
                            hlsPlayer.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Media error, trying to recover...');
                            hlsPlayer.recoverMediaError();
                            break;
                        default:
                            alert(`Kritischer Fehler beim Laden des Streams (${data.details}). Bitte versuchen Sie es erneut oder wechseln Sie den Sender.`);
                            break;
                    }
                }
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => videoPlayer.play().catch(e => console.log('Autoplay failed on native player:', e)), { once: true });
        } else {
            console.error('HLS is not supported by your browser and Hls.js is not available.');
            alert('Ihr Browser unterstützt dieses Videoformat nicht und HLS.js ist nicht geladen.');
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

    const handleKeyDown = (event) => {
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

    const initializeEventListeners = () => {
        stationButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStationDisplay.textContent = button.dataset.name;
                setupHlsPlayer(button.dataset.url);
            });
        });
        
        dataModeToggle.addEventListener('click', toggleDataSaveMode);
        rewindButton?.addEventListener('click', rewind);
        forwardButton?.addEventListener('click', forward);
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                videoPlayer.play().catch(e => console.log('Attempt to resume playback failed:', e));
            }
        });
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Bereinigung beim Verlassen der Seite
        window.addEventListener('beforeunload', () => {
            hlsPlayer?.destroy();
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