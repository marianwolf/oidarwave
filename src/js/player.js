function initializePlayer() {
    // === KONSTANTEN ===
    const METADATA_REFRESH_INTERVAL = 3000;

    // === MEDIA SESSION API (Android/iOS Lock Screen & System Controls) ===
    const setupMediaSession = (title, artist, stationName) => {
        if ('mediaSession' in navigator) {
            console.log('MediaSession: Setting metadata', { title, artist, stationName });
            
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || stationName || 'Livestream',
                artist: artist || stationName || 'Oidarwave Radio',
                album: stationName || 'Oidarwave',
                artwork: [
                    { src: '/favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
                    { src: '/favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
                    { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
                ]
            });

            try {
                navigator.mediaSession.setActionHandler('play', () => {
                    console.log('MediaSession: Play action');
                    playMedia();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    console.log('MediaSession: Pause action');
                    currentPlayer.pause();
                });
                navigator.mediaSession.setActionHandler('stop', () => {
                    console.log('MediaSession: Stop action');
                    currentPlayer.pause();
                    clearMediaSession();
                });
            } catch (e) {
                console.warn('MediaSession action handlers error:', e);
            }
        } else {
            console.log('MediaSession not supported');
        }
    };

    const clearMediaSession = () => {
        if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
            console.log('MediaSession: Clearing metadata');
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
    let currentTrackTitle = '';
    let notificationDebounceTimer = null;

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');
    const notificationToggle = document.getElementById('notificationToggle');

    const notificationsSupported = 'Notification' in window;
    let notificationsEnabled = false;

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
            console.error('Media Error:', e);
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

    if (notificationToggle) {
        if (!notificationsSupported || !isAudioPlayer) {
            notificationToggle.style.display = 'none';
        } else {
            try {
                notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            } catch (e) {
                console.warn('localStorage notificationsEnabled read failed:', e);
            }
            updateNotificationToggleUI();
            
            notificationToggle.addEventListener('click', async () => {
                if (!notificationsSupported) return;
                
                if (!notificationsEnabled) {
                    const permission = Notification.permission;
                    if (permission === 'granted') {
                        notificationsEnabled = true;
                        saveNotificationPreference();
                        updateNotificationToggleUI();
                    } else if (permission === 'denied') {
                        alert('Benachrichtigungen sind in Ihrem Browser blockiert. Bitte erlauben Sie sie in den Browser-Einstellungen.');
                    } else {
                        const newPermission = await Notification.requestPermission();
                        if (newPermission === 'granted') {
                            notificationsEnabled = true;
                            saveNotificationPreference();
                            updateNotificationToggleUI();
                        }
                    }
                } else {
                    notificationsEnabled = false;
                    saveNotificationPreference();
                    updateNotificationToggleUI();
                }
            });
        }
    }

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
        currentPlayer.play().catch(e => console.error("Autoplay Error:", e));
    }

    function selectStation(button) {
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const { url, name, metadataUrl } = button.dataset;
        currentStationDisplay.textContent = name;
        try {
            localStorage.setItem(lastStationKey, url);
        } catch (e) {
            console.warn('localStorage speichern fehlgeschlagen:', e);
        }
        
        if (metadataInterval) {
            clearInterval(metadataInterval);
            metadataInterval = null;
        }
        
        // Clear Media Session on station change
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
                    currentSongTitleDisplay.innerText = (displayText && displayText.length > 0) 
                        ? displayText 
                        : "Keine Titelinformationen";
                }
                
                const stationName = currentStationDisplay ? currentStationDisplay.textContent : '';
                const notificationText = trackInfo.title && trackInfo.artist 
                    ? `${trackInfo.title} - ${trackInfo.artist}` 
                    : trackInfo.title || trackInfo.artist || '';
                handleTrackChange(notificationText, stationName);
                
                // Update Media Session with title and artist
                setupMediaSession(trackInfo.title, trackInfo.artist, stationName);
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Metadaten:', error);
                if (currentSongTitleDisplay) currentSongTitleDisplay.innerText = "Metadaten nicht verfügbar";
                clearMediaSession();
            });
    }

    function getMusicInfoWithArtist(data) {
        const title = data?.song_now_title || data?.playlistItem?.title || '';
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist || '';
        return { title, artist };
    }

    function getMusicInfo(data) {
        const title = data?.song_now_title || data?.playlistItem?.title;
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist;
        
        if (title && artist) return `${title} - ${artist}`;
        if (title) return title;
        if (artist) return artist;
        return null;
    }

    function saveNotificationPreference() {
        try {
            localStorage.setItem('notificationsEnabled', notificationsEnabled);
        } catch (e) {
            console.warn('localStorage notificationsEnabled save failed:', e);
        }
    }

    function updateNotificationToggleUI() {
        if (!notificationToggle) return;
        if (notificationsEnabled) {
            notificationToggle.classList.add('active');
            notificationToggle.title = 'Benachrichtigungen deaktivieren';
        } else {
            notificationToggle.classList.remove('active');
            notificationToggle.title = 'Benachrichtigungen bei Titeländerung';
        }
    }

    function sendNotification(title, stationName) {
        if (!notificationsSupported || !notificationsEnabled) return;
        if (Notification.permission !== 'granted') return;

        const notification = new Notification('Oidarwave - Neuer Titel', {
            body: `${title}\nSender: ${stationName}`,
            icon: '/favicon.svg',
            tag: 'oidarwave-notification',
            requireInteraction: false
        });

        notification.onclick = () => {
            window.focus();
            self.focus();
            notification.close();
        };

        setTimeout(() => notification.close(), 10000);
    }

    function handleTrackChange(newTitle, stationName) {
        if (!newTitle || newTitle === currentTrackTitle) return;
        if (newTitle === "Keine Titelinformationen" || newTitle === "Metadaten nicht verfügbar") return;

        if (notificationDebounceTimer) {
            clearTimeout(notificationDebounceTimer);
        }

        notificationDebounceTimer = setTimeout(() => {
            sendNotification(newTitle, stationName);
        }, 2000);

        currentTrackTitle = newTitle;
    }

    // Letzte Station wiederherstellen oder erste Station starten
    let lastStationUrl = null;
    try {
        lastStationUrl = localStorage.getItem(lastStationKey);
    } catch (e) {
        console.warn('localStorage Zugriff fehlgeschlagen:', e);
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