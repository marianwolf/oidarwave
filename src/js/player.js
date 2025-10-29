function initializePlayer() {
    let hasError = false;
    let isStalled = false;
    let isAudioPlayer = false;
    let socket = null; 

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');

    let currentPlayer = null;
    let lastStationKey = '';

    if (audioPlayer) {
        currentPlayer = audioPlayer;
        isAudioPlayer = true;
        currentPlayer.volume = 1;
        lastStationKey = 'lastStationAudioUrl';
    } else if (videoPlayer) {
        currentPlayer = videoPlayer;
        isAudioPlayer = false;
        lastStationKey = 'lastStationVideoUrl';
    } else {
        console.error("No player element found with id 'audioPlayer' or 'videoPlayer'.");
        return;
    }
    
    try {
        socket = io(); 
        
        socket.on('song-update', (data) => {
            if (currentSongTitleDisplay && data.title) {
                currentSongTitleDisplay.innerText = data.title;
            } else if (currentSongTitleDisplay) {
                currentSongTitleDisplay.innerText = "Keine Titelinformationen";
            }
        });
        
        socket.on('disconnect', () => {
            console.warn("Socket.IO disconnected. Real-time updates paused.");
        });
        
    } catch (e) {
        console.error("Failed to connect Socket.IO:", e);
    }
    
    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectStation(button);
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
        hasError = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('playing', () => {
        isStalled = false;
        hasError = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('pause', () => {
        updateOverallStatus();
    });

    currentPlayer.addEventListener('waiting', () => {
        isStalled = true;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('error', (e) => {
        console.error('Media Error:', e);
        hasError = true;
        updateOverallStatus();
    });

    window.addEventListener('offline', () => {
        updateOverallStatus();
    });

    document.addEventListener('keydown', handleKeyDown);

    function updateOverallStatus() {
        if (!statusIndicator) return;

        statusIndicator.classList.remove('online', 'error', 'buffering', 'paused');

        if (!navigator.onLine) {
            statusIndicator.classList.add('error');
            return;
        }

        if (hasError) {
            statusIndicator.classList.add('error');
        } else if (currentPlayer.paused) {
            statusIndicator.classList.add('paused');
        } else if (isStalled) {
            statusIndicator.classList.add('buffering');
        } else {
            statusIndicator.classList.add('online');
        }
    }

    function playMedia() {
        currentPlayer.play().catch(e => {
            console.error("Autoplay Error:", e);
        });
    }

    function selectStation(button) {
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const { url, name, metadataUrl } = button.dataset;
        currentStationDisplay.textContent = name;

        localStorage.setItem(lastStationKey, url);

        if (metadataUrl && socket) {
            socket.emit('subscribe-metadata', { metadataUrl: metadataUrl });
        } else {
            if (socket) {
                 socket.emit('unsubscribe-metadata');
            }
            currentSongTitleDisplay.textContent = "Metadaten nicht verfügbar";
        }

        if (isAudioPlayer) {
            handleAudioPlayback(url);
        } else {
            handleVideoPlayback(url);
        }
    }

    function handleAudioPlayback(url) {
        currentPlayer.src = url;
        currentPlayer.load();
    }
    
    function handleVideoPlayback(url) {
        currentPlayer.src = url;
        currentPlayer.load();
    }

    function handleKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') {
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
                    currentPlayer.volume = parseFloat(Math.min(1, currentPlayer.volume + 0.1).toFixed(1));
                }
                break;
            case 'ArrowDown':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = parseFloat(Math.max(0, currentPlayer.volume - 0.1).toFixed(1));
                }
                break;
        }
    }

    const lastStationUrl = localStorage.getItem(lastStationKey);
    const lastStationButton = lastStationUrl ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) : null;

    if (lastStationButton) {
        selectStation(lastStationButton);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }
    updateOverallStatus();
}

document.addEventListener('DOMContentLoaded', initializePlayer);