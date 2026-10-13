document.addEventListener('DOMContentLoaded', () => {
    'use strict'

    // === KONSTANTEN ===
    const SEEK_TIME = 10
    const DATA_SAVE_MODE_KEY = 'dataSaveMode'
    const CAPTION_ENABLED_KEY = 'captionsEnabled'
    const CAPTION_TRACK_KINDS = ['subtitles', 'captions', 'metadata']
    const MAX_RETRIES = 3
    const RETRY_BASE_DELAY = 1000 // 1 Sekunde Basis-Wartezeit

    const {
        setupMediaSession,
        clearMediaSession,
        readBoolSetting,
        writeSetting,
        createStatusDisplay,
        createRetryState,
        getRetryDelay,
        scheduleRetry,
        resetRetry,
        isEditableTarget,
    } = window.PlayerCore

    // === DOM-REFERENZEN ===
    const dataModeToggle = document.getElementById('dataModeToggle')
    const captionToggle = document.getElementById('captionToggle')
    const stationButtons = document.querySelectorAll('.station-btn')
    const videoPlayer = document.getElementById('videoPlayer')
    const currentStationDisplay = document.getElementById('currentStation')
    const statusIndicator = document.getElementById('statusIndicator')
    const rewindButton = document.getElementById('rewindButton')
    const forwardButton = document.getElementById('forwardButton')

    if (!videoPlayer) {
        logError(ErrorCode.PLAYER_INIT_NO_ELEMENT, null, { selector: '#videoPlayer', page: location.pathname })
        return
    }

    // iOS: Inline-Wiedergabe ermöglichen
    videoPlayer.setAttribute('playsinline', '')
    videoPlayer.setAttribute('webkit-playsinline', '')

    // === STATE ===
    let hlsPlayer = null
    const retryState = createRetryState()
    const statusDisplay = createStatusDisplay(statusIndicator)
    const settingsCache = {
        dataSaveMode: readBoolSetting(DATA_SAVE_MODE_KEY),
        captionsEnabled: readBoolSetting(CAPTION_ENABLED_KEY),
    }

    /** Speichert eine Einstellung und synchronisiert den Toggle-Button. */
    const saveSetting = (key, value, toggleElement) => {
        toggleElement?.setAttribute('aria-pressed', String(value))
        writeSetting(key, value)
    }

    // Automatisch alle neuen Tracks deaktivieren, wenn CC ausgeschaltet ist.
    videoPlayer.textTracks.addEventListener('addtrack', (event) => {
        if (!settingsCache.captionsEnabled && event.track) event.track.mode = 'disabled'
    })

    // === UNTERTITEL-HELFER ===

    const disableAllTextTracks = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = false
        for (const track of videoPlayer.textTracks) track.mode = 'disabled'
    }

    const findCaptionTrack = () =>
        Array.from(videoPlayer.textTracks).find((track) => CAPTION_TRACK_KINDS.includes(track?.kind)) ?? null

    const updateQualityLevel = () => {
        if (!hlsPlayer || hlsPlayer.levels.length === 0) return
        hlsPlayer.currentLevel = settingsCache.dataSaveMode ? 0 : -1
    }

    /** Wendet die CC-Einstellung an (einzige Stelle statt enable/disable-Duplikat). */
    const applyCaptions = () => {
        if (hlsPlayer) hlsPlayer.subtitleDisplay = settingsCache.captionsEnabled
        const track = findCaptionTrack()
        if (track) track.mode = settingsCache.captionsEnabled ? 'showing' : 'disabled'
        else if (settingsCache.captionsEnabled) disableAllTextTracks()
    }

    const toggleCaptions = () => {
        settingsCache.captionsEnabled = !settingsCache.captionsEnabled
        saveSetting(CAPTION_ENABLED_KEY, settingsCache.captionsEnabled, captionToggle)
        applyCaptions()
    }

    const initializeCaptions = () => {
        captionToggle.setAttribute('aria-pressed', String(settingsCache.captionsEnabled))
        applyCaptions()
    }

    // === HLS-SETUP ===

    const setupHlsPlayer = (url) => {
        destroyHlsPlayer()
        resetRetry(retryState)
        disableAllTextTracks()

        if (window.Hls?.isSupported()) {
            setupHlsJsPlayer(url)
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            setupNativePlayer(url)
        } else {
            logError(ErrorCode.HLS_FATAL, null, { reason: 'HLS not supported by browser' })
            statusDisplay.showMessage('Ihr Browser unterstützt dieses Videoformat nicht.', 'error', 0)
        }
    }

    const destroyHlsPlayer = () => {
        if (hlsPlayer) {
            hlsPlayer.destroy()
            hlsPlayer = null
        }
    }

    const setupHlsJsPlayer = (url) => {
        // HLS.js nutzt XHR und braucht CORS.
        videoPlayer.setAttribute('crossorigin', 'anonymous')
        hlsPlayer = new Hls({
            xhrSetup: (xhr) => {
                xhr.withCredentials = false // Keine Credentials senden, hilft oft bei CORS-Problemen
            },
        })
        const playerInstance = hlsPlayer
        hlsPlayer.loadSource(url)
        hlsPlayer.attachMedia(videoPlayer)

        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
            if (hlsPlayer !== playerInstance) return
            statusDisplay.clearMessage()
            videoPlayer.play().catch((e) => handlePlayError(e, 'manifest-parsed'))
            updateQualityLevel()
            applyCaptions()
        })
        hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
            if (hlsPlayer !== playerInstance) return
            const ctx = buildHlsErrorContext(data, hlsPlayer)
            const code = data.fatal ? ErrorCode.HLS_FATAL : ErrorCode[`HLS_${ctx.mappedType}`] || 'HLS_ERROR'
            logError(code, null, ctx)
            if (data.fatal) handleFatalHlsError(data, playerInstance)
            // Nicht-fatale Fehler behandelt Hls.js selbst (kein manuelles Recovery nötig).
        })
    }

    const buildHlsErrorContext = (data, player) => {
        const map = window.HlsErrorMap || {}
        const ctx = {
            type: data.type,
            mappedType: map[data.type] || data.type,
            fatal: data.fatal,
            details: data.details,
            url: player?.url,
        }
        if (data.response) {
            ctx.httpStatus = data.response.code
            ctx.httpUrl = data.response.url
        }
        if (data.error?.code !== undefined) ctx.systemErrorCode = data.error.code
        return ctx
    }

    const handleNetworkRetry = (playerInstance) => {
        if (retryState.count >= MAX_RETRIES) {
            logError(ErrorCode.HLS_NETWORK, null, { retries: MAX_RETRIES, url: hlsPlayer?.url })
            destroyHlsPlayer()
            statusDisplay.showMessage(
                `Netzwerkfehler: Nach ${MAX_RETRIES} Versuchen keine Verbindung. Bitte Internetverbindung prüfen und Seite neu laden.`,
                'error',
                0
            )
            return
        }
        const delay = getRetryDelay(retryState.count, RETRY_BASE_DELAY)
        logWarn('HLS_NETWORK_RETRY', null, { attempt: retryState.count + 1, max: MAX_RETRIES, delayMs: delay })
        scheduleRetry(
            retryState,
            () => {
                if (hlsPlayer === playerInstance) hlsPlayer.startLoad()
            },
            RETRY_BASE_DELAY
        )
    }

    const handleFatalHlsError = (data, playerInstance) => {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            handleNetworkRetry(playerInstance)
            return
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            logWarn(ErrorCode.HLS_MEDIA, null, { action: 'recoverMediaError' })
            hlsPlayer?.recoverMediaError()
            return
        }
        logError(ErrorCode.HLS_FATAL, null, { details: data.details, type: data.type })
        destroyHlsPlayer()
        statusDisplay.showMessage(`Schwerwiegender Fehler: ${data.details}. Bitte Seite neu laden.`, 'error', 0)
    }

    const setupNativePlayer = (url) => {
        // Natives Safari-HLS: crossorigin entfernen, sonst scheitern Streams ohne CORS-Header.
        videoPlayer.removeAttribute('crossorigin')
        videoPlayer.src = url
        videoPlayer.addEventListener(
            'loadedmetadata',
            () => {
                statusDisplay.clearMessage()
                videoPlayer.play().catch((e) => handlePlayError(e, 'native-player'))
                applyCaptions()
            },
            { once: true }
        )
    }

    // === SEEK & DATENSPARMODUS ===

    const seek = (seconds) => {
        const { currentTime, duration } = videoPlayer
        videoPlayer.currentTime = Math.max(0, Math.min(duration || Infinity, currentTime + seconds))
    }

    const toggleDataSaveMode = () => {
        settingsCache.dataSaveMode = !settingsCache.dataSaveMode
        saveSetting(DATA_SAVE_MODE_KEY, settingsCache.dataSaveMode, dataModeToggle)
        updateQualityLevel()
    }

    // === STATIONS-AUSWAHL ===

    const selectStation = (button) => {
        statusDisplay.clearMessage()
        currentStationDisplay.textContent = button.dataset.name
        setupHlsPlayer(button.dataset.url)
        setupMediaSession({
            title: button.dataset.name,
            artist: 'Livestream',
            album: 'Oidarwave Video',
            media: videoPlayer,
            onStop: clearMediaSession,
        })
    }

    // === EVENTS ===

    const initializeEventListeners = () => {
        stationButtons.forEach((button) => {
            button.addEventListener('click', () => selectStation(button), { passive: true })
        })
        dataModeToggle.addEventListener('click', toggleDataSaveMode, { passive: true })
        captionToggle.addEventListener('click', toggleCaptions, { passive: true })
        rewindButton?.addEventListener('click', () => seek(-SEEK_TIME), { passive: true })
        forwardButton?.addEventListener('click', () => seek(SEEK_TIME), { passive: true })

        document.addEventListener(
            'visibilitychange',
            () => {
                if (document.visibilityState === 'visible' && !videoPlayer.paused) {
                    videoPlayer.play().catch((e) => handlePlayError(e, 'visibilitychange-resume'))
                }
            },
            { passive: true }
        )

        videoPlayer.addEventListener('pause', () => {
            logDebug(ErrorCode.MEDIA_SESSION_SETUP, null, { state: 'paused' })
        })
        videoPlayer.addEventListener('playing', () => {
            logDebug(ErrorCode.MEDIA_SESSION_SETUP, null, { state: 'playing' })
        })

        document.addEventListener(
            'keydown',
            (event) => {
                if (isEditableTarget(document.activeElement)) return
                switch (event.key) {
                    case 'ArrowLeft':
                        event.preventDefault()
                        seek(-SEEK_TIME)
                        break
                    case 'ArrowRight':
                        event.preventDefault()
                        seek(SEEK_TIME)
                        break
                }
            },
            { passive: false }
        )
    }

    // === START ===

    const initializePlayer = () => {
        dataModeToggle.setAttribute('aria-pressed', String(settingsCache.dataSaveMode))
        initializeCaptions()
        if (stationButtons[0]) selectStation(stationButtons[0])
    }

    initializeEventListeners()
    initializePlayer()
})
