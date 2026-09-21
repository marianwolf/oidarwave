function initializePlayer() {
    // === KONSTANTEN ===
    const METADATA_REFRESH_INTERVAL = 3000;
    const VOLUME_STEP = 0.1;
    const VOLUME_PRECISION = 1;
    const AUDIO_STORAGE_KEY = 'lastStationAudioUrl';
    const MAX_RETRIES = 3;
    const RETRY_BASE_DELAY = 1000;

    const { setupMediaSession, clearMediaSession, readSetting, writeSetting } = window.PlayerCore;

    let hasError = false;
    let isStalled = false;
    let metadataInterval = null;
    let wasPlayingBeforeError = false;
    let isAutoRetry = false;
    let retryState = { count: 0, timerId: null };
    const currentPlayer = document.getElementById('audioPlayer');
    const stationButtons = document.querySelectorAll('.station-btn');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');

    if (!currentPlayer) {
        logError(ErrorCode.PLAYER_INIT_NO_ELEMENT, null, { selector: '#audioPlayer', page: location.pathname });
        return;
    }

    currentPlayer.volume = 1;

    // === MEDIA SESSION (dedupliziert, siehe player-core.js) ===
    const updateMediaSession = (title, artist) => {
        const stationName = currentStationDisplay ? currentStationDisplay.textContent : '';
        setupMediaSession({ title, artist, album: stationName || 'Oidarwave', media: currentPlayer, onStop: clearMediaSession });
    };

    // === EVENT LISTENER ===
    const mediaEvents = {
        loadstart: () => { isStalled = false; updateOverallStatus(); },
        canplay: () => {
            if (currentPlayer.paused) playMedia();
            isStalled = false;
            hasError = false;
            isAutoRetry = false;
            clearAudioRetry();
            updateOverallStatus();
        },
        playing: () => {
            isStalled = false;
            hasError = false;
            wasPlayingBeforeError = true;
            isAutoRetry = false;
            clearAudioRetry();
            updateOverallStatus();
            StationHistory.startStation(currentPlayer.src);
            updateMediaSession('', '');
        },
        pause: () => {
            // Nur User-Pause bricht Retry ab (kein Fehlerzustand).
            if (!hasError && !currentPlayer.error) {
                wasPlayingBeforeError = false;
                clearAudioRetry();
            }
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
            // Neuer User-Versuch (kein Auto-Retry) startet eine frische Sequenz.
            if (!isAutoRetry) clearAudioRetry();
            isAutoRetry = false;
            updateOverallStatus();
            StationHistory.stopStation(currentPlayer.src);
            scheduleAudioRetry();
        }
    };

    Object.entries(mediaEvents).forEach(([event, handler]) => {
        currentPlayer.addEventListener(event, handler);
    });

    stationButtons.forEach(button => {
        button.addEventListener('click', () => selectStation(button));
    });

    window.addEventListener('offline', () => {
        // Pending Retry pausieren, Count behalten für Resume bei 'online'.
        if (retryState.timerId) {
            clearTimeout(retryState.timerId);
            retryState.timerId = null;
        }
        updateOverallStatus();
        StationHistory.stopStation(currentPlayer.src);
    });

    window.addEventListener('online', () => {
        if (hasError && wasPlayingBeforeError && currentPlayer.src) {
            // Ein sofortiger Retry bei Netzrückkehr (zählt als ein Versuch).
            if (retryState.count >= MAX_RETRIES) retryState.count = MAX_RETRIES - 1;
            if (retryState.timerId) {
                clearTimeout(retryState.timerId);
                retryState.timerId = null;
            }
            retryAudio();
        } else {
            updateOverallStatus();
        }
    });

    document.addEventListener('keydown', handleKeyDown);

    function updateOverallStatus() {
        let status = 'online';
        if (!navigator.onLine || hasError) status = 'error';
        else if (currentPlayer.paused) status = 'paused';
        else if (isStalled) status = 'buffering';
        // Retry-Text nicht überschreiben, nur Klasse setzen.
        if (!retryState.timerId && statusIndicator && statusIndicator.classList.contains('text')) {
            statusIndicator.textContent = '';
        }
        PlayerCore.setStatusClass(statusIndicator, status);
    }

    function clearAudioRetry() {
        if (retryState.timerId) {
            clearTimeout(retryState.timerId);
            retryState.timerId = null;
        }
        retryState.count = 0;
        isAutoRetry = false;
        if (statusIndicator && statusIndicator.classList.contains('text')) {
            statusIndicator.textContent = '';
        }
    }

    function scheduleAudioRetry() {
        if (!wasPlayingBeforeError) return;
        if (!navigator.onLine) return;
        if (retryState.count >= MAX_RETRIES) {
            logError(ErrorCode.AUDIO_RECONNECT_FAILED, null, { retries: MAX_RETRIES, src: currentPlayer?.src });
            if (statusIndicator) {
                statusIndicator.textContent = 'Verbindung verloren – erneut versuchen';
                statusIndicator.classList.add('text', 'error');
            }
            return;
        }
        const delay = RETRY_BASE_DELAY * Math.pow(2, retryState.count);
        logWarn(ErrorCode.AUDIO_RECONNECT_RETRY, null, { attempt: retryState.count + 1, max: MAX_RETRIES, delayMs: delay, src: currentPlayer?.src });
        if (statusIndicator) {
            statusIndicator.textContent = `Versuch ${retryState.count + 1}/${MAX_RETRIES} in ${delay / 1000}s…`;
            PlayerCore.setStatusClass(statusIndicator, 'buffering');
            statusIndicator.classList.add('text');
        }
        retryState.timerId = setTimeout(() => {
            retryState.timerId = null;
            retryState.count++;
            retryAudio();
        }, delay);
    }

    function retryAudio() {
        if (!currentPlayer.src) return;
        hasError = false;
        isAutoRetry = true;
        updateOverallStatus();
        currentPlayer.load();
        playMedia();
    }

    function playMedia() {
        wasPlayingBeforeError = true;
        currentPlayer.play().catch(e => handlePlayError(e, 'audio-player'));
    }

    function selectStation(button) {
        if (!button) return;

        clearAudioRetry();
        wasPlayingBeforeError = true;

        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const { url, name, metadataUrl } = button.dataset;
        if (currentStationDisplay) currentStationDisplay.textContent = name;

        writeSetting(AUDIO_STORAGE_KEY, url);

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
            case 'ArrowDown':
                e.preventDefault();
                currentPlayer.volume = clampVolume(currentPlayer.volume + (e.code === 'ArrowUp' ? VOLUME_STEP : -VOLUME_STEP));
                break;
        }
    }

    function clampVolume(value) {
        return parseFloat(Math.max(0, Math.min(1, value)).toFixed(VOLUME_PRECISION));
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

                if (window.notificationManager) {
                    window.notificationManager.handleTrackChange(displayText, currentStationDisplay ? currentStationDisplay.textContent : '');
                }

                // Media Session mit Titel und Interpret aktualisieren
                updateMediaSession(trackInfo.title, trackInfo.artist);
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
    const lastStationUrl = readSetting(AUDIO_STORAGE_KEY);
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
