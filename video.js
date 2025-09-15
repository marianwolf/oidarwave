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
        if (!hls || hls.levels.length === 0) return;
        
        const isDataModeOn = localStorage.getItem(localStorageKey) === 'true';
        
        if (isDataModeOn) {
            let lowestBitrate = Infinity;
            let lowestBitrateIndex = -1;
            
            for (let i = 0; i < hls.levels.length; i++) {
                if (hls.levels[i].bitrate < lowestBitrate) {
                    lowestBitrate = hls.levels[i].bitrate;
                    lowestBitrateIndex = i;
                }
            }
            
            if (lowestBitrateIndex !== -1) {
                hls.currentLevel = lowestBitrateIndex;
            }
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