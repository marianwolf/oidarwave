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
        createStatusDisplay,
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

    const statusDisplay = createStatusDisplay(statusIndicator)

    let hasError = false
    let isStalled = false
    let metadataInterval = null
    let metadataAbortController = null
    let currentMetadataUrl = null
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
        // Eine sichtbare Meldung (Retry-Countdown oder Fehlerhinweis) nicht
        // ueberschreiben: sonst verliert sie ihre Pill-Formatierung und bleibt
        // als unformatierter Text ueber dem Status-Punkt stehen. Sie loest sich
        // ueber ihren eigenen Timeout bzw. clearAudioRetry() auf.
        if (statusDisplay.hasMessage()) return
        statusDisplay.clearMessage(status)
    }

    function clearAudioRetry() {
        resetRetry(retryState)
        isAutoRetry = false
        statusDisplay.clearMessage()
        statusIndicator?.removeAttribute('title')
    }

    function showRetryText() {
        const delay = getRetryDelay(retryState.count, RETRY_BASE_DELAY)
        const attempt = retryState.count + 1
        logWarn(ErrorCode.AUDIO_RECONNECT_RETRY, null, {
            attempt,
            max: MAX_RETRIES,
            delayMs: delay,
            src: currentPlayer?.src,
        })
        statusDisplay.showMessage(`Versuch ${attempt}/${MAX_RETRIES} in ${delay / 1000} s`, 'buffering', 0)
        statusIndicator?.setAttribute(
            'title',
            `Keine Verbindung zum Stream – Versuch ${attempt} von ${MAX_RETRIES} in ${delay / 1000} Sekunden`
        )
        return delay
    }

    function showExhaustedText() {
        logError(ErrorCode.AUDIO_RECONNECT_FAILED, null, { retries: MAX_RETRIES, src: currentPlayer?.src })
        // Klare, kurze Meldung, die nach einigen Sekunden wieder verschwindet;
        // der rote Status-Punkt bleibt als dauerhafter Fehlerhinweis.
        // Kurz genug, um auch neben dem Sendernamen einzeilig zu bleiben.
        statusDisplay.showMessage('Stream nicht erreichbar', 'error', 6000, 'error')
        statusIndicator?.setAttribute('title', 'Keine Verbindung zum Stream – bitte Sender neu wählen')
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
        // Countdown-Pill sofort aufloesen: waehrend des Versuchs pulsiert der
        // Status-Punkt, statt einen veralteten Countdown stehen zu lassen.
        statusDisplay.clearMessage('buffering')
        statusIndicator?.removeAttribute('title')
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
        // Ohne Verbindung gibt es keinen Countdown mehr – Meldung sofort
        // aufloesen, statt einen eingefrorenen Versuch-Text stehen zu lassen.
        statusDisplay.clearMessage('error')
        statusIndicator?.removeAttribute('title')
        updateOverallStatus()
        StationHistory.stopStation(currentPlayer.src)
    })

    // Polling pausiert im Hintergrund und holt beim Zurueckkommen sofort frische Daten.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopMetadataPolling()
            return
        }
        refreshMetadata()
        startMetadataInterval()
    })

    window.addEventListener('online', () => {
        refreshMetadata()
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
        stopMetadataPolling()
        currentMetadataUrl = metadataUrl || null
        if (!currentMetadataUrl) {
            updateSongTitle('Metadaten nicht verfügbar')
            return
        }
        refreshMetadata()
        startMetadataInterval()
    }

    /** Polling nur bei sichtbarer Seite – im Hintergrund laufen sonst alle 3s Requests. */
    function startMetadataInterval() {
        if (metadataInterval || !currentMetadataUrl || document.hidden) return
        metadataInterval = setInterval(refreshMetadata, METADATA_REFRESH_INTERVAL)
    }

    function stopMetadataPolling() {
        if (metadataInterval) {
            clearInterval(metadataInterval)
            metadataInterval = null
        }
        // Laufende Anfrage abbrechen: sonst kann eine verspaetete Antwort der
        // alten Station den Titel der neuen Station ueberschreiben.
        if (metadataAbortController) {
            metadataAbortController.abort()
            metadataAbortController = null
        }
    }

    function refreshMetadata() {
        if (!currentMetadataUrl || document.hidden || !navigator.onLine) return
        fetchMetadata(currentMetadataUrl)
    }

    /** Schreibt den Titel nur bei echter Aenderung (spart Layout/Paint beim Polling). */
    function updateSongTitle(text) {
        if (currentSongTitleDisplay && currentSongTitleDisplay.textContent !== text) {
            currentSongTitleDisplay.textContent = text
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
        const previousController = metadataAbortController
        const controller = new AbortController()
        metadataAbortController = controller
        previousController?.abort()

        fetch(metadataUrl, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`Netzwerkfehler: ${response.status}`)
                return metadataUrl.endsWith('.txt')
                    ? response.text().then((text) => ({ type: 'text', data: text }))
                    : response.json().then((json) => ({ type: 'json', data: json }))
            })
            .then(({ data, type }) => {
                if (controller.signal.aborted) return
                const trackInfo =
                    type === 'text' ? { title: data.split('\n')[0].trim(), artist: '' } : getMusicInfo(data)
                const displayText = formatTrackDisplay(trackInfo)
                updateSongTitle(displayText || 'Keine Titelinformationen')
                window.notificationManager?.handleTrackChange(displayText, stationName())
                updateMediaSession(trackInfo.title, trackInfo.artist)
            })
            .catch((error) => {
                // Abgebrochene Anfragen (Senderwechsel/Hidden) sind keine Fehler.
                if (controller.signal.aborted || error?.name === 'AbortError') return
                logError(ErrorCode.METADATA_FETCH, error, buildMetadataErrorContext(error, metadataUrl))
                updateSongTitle('Metadaten nicht verfügbar')
                clearMediaSession()
            })
            .finally(() => {
                if (metadataAbortController === controller) metadataAbortController = null
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
    // Ueber dataset vergleichen statt per Attribut-Selektor (URLs koennen Zeichen
    // enthalten, die im CSS-Selektor maskiert werden muessten).
    const lastStationButton = lastStationUrl
        ? Array.from(stationButtons).find((button) => button.dataset.url === lastStationUrl) || null
        : null

    if (lastStationButton) selectStation(lastStationButton)
    else if (stationButtons.length > 0) selectStation(stationButtons[0])

    updateOverallStatus()
}

document.addEventListener('DOMContentLoaded', initializePlayer)
