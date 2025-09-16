function initializePlayer() {
    let hasError = false;
    let isStalled = false;
    let hls = null;
    let isAudioPlayer = false;
    let metadataInterval = null;

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');

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
            if (isAudioPlayer) {
                localStorage.setItem('lastStationAudioUrl', button.dataset.url);
            } else {
                localStorage.setItem('lastStationVideoUrl', button.dataset.url);
            }
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
        currentPlayer.paused;
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

        if (metadataInterval) {
            clearInterval(metadataInterval);
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
            localStorage.setItem('lastStationAudioUrl', url);
            handleAudioPlayback(url);
        } else {
            localStorage.setItem('lastStationVideoUrl', url);
            handleVideoPlayback(url);
        }
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
        }
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

    function fetchMetadata(metadataUrl) {
    fetch(metadataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netzwerkfehler');
            }
            if (metadataUrl.endsWith('.txt')) {
                return response.text();
            }
            return response.json();
        })
        .then(data => {
            let trackTitle;
            if (typeof data === 'string') {
                trackTitle = data.split('\n')[0];
            } else {
                trackTitle = data.title;
            }
            if (trackTitle) {
                document.getElementById('currentSongTitle').innerText = trackTitle;
            } else {
                document.getElementById('currentSongTitle').innerText = "Keine Titelinformationen";
            }
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Metadaten:', error);
            document.getElementById('currentSongTitle').innerText = "Metadaten nicht verfügbar";
        });
    }

    const lastStationUrl = isAudioPlayer ? localStorage.getItem('lastStationAudioUrl') : localStorage.getItem('lastStationVideoUrl');
    const lastStationButton = lastStationUrl ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) : null;

    if (lastStationButton) {
        selectStation(lastStationButton);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }
    updateOverallStatus();
}

document.addEventListener('DOMContentLoaded', initializePlayer);