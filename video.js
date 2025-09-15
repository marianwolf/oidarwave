document.addEventListener('DOMContentLoaded', () => {
    const dataModeToggle = document.getElementById('dataModeToggle');
    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const localStorageKey = 'dataSaveMode';
    
    let hls;

    const setupHlsPlayer = (url) => {
        if (hls) {
            hls.destroy();
        }

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
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.play();
            });
        }
    };
    
    const updateQualityLevel = () => {
        if (!hls) return;
        
        const isDataModeOn = localStorage.getItem(localStorageKey) === 'true';
        
        if (isDataModeOn) {
            let lowestLevelIndex = hls.levels.length - 1;
            for (let i = hls.levels.length - 1; i >= 0; i--) {
                if (hls.levels[i].height <= 360) {
                    lowestLevelIndex = i;
                    break;
                }
            }
            hls.currentLevel = lowestLevelIndex;
        } else {
            hls.currentLevel = -1;
        }
    };

    const savedState = localStorage.getItem(localStorageKey);
    const isDataModeOn = savedState === 'true'; 
    dataModeToggle.setAttribute('aria-pressed', isDataModeOn);
    
    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const url = button.dataset.url;
            const name = button.dataset.name;
            currentStationDisplay.textContent = name;
            setupHlsPlayer(url);
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
});