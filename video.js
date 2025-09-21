document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle');
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const localStorageKey = 'dataSaveMode';
    let hlsPlayer = null;

    const setupHlsPlayer = (url) => {
        if (hlsPlayer) {
            hlsPlayer.destroy();
        }

        if (Hls.isSupported()) {
            hlsPlayer = new Hls();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(videoPlayer);

            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play();
                updateQualityLevel();
            });

            hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
                console.error(`HLS.js Fehler: ${data.details}`, data);
                if (data.fatal) {
                    alert('Es gab einen Fehler beim Laden des Videos. Bitte versuchen Sie es erneut.');
                }
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => videoPlayer.play(), { once: true });
        } else {
            console.error('HLS wird von Ihrem Browser nicht unterstützt.');
            alert('Ihr Browser unterstützt dieses Videoformat nicht.');
        }

        for (const track of videoPlayer.textTracks) {
            track.mode = 'disabled';
        }
    };

    const updateQualityLevel = () => {
        if (!hlsPlayer || hlsPlayer.levels.length === 0) return;
        const isDataSaveModeEnabled = localStorage.getItem(localStorageKey) === 'true';
        hlsPlayer.currentLevel = isDataSaveModeEnabled ? 0 : -1;
    };

    const initializeEventListeners = () => {
        stationButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentStationDisplay.textContent = button.dataset.name;
                setupHlsPlayer(button.dataset.url);
            });
        });

        dataModeToggle.addEventListener('click', () => {
            const currentState = dataModeToggle.getAttribute('aria-pressed') === 'true';
            const newState = !currentState;
            dataModeToggle.setAttribute('aria-pressed', newState);
            localStorage.setItem(localStorageKey, newState);
            if (videoPlayer.src) {
                updateQualityLevel();
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