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

    const setupHlsPlayer = (url) => {
        if (hlsPlayer) {
            hlsPlayer.destroy();
        }

        if (Hls.isSupported()) {
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
                if (data.fatal) {
                    alert('There was a critical error loading the video stream. Please try again or switch to a different station.');
                }
            });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                    videoPlayer.play().catch(e => console.log('Attempt to resume playback failed:', e));
                }
            });

        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => videoPlayer.play(), { once: true });
        } else {
            console.error('HLS is not supported by your browser.');
            alert('Your browser does not support this video format.');
        }

        for (const track of videoPlayer.textTracks) {
            track.mode = 'hidden';
        }
    };

    const updateQualityLevel = () => {
        if (!hlsPlayer || hlsPlayer.levels.length === 0) {
            return;
        }
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        hlsPlayer.currentLevel = isDataSaveModeEnabled ? 0 : -1;
    };

    const toggleDataSaveMode = () => {
        const currentState = dataModeToggle.getAttribute('aria-pressed') === 'true';
        const newState = !currentState;
        dataModeToggle.setAttribute('aria-pressed', newState);
        localStorage.setItem(localStorageKey, newState);
        updateQualityLevel();
    };

    const rewind = () => videoPlayer.currentTime - seekTime;
    const forward = () => videoPlayer.currentTime + seekTime;

    const initializeEventListeners = () => {
        stationButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStationDisplay.textContent = button.dataset.name;
                setupHlsPlayer(button.dataset.url);
                videoPlayer.play().catch(e => console.log('Playback attempt after station change failed:', e));
            });
        });
        dataModeToggle.addEventListener('click', toggleDataSaveMode);

        if (rewindButton) {
            rewindButton.addEventListener('click', rewind);
        }
        if (forwardButton) {
            forwardButton.addEventListener('click', forward);
        }
        
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