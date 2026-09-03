function initializePlayer() {
    // === KONSTANTEN ===
    const METADATA_REFRESH_INTERVAL = 3000;

    // === MEDIA SESSION API (Android/iOS Lock Screen & System Controls) ===
    const setupMediaSession = (title, artist, stationName) => {
        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: title || stationName || 'Livestream',
                    artist: artist || stationName || 'Oidarwave Radio',
                    album: stationName || 'Oidarwave',
                    artwork: [
                        { src: '/favicon/favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
                        { src: '/favicon/favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
                        { src: '/favicon/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
                    ]
                });

                navigator.mediaSession.setActionHandler('play', () => {
                    playMedia();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    currentPlayer?.pause();
                });
                navigator.mediaSession.setActionHandler('stop', () => {
                    currentPlayer?.pause();
                    clearMediaSession();
                });
            } catch (e) {
                console.warn('MediaSession Einrichtung fehlgeschlagen:', e);
            }
        }
    };

    const clearMediaSession = () => {
        if ('mediaSession' in navigator && navigator.mediaSession?.metadata) {
            navigator.mediaSession.metadata = null;
        }
    };
    const VOLUME_STEP = 0.1;
    const VOLUME_PRECISION = 1;

    let hasError = false;
    let isStalled = false;
    let isAudioPlayer = false;
    let metadataInterval = null;
    let currentPlayer = null;
    let lastStationKey = '';

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');

    if (!audioPlayer && !videoPlayer) {
        logError(ErrorCode.PLAYER_INIT_NO_ELEMENT, null, { selectors: ['#audioPlayer', '#videoPlayer'], page: location.pathname });
        return;
    }

    if (audioPlayer) {
        currentPlayer = audioPlayer;
        isAudioPlayer = true;
        currentPlayer.volume = 1;
        lastStationKey = 'lastStationAudioUrl';
    } else if (videoPlayer) {
        currentPlayer = videoPlayer;
        isAudioPlayer = false;
        lastStationKey = 'lastStationVideoUrl';
    }

    // === EVENT LISTENER ===
    const mediaEvents = {
        loadstart: () => { isStalled = false; updateOverallStatus(); },
        canplay: () => {
            if (isAudioPlayer && currentPlayer.paused) playMedia();
            isStalled = false;
            hasError = false;
            updateOverallStatus();
        },
        playing: () => {
            isStalled = false;
            hasError = false;
            updateOverallStatus();
            StationHistory.startStation(currentPlayer.src);
            const stationName = currentStationDisplay ? currentStationDisplay.textContent : '';
            setupMediaSession('', '', stationName);
        },
        pause: () => {
            updateOverallStatus();
            StationHistory.stopStation(currentPlayer.src);
        },
        waiting: () => { isStalled = true; updateOverallStatus(); },
        error: (e) => {
            const mediaError = currentPlayer?.error;
            logError(ErrorCode.PLAYER_MEDIA_ERROR, e, {
              code: mediaError?.code,
              message: mediaError?.message,
              src: currentPlayer?.src,
              page: location.pathname
            });
            hasError = true;
            updateOverallStatus();
            StationHistory.stopStation(currentPlayer.src);
        }
    };

    Object.entries(mediaEvents).forEach(([event, handler]) => {
        currentPlayer.addEventListener(event, handler);
    });

    stationButtons.forEach(button => {
        button.addEventListener('click', () => selectStation(button));
    });

    window.addEventListener('offline', () => {
        updateOverallStatus();
        StationHistory.stopStation(currentPlayer.src);
    });

    document.addEventListener('keydown', handleKeyDown);

    function updateOverallStatus() {
        if (!statusIndicator) return;
        statusIndicator.classList.remove('online', 'error', 'buffering', 'paused');
        
        if (!navigator.onLine || hasError) {
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
        currentPlayer.play().catch(e => handlePlayError(e, 'audio-player'));
    }

    function selectStation(button) {
        if (!button || !currentPlayer) return;
        
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const { url, name, metadataUrl } = button.dataset;
        if (currentStationDisplay) currentStationDisplay.textContent = name;
        
        try {
            localStorage.setItem(lastStationKey, url);
        } catch (e) {
            logStorageError(ErrorCode.STORAGE_WRITE, e, lastStationKey);
        }
        
        if (metadataInterval) {
            clearInterval(metadataInterval);
            metadataInterval = null;
        }
        
        clearMediaSession();
        
        if (metadataUrl) {
            fetchMetadata(metadataUrl);
            metadataInterval = setInterval(() => fetchMetadata(metadataUrl), METADATA_REFRESH_INTERVAL);
        } else if (currentSongTitleDisplay) {
            currentSongTitleDisplay.textContent = "Metadaten nicht verfügbar";
        }
        
        currentPlayer.src = url;
        currentPlayer.load();
    }

    function handleKeyDown(e) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                currentPlayer.paused ? playMedia() : currentPlayer.pause();
                break;
            case 'ArrowUp':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = parseFloat(Math.min(1, currentPlayer.volume + VOLUME_STEP).toFixed(VOLUME_PRECISION));
                }
                break;
            case 'ArrowDown':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = parseFloat(Math.max(0, currentPlayer.volume - VOLUME_STEP).toFixed(VOLUME_PRECISION));
                }
                break;
        }
    }

    function fetchMetadata(metadataUrl) {
        fetch(metadataUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Netzwerkfehler: ${response.status}`);
                return metadataUrl.endsWith('.txt') 
                    ? response.text().then(text => ({ type: 'text', data: text }))
                    : response.json().then(json => ({ type: 'json', data: json }));
            })
            .then(({ data, type }) => {
                const trackInfo = type === 'text' 
                    ? { title: data.split('\n')[0].trim(), artist: '' }
                    : getMusicInfoWithArtist(data);
                
                const displayText = trackInfo.title && trackInfo.artist 
                    ? `${trackInfo.title} - ${trackInfo.artist}` 
                    : trackInfo.title || trackInfo.artist || '';
                
                if (currentSongTitleDisplay) {
                    currentSongTitleDisplay.innerText = displayText || "Keine Titelinformationen";
                }
                
                const stationName = currentStationDisplay ? currentStationDisplay.textContent : '';
                if (window.notificationManager) {
                    window.notificationManager.handleTrackChange(displayText, stationName);
                }
                
                // Update Media Session with title and artist
                setupMediaSession(trackInfo.title, trackInfo.artist, stationName);
            })
            .catch(error => {
                const errType = error?.name || 'UnknownError';
                const errCtx = {
                  metadataUrl,
                  station: currentStationDisplay ? currentStationDisplay.textContent : '',
                  type: errType
                };
                if (error?.message?.includes('JSON')) {
                  errCtx.reason = 'invalid-json';
                } else if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
                  errCtx.reason = 'network-error';
                }
                logError(ErrorCode.METADATA_FETCH, error, errCtx);
                if (currentSongTitleDisplay) currentSongTitleDisplay.innerText = "Metadaten nicht verfügbar";
                clearMediaSession();
            });
    }

    function getMusicInfoWithArtist(data) {
        const title = data?.song_now_title || data?.playlistItem?.title || '';
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist || '';
        return { title, artist };
    }



    // Letzte Station wiederherstellen oder erste Station starten
    let lastStationUrl = null;
    try {
        lastStationUrl = localStorage.getItem(lastStationKey);
    } catch (e) {
        logStorageError(ErrorCode.STORAGE_READ, e, lastStationKey);
    }
    const lastStationButton = lastStationUrl 
        ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) 
        : null;
    
    if (lastStationButton) {
        selectStation(lastStationButton);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }
    
    updateOverallStatus();
}

document.addEventListener('DOMContentLoaded', initializePlayer);