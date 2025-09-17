document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle');
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const localStorageKey = 'dataSaveMode';

    let hls;

    const updateQualityLevel = () => {
        if (!hls || hls.levels.length === 0) return;
        hls.currentLevel = localStorage.getItem(localStorageKey) === 'true' ? 0 : -1;
    };

    const setupHlsPlayer = (url) => {
        if (hls) hls.destroy();

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play();
                updateQualityLevel();
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => videoPlayer.play(), { once: true });
        }
    };
    
    const isDataModeOn = localStorage.getItem(localStorageKey) === 'true';
    dataModeToggle.setAttribute('aria-pressed', isDataModeOn);
    
    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStationDisplay.textContent = button.dataset.name;
            setupHlsPlayer(button.dataset.url);
        });
    });

    dataModeToggle.addEventListener('click', () => {
        const newState = dataModeToggle.getAttribute('aria-pressed') !== 'true';
        dataModeToggle.setAttribute('aria-pressed', newState);
        localStorage.setItem(localStorageKey, newState);
        if (videoPlayer.src) updateQualityLevel();
    });
});