document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const $q = selector => document.querySelectorAll(selector);

    const dataModeToggle = $('dataModeToggle');
    const stationButtons = $q('.station-btn');
    const videoPlayer = $('videoPlayer');
    const currentStationDisplay = $('currentStation');
    const rewindButton = $('rewindButton');
    const forwardButton = $('forwardButton');
    const localStorageKey = 'dataSaveMode';
    const seekTime = 10;
    let hlsPlayer = null;

    videoPlayer.setAttribute('playsinline', '');
    videoPlayer.setAttribute('webkit-playsinline', '');

    const updateQualityLevel = () => {
        if (!hlsPlayer || !hlsPlayer.levels || hlsPlayer.levels.length === 0) return;
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        hlsPlayer.currentLevel = isDataSaveModeEnabled ? 0 : -1;
    };

    const setupHlsPlayer = (url) => {
        if (hlsPlayer) hlsPlayer.destroy();

        if (Hls.isSupported()) {
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);

            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play().catch(e => console.log('Autoplay failed:', e));
                updateQualityLevel();
            });

            hlsPlayer.on(Hls.Events.ERROR, (e, data) => {
                console.error(`HLS.js fatal error: ${data.details}`, data);
                if (data.fatal) alert('Critical error loading stream. Try again or switch station.');
            });

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && videoPlayer.paused) {
                    videoPlayer.play().catch(e => console.log('Attempt to resume playback failed:', e));
                }
            });

        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => videoPlayer.play(), { once: true });
        } else {
            console.error('HLS is not supported.');
            alert('Your browser does not support this video format.');
        }

        for (const track of videoPlayer.textTracks) track.mode = 'hidden';
    };

    const toggleDataSaveMode = () => {
        const newState = dataModeToggle.getAttribute('aria-pressed') !== 'true';
        dataModeToggle.setAttribute('aria-pressed', newState);
        localStorage.setItem(localStorageKey, newState);
        updateQualityLevel();
    };

    const seek = delta => () => { videoPlayer.currentTime += delta; };
    const rewind = seek(-seekTime);
    const forward = seek(seekTime);

    const initializeEventListeners = () => {
        stationButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStationDisplay.textContent = button.dataset.name;
                setupHlsPlayer(button.dataset.url);
                videoPlayer.play().catch(e => console.log('Playback attempt failed:', e));
            });
        });

        dataModeToggle.addEventListener('click', toggleDataSaveMode);

        if (rewindButton) rewindButton.addEventListener('click', rewind);
        if (forwardButton) forwardButton.addEventListener('click', forward);

        document.addEventListener('keydown', (event) => {
            const isInputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
            if (isInputFocused) return;

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

        const firstStation = stationButtons[0];
        if (firstStation) {
            currentStationDisplay.textContent = firstStation.dataset.name;
            setupHlsPlayer(firstStation.dataset.url);
        }
    };

    initializeEventListeners();
    initializePlayer();
});