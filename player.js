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
        });
    });

    function selectStation(button) {
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const url = button.dataset.url;
        const name = button.dataset.name;
        currentStationDisplay.textContent = name;

        if (isAudioPlayer) {
            currentPlayer.src = url;
            currentPlayer.load();
        } else {
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
                    currentPlayer.play().catch(e => {
                        console.error("Autoplay-Fehler:", e);
                        hasError = true;
                        updateOverallStatus();
                    });
                });
            } else if (currentPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                currentPlayer.src = url;
                currentPlayer.addEventListener('loadedmetadata', () => {
                    currentPlayer.play().catch(e => {
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
        }
        hasError = false;
        isStalled = false;
        updateOverallStatus();
    }

    currentPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('canplay', () => {
        if (isAudioPlayer) {
            currentPlayer.play().catch(e => {
                console.error("Autoplay-Fehler:", e);
                hasError = true;
                updateOverallStatus();
            });
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
        console.error('Medien-Fehler:', e);
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

    function updateOverallStatus() {
        const indicator = statusIndicator;
        if (!indicator) return;
        indicator.classList.remove('offline', 'online', 'buffering', 'paused', 'error');
        indicator.style.animation = 'none';
        indicator.style.boxShadow = 'none';

        if (hasError) {
            indicator.style.background = '#F44336';
            indicator.classList.add('error');
        } else if (!navigator.onLine || isStalled || currentPlayer.readyState < 3) {
            indicator.style.background = '#FFEB3B';
            indicator.classList.add('buffering');
            indicator.style.animation = 'pulse-status 1s infinite';
        } else if (currentPlayer.paused) {
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
                    if (currentPlayer.paused) {
                        currentPlayer.play().catch(console.error);
                    } else {
                        currentPlayer.pause();
                    }
                    break;
                case 'ArrowUp':
                    if (isAudioPlayer) {
                        e.preventDefault();
                        const volumeSlider = document.getElementById('volumeSlider');
                        if (volumeSlider) {
                            volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
                            currentPlayer.volume = volumeSlider.value / 100;
                        } else {
                            currentPlayer.volume = Math.min(1, currentPlayer.volume + 0.1);
                        }
                    }
                    break;
                case 'ArrowDown':
                    if (isAudioPlayer) {
                        e.preventDefault();
                        const volumeSlider = document.getElementById('volumeSlider');
                        if (volumeSlider) {
                            volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
                            currentPlayer.volume = volumeSlider.value / 100;
                        } else {
                            currentPlayer.volume = Math.max(0, currentPlayer.volume - 0.1);
                        }
                    }
                    break;
            }
        }
    });

    if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }

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
}
document.addEventListener('DOMContentLoaded', initializePlayer);