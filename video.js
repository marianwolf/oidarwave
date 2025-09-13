function initializePlayer() {
    let currentVideo = null;
    let currentStation = null;
    let hasError = false;
    let isStalled = false;
    let hls = null;

    const stationButtons = document.querySelectorAll('.station-btn');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');

    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectStation(button);
        });
    });

    function selectStation(button) {
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const url = button.dataset.url;
        const name = button.dataset.name;

        currentStationDisplay.textContent = name;
        currentStation = name;

        if (hls) {
            hls.destroy();
            hls = null;
        }

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (hls.subtitleTracks.length > 0) {
                    hls.subtitleTrack = -1;
                }
                videoPlayer.play().catch(e => {
                    console.error("Autoplay-Fehler:", e);
                    hasError = true;
                    updateOverallStatus();
                });
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoPlayer.play().catch(e => {
                    console.error("Autoplay-Fehler:", e);
                    hasError = true;
                    updateOverallStatus();
                });
            });
        } else {
            alert('Ihr Browser unterstützt die Wiedergabe von HLS-Streams nicht.');
            hasError = true;
            updateOverallStatus();
            return;
        }

        hasError = false;
        isStalled = false;
        updateOverallStatus();
    }

    videoPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });

    videoPlayer.addEventListener('canplay', () => {
        isStalled = false;
        updateOverallStatus();
    });

    videoPlayer.addEventListener('playing', () => {
        hasError = false;
        isStalled = false;
        updateOverallStatus();
    });

    videoPlayer.addEventListener('pause', () => {
        updateOverallStatus();
    });

    videoPlayer.addEventListener('error', (e) => {
        console.error('Video-Fehler:', e);
        hasError = true;
        updateOverallStatus();
    });

    videoPlayer.addEventListener('stalled', () => {
        isStalled = true;
        updateOverallStatus();
    });

    videoPlayer.addEventListener('waiting', () => {
        isStalled = true;
        updateOverallStatus();
    });
    
    function updateOverallStatus() {
        const indicator = statusIndicator;
        indicator.classList.remove('offline', 'online', 'buffering', 'paused', 'error');
        indicator.style.animation = 'none';
        indicator.style.boxShadow = 'none';

        if (hasError) {
            indicator.style.background = '#F44336';
            indicator.classList.add('error');
        } else if (!navigator.onLine || isStalled || videoPlayer.readyState < 3) {
            indicator.style.background = '#FFEB3B';
            indicator.classList.add('buffering');
            indicator.style.animation = 'pulse-status 1s infinite';
        } else if (videoPlayer.paused) {
            indicator.style.background = '#2196F3';
            indicator.classList.add('paused');
        } else {
            indicator.style.background = '#4CAF50';
            indicator.classList.add('online');
            indicator.style.animation = 'pulse-status 2s infinite';
        }
    }

    function checkOnlineStatus() {
        if (!navigator.onLine) {
            if (!hasError) {
                updateOverallStatus();
            }
        } else {
            updateOverallStatus();
        }
    }

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    checkOnlineStatus();
    updateOverallStatus();
    
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (videoPlayer.paused) {
                        videoPlayer.play().catch(console.error);
                    } else {
                        videoPlayer.pause();
                    }
                    break;
            }
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }
}

document.addEventListener('DOMContentLoaded', initializePlayer);