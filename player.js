function initializePlayer() {
    let hasError = false;
    let isStalled = false;
    let hls = null;
    let isAudioPlayer = false;

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');

    let currentPlayer = null;
    if (audioPlayer) {
        currentPlayer = audioPlayer;
        isAudioPlayer = true;
        currentPlayer.volume = 1;
    } else if (videoPlayer) {
        currentPlayer = videoPlayer;
        isAudioPlayer = false;
    } else {
        console.error("No player element found with id 'audioPlayer' or 'videoPlayer'.");
        return;
    }

    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectStation(button);
            localStorage.setItem('lastStationUrl', button.dataset.url);
        });
    });

    currentPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('canplay', () => {
        if (isAudioPlayer) {
            playMedia();
        }
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('playing', () => {
        hasError = false;
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('pause', () => {
        updateOverallStatus();
    });

    currentPlayer.addEventListener('error', (e) => {
        console.error('Media Error:', e);
        hasError = true;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('stalled', () => {
        isStalled = true;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('waiting', () => {
        isStalled = true;
        updateOverallStatus();
    });

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    document.addEventListener('keydown', handleKeyDown);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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

    function playMedia() {
        currentPlayer.play().catch(e => {
            console.error("Autoplay Error:", e);
            hasError = true;
            updateOverallStatus();
        });
    }

    function selectStation(button) {
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const { url, name } = button.dataset;
        currentStationDisplay.textContent = name;

        hasError = false;
        isStalled = false;

        if (isAudioPlayer) {
            handleAudioPlayback(url);
        } else {
            handleVideoPlayback(url);
        }
        updateOverallStatus();
    }

    function handleAudioPlayback(url) {
        currentPlayer.src = url;
        currentPlayer.load();
    }

    function handleVideoPlayback(url) {
        if (hls) {
            hls.destroy();
            hls = null;
        }

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(currentPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (hls.subtitleTracks.length > 0) {
                    hls.subtitleTrack = 0;
                }
                playMedia();
            });
        } else if (currentPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            currentPlayer.src = url;
            currentPlayer.addEventListener('loadedmetadata', () => {
                playMedia();
            }, { once: true });
        } else {
            alert('Ihr Browser unterstützt die Wiedergabe von HLS-Streams nicht.');
            hasError = true;
            updateOverallStatus();
        }
    }

    function updateOverallStatus() {
        if (!statusIndicator) return;
        const indicator = statusIndicator;
        indicator.className = '';
        indicator.style.animation = 'none';
        indicator.style.boxShadow = 'none';
        indicator.style.background = 'gray';

        if (hasError) {
            indicator.classList.add('error');
            indicator.style.background = 'red';
        } else if (!navigator.onLine) {
            indicator.classList.add('offline');
            indicator.style.background = 'darkgray';
        } else if (isStalled || currentPlayer.readyState < 3) {
            indicator.classList.add('buffering');
            indicator.style.animation = 'pulse-status 1s infinite';
            indicator.style.background = 'yellow';
        } else if (currentPlayer.paused) {
            indicator.classList.add('paused');
            indicator.style.background = 'blue';
        } else {
            indicator.classList.add('online');
            indicator.style.animation = 'pulse-status 2s infinite';
            indicator.style.background = 'green';
        }
    }

    function checkOnlineStatus() {
        updateOverallStatus();
    }

    function handleKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
            return;
        }
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (currentPlayer.paused) {
                    playMedia();
                } else {
                    currentPlayer.pause();
                }
                break;
            case 'ArrowUp':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = Math.min(1, currentPlayer.volume + 0.1);
                }
                break;
            case 'ArrowDown':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = Math.max(0, currentPlayer.volume - 0.1);
                }
                break;
        }
    }

    const lastStationUrl = localStorage.getItem('lastStationUrl');
    const lastStationButton = lastStationUrl ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) : null;

    if (lastStationButton) {
        selectStation(lastStationButton);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }
    
    checkOnlineStatus();
}

document.addEventListener('DOMContentLoaded', initializePlayer);