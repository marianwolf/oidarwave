function initializePlayer() {
    let currentAudio = null;
    let currentStation = null;
    let hasError = false;
    let isStalled = false;
    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    audioPlayer.volume = 1;
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
        audioPlayer.src = url;
        audioPlayer.load();
        hasError = false;
        isStalled = false;
        updateOverallStatus();
    }
    audioPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });
    audioPlayer.addEventListener('canplay', () => {
        if (currentStation) {
            audioPlayer.play().catch(e => {
                console.error("Autoplay-Fehler:", e);
                hasError = true;
                updateOverallStatus();
            });
        }
        isStalled = false;
        updateOverallStatus();
    });
    audioPlayer.addEventListener('playing', () => {
        hasError = false;
        isStalled = false;
        updateOverallStatus();
    });
    audioPlayer.addEventListener('pause', () => {
        updateOverallStatus();
    });
    audioPlayer.addEventListener('error', (e) => {
        console.error('Audiofehler:', e);
        hasError = true;
        updateOverallStatus();
    });
    audioPlayer.addEventListener('stalled', () => {
        isStalled = true;
        updateOverallStatus();
    });
    audioPlayer.addEventListener('waiting', () => {
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
        } else if (!navigator.onLine || isStalled || audioPlayer.readyState < 3) {
            indicator.style.background = '#FFEB3B';
            indicator.classList.add('buffering');
            indicator.style.animation = 'pulse-status 1s infinite';
        } else if (audioPlayer.paused) {
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
                    if (audioPlayer.paused) {
                        audioPlayer.play().catch(console.error);
                    } else {
                        audioPlayer.pause();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 10);
                    audioPlayer.volume = volumeSlider.value / 100;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 10);
                    audioPlayer.volume = volumeSlider.value / 100;
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