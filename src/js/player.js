function initializePlayer() {
    let hasError = false;
    let isStalled = false;
    let isAudioPlayer = false;
    let metadataInterval = null;

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

    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectStation(button);
            StationHistory.stopStation(currentPlayer.src);
            StationHistory.startStation(currentPlayer.src);
        });
    });

    currentPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('canplay', () => {
        if (isAudioPlayer && currentPlayer.paused) {
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
        StationHistory.startStation(currentPlayer.src);
    });

    currentPlayer.addEventListener('pause', () => {
        updateOverallStatus();
        StationHistory.stopStation(currentPlayer.src);
    });

    currentPlayer.addEventListener('waiting', () => {
        isStalled = true;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('error', (e) => {
        console.error('Media Error:', e);
        hasError = true;
        updateOverallStatus();
        StationHistory.stopStation(currentPlayer.src);
    });

    window.addEventListener('offline', () => {
        updateOverallStatus();
        StationHistory.stopStation(currentPlayer.src);
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

        if (typeof url && name) {
            StationHistory.startStation(url, name);
        }

        if (metadataInterval) {
            clearInterval(metadataInterval);
            metadataInterval = null;
        }

        if (metadataUrl) {
            fetchMetadata(metadataUrl);
            metadataInterval = setInterval(() => {
                fetchMetadata(metadataUrl);
            }, 1000);
        } else {
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

    function fetchMetadata(metadataUrl) {
        fetch(metadataUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Netzwerkfehler: ${response.status}`);
                }
                if (metadataUrl.endsWith('.txt')) {
                    return response.text().then(text => ({ type: 'text', data: text }));
                }
                return response.json().then(json => ({ type: 'json', data: json }));
            })
            .then(({ data, type }) => {
                let trackTitle;
                if (type === 'text' && typeof data === 'string') {
                    trackTitle = data.split('\n')[0].trim();
                } else if (type === 'json') {
                    trackTitle = getMusicInfo(data);
                }
                
                if (trackTitle && trackTitle.length > 0) {
                    currentSongTitleDisplay.innerText = trackTitle;
                } else {
                    currentSongTitleDisplay.innerText = "Keine Titelinformationen";
                }
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Metadaten:', error);
                currentSongTitleDisplay.innerText = "Metadaten nicht verfügbar";
            });
    }

    function getMusicInfo(data) {
        const title = data?.song_now_title || data?.playlistItem?.title;
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist;

        if (title && artist) {
            return `${title} - ${artist}`;
        } else if (title) {
            return title;
        } else if (artist) {
            return artist;
        }
        return null;
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