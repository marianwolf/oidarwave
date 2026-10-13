function initializePlayer() {
    'use strict'

    // === KONSTANTEN ===
    const METADATA_REFRESH_INTERVAL = 3000
    const VOLUME_STEP = 0.1
    const VOLUME_PRECISION = 1
    const AUDIO_STORAGE_KEY = 'lastStationAudioUrl'
    const MAX_RETRIES = 3
    const RETRY_BASE_DELAY = 1000

    const {
        setupMediaSession,
        clearMediaSession,
        setStatusClass,
        readSetting,
        writeSetting,
        createRetryState,
        getRetryDelay,
        scheduleRetry,
        resetRetry,
        setActiveStation,
        isEditableTarget,
        clamp,
        getMusicInfo,
        formatTrackDisplay,
    } = window.PlayerCore

    // === DOM & STATE ===
    const currentPlayer = document.getElementById('audioPlayer')
    const stationButtons = document.querySelectorAll('.station-btn')
    const currentStationDisplay = document.getElementById('currentStation')
    const statusIndicator = document.getElementById('statusIndicator')
    const currentSongTitleDisplay = document.getElementById('currentSongTitle')

    if (!currentPlayer) {
        logError(ErrorCode.PLAYER_INIT_NO_ELEMENT, null, { selector: '#audioPlayer', page: location.pathname })
        return
    }
    currentPlayer.volume = 1

    let hasError = false
    let isStalled = false
    let metadataInterval = null
    let wasPlayingBeforeError = false
    let isAutoRetry = false
    const retryState = createRetryState()

    // === MEDIA SESSION ===

    const stationName = () => (currentStationDisplay ? currentStationDisplay.textContent : '')

    const updateMediaSession = (title, artist) => {
        setupMediaSession({
            title,
            artist,
            album: stationName() || 'Oidarwave',
            media: currentPlayer,
            onStop: clearMediaSession,
        })
    }

    // === STATUS & RETRY ===

    /** Leitet den Gesamtstatus aus Netzwerk, Fehler und Player-Zustand ab. */
    function updateOverallStatus() {
        let status = 'online'
        if (!navigator.onLine || hasError) status = 'error'
        else if (currentPlayer.paused) status = 'paused'
        else if (isStalled) status = 'buffering'
        // Einen aktiven Retry-Countdown-Text nicht überschreiben.
        if (!retryState.timerId && statusIndicator?.classList.contains('text')) {
            statusIndicator.textContent = ''
        }
        setStatusClass(statusIndicator, status)
    }

    function clearStatusText() {
        if (statusIndicator?.classList.contains('text')) statusIndicator.textContent = ''
    }

    function clearAudioRetry() {
        resetRetry(retryState)
        isAutoRetry = false
        clearStatusText()
    }

    function showRetryText() {
        const delay = getRetryDelay(retryState.count, RETRY_BASE_DELAY)
        logWarn(ErrorCode.AUDIO_RECONNECT_RETRY, null, {
            attempt: retryState.count + 1,
            max: MAX_RETRIES,
            delayMs: delay,
            src: currentPlayer?.src,
        })
        if (statusIndicator) {
            statusIndicator.textContent = `Versuch ${retryState.count + 1}/${MAX_RETRIES} in ${delay / 1000}s…`
            setStatusClass(statusIndicator, 'buffering')
            statusIndicator.classList.add('text')
        }
        return delay
    }

    function showExhaustedText() {
        logError(ErrorCode.AUDIO_RECONNECT_FAILED, null, { retries: MAX_RETRIES, src: currentPlayer?.src })
        if (statusIndicator) {
            statusIndicator.textContent = 'Verbindung verloren – erneut versuchen'
            statusIndicator.classList.add('text', 'error')
        }
    }

    function scheduleAudioRetry() {
        if (!wasPlayingBeforeError || !navigator.onLine) return
        if (retryState.count >= MAX_RETRIES) {
            showExhaustedText()
            return
        }
        showRetryText()
        scheduleRetry(retryState, retryAudio, RETRY_BASE_DELAY)
    }

    function retryAudio() {
        if (!currentPlayer.src) return
        hasError = false
        isAutoRetry = true
        updateOverallStatus()
        currentPlayer.load()
        playMedia()
    }

    function playMedia() {
        wasPlayingBeforeError = true
        currentPlayer.play().catch((e) => handlePlayError(e, 'audio-player'))
    }

    // === MEDIA-EVENTS ===

    const mediaEvents = {
        loadstart: () => {
            isStalled = false
            updateOverallStatus()
        },
        canplay: () => {
            if (currentPlayer.paused) playMedia()
            isStalled = false
            hasError = false
            isAutoRetry = false
            clearAudioRetry()
            updateOverallStatus()
        },
        playing: () => {
            isStalled = false
            hasError = false
            wasPlayingBeforeError = true
            isAutoRetry = false
            clearAudioRetry()
            updateOverallStatus()
            StationHistory.startStation(currentPlayer.src)
            updateMediaSession('', '')
        },
        pause: () => {
            // Nur User-Pause bricht Retry ab (kein Fehlerzustand).
            if (!hasError && !currentPlayer.error) {
                wasPlayingBeforeError = false
                clearAudioRetry()
            }
            updateOverallStatus()
            StationHistory.stopStation(currentPlayer.src)
        },
        waiting: () => {
            isStalled = true
            updateOverallStatus()
        },
        error: (e) => {
            const mediaError = currentPlayer?.error
            logError(ErrorCode.PLAYER_MEDIA_ERROR, e, {
                code: mediaError?.code,
                message: mediaError?.message,
                src: currentPlayer?.src,
                page: location.pathname,
            })
            hasError = true
            // Neuer User-Versuch (kein Auto-Retry) startet eine frische Sequenz.
            if (!isAutoRetry) clearAudioRetry()
            isAutoRetry = false
            updateOverallStatus()
            StationHistory.stopStation(currentPlayer.src)
            scheduleAudioRetry()
        },
    }
    Object.entries(mediaEvents).forEach(([event, handler]) => currentPlayer.addEventListener(event, handler))

    stationButtons.forEach((button) => button.addEventListener('click', () => selectStation(button)))

    // === NETZWERK-WECHSEL ===

    window.addEventListener('offline', () => {
        // Pending Retry pausieren, Count behalten für Resume bei 'online'.
        if (retryState.timerId) {
            clearTimeout(retryState.timerId)
            retryState.timerId = null
        }
        updateOverallStatus()
        StationHistory.stopStation(currentPlayer.src)
    })

    window.addEventListener('online', () => {
        if (hasError && wasPlayingBeforeError && currentPlayer.src) {
            // Ein sofortiger Retry bei Netzrückkehr (zählt als ein Versuch).
            if (retryState.count >= MAX_RETRIES) retryState.count = MAX_RETRIES - 1
            if (retryState.timerId) {
                clearTimeout(retryState.timerId)
                retryState.timerId = null
            }
            retryAudio()
        } else {
            updateOverallStatus()
        }
    })

    document.addEventListener('keydown', handleKeyDown)

    // === STATIONS-AUSWAHL ===

    function selectStation(button) {
        if (!button) return
        clearAudioRetry()
        wasPlayingBeforeError = true
        setActiveStation(stationButtons, button)

        const { url, name, metadataUrl } = button.dataset
        if (currentStationDisplay) currentStationDisplay.textContent = name
        writeSetting(AUDIO_STORAGE_KEY, url)
        restartMetadataPolling(metadataUrl)
        clearMediaSession()

        currentPlayer.src = url
        currentPlayer.load()
    }

    function restartMetadataPolling(metadataUrl) {
        if (metadataInterval) {
            clearInterval(metadataInterval)
            metadataInterval = null
        }
        if (metadataUrl) {
            fetchMetadata(metadataUrl)
            metadataInterval = setInterval(() => fetchMetadata(metadataUrl), METADATA_REFRESH_INTERVAL)
        } else if (currentSongTitleDisplay) {
            currentSongTitleDisplay.textContent = 'Metadaten nicht verfügbar'
        }
    }

    // === TASTATUR ===

    function handleKeyDown(e) {
        if (isEditableTarget(e.target)) return
        switch (e.code) {
            case 'Space':
                e.preventDefault()
                if (currentPlayer.paused) playMedia()
                else currentPlayer.pause()
                break
            case 'ArrowUp':
            case 'ArrowDown': {
                e.preventDefault()
                const delta = e.code === 'ArrowUp' ? VOLUME_STEP : -VOLUME_STEP
                currentPlayer.volume = clamp(currentPlayer.volume + delta, 0, 1, VOLUME_PRECISION)
                break
            }
        }
    }

    // === METADATEN ===

    function fetchMetadata(metadataUrl) {
        fetch(metadataUrl)
            .then((response) => {
                if (!response.ok) throw new Error(`Netzwerkfehler: ${response.status}`)
                return metadataUrl.endsWith('.txt')
                    ? response.text().then((text) => ({ type: 'text', data: text }))
                    : response.json().then((json) => ({ type: 'json', data: json }))
            })
            .then(({ data, type }) => {
                const trackInfo =
                    type === 'text' ? { title: data.split('\n')[0].trim(), artist: '' } : getMusicInfo(data)
                const displayText = formatTrackDisplay(trackInfo)
                if (currentSongTitleDisplay) {
                    currentSongTitleDisplay.innerText = displayText || 'Keine Titelinformationen'
                }
                window.notificationManager?.handleTrackChange(displayText, stationName())
                updateMediaSession(trackInfo.title, trackInfo.artist)
            })
            .catch((error) => {
                logError(ErrorCode.METADATA_FETCH, error, buildMetadataErrorContext(error, metadataUrl))
                if (currentSongTitleDisplay) currentSongTitleDisplay.innerText = 'Metadaten nicht verfügbar'
                clearMediaSession()
            })
    }

    function buildMetadataErrorContext(error, metadataUrl) {
        const ctx = {
            metadataUrl,
            station: stationName(),
            type: error?.name || 'UnknownError',
        }
        if (error?.message?.includes('JSON')) ctx.reason = 'invalid-json'
        else if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
            ctx.reason = 'network-error'
        }
        return ctx
    }

    // === START: letzte Station wiederherstellen oder erste starten ===

    const lastStationUrl = readSetting(AUDIO_STORAGE_KEY)
    const lastStationButton = lastStationUrl
        ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`)
        : null

    if (lastStationButton) selectStation(lastStationButton)
    else if (stationButtons.length > 0) selectStation(stationButtons[0])

    updateOverallStatus()
}

document.addEventListener('DOMContentLoaded', initializePlayer)
