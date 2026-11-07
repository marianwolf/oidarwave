;(function () {
    'use strict'

    // === INTERNE LOG-HELFER (errors.js lädt zuerst, trotzdem defensiv) ===

    const getLogFn = (name, fallback) => {
        if (typeof window !== 'undefined' && typeof window[name] === 'function') return window[name].bind(window)
        return fallback
    }
    // Wrapper lösen die Log-Funktionen erst beim Aufruf auf: errors.js darf später laden.
    const logWarnSafe = (code, err, ctx) => getLogFn('logWarn', console.warn)(code, err, ctx)
    const logStorageErrorSafe = (code, err, key) => {
        if (typeof window !== 'undefined' && typeof window.logStorageError === 'function') {
            window.logStorageError(code, err, key)
            return
        }
        console.error(code, key, err)
    }
    const handlePlayErrorSafe = (err, context) => {
        if (typeof window !== 'undefined' && typeof window.handlePlayError === 'function') {
            window.handlePlayError(err, context)
            return
        }
        console.error('PLAY_ERROR', context, err)
    }
    const errorCodeSafe = (name, fallback) => {
        if (typeof window !== 'undefined' && window.ErrorCode && window.ErrorCode[name]) return window.ErrorCode[name]
        return fallback
    }

    // === GEMEINSAME KONSTANTEN ===

    const FAVICON_ARTWORK = Object.freeze([
        { src: '/favicon/favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
        { src: '/favicon/favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
        { src: '/favicon/favicon.svg', sizes: '512x512', type: 'image/svg+xml' },
    ])

    const STATUS_CLASSES = Object.freeze(['online', 'error', 'buffering', 'paused', 'text'])

    // Verlaufs-Schlüssel – Single Source of Truth (history.js, favorite.js, download_history.js)
    const HISTORY_KEY = 'station_history'

    // === MEDIA SESSION API (Android/iOS Lock Screen & Systemsteuerung) ===

    // Letzter gesetzter Track – blockiert identische MediaMetadata-Writes im Polling
    let lastMediaSessionKey = null

    // Setzt MediaMetadata und Action-Handler (Play/Pause/Stop) für die Systemsteuerung
    // Optionen: { title, artist, album, media, onStop }
    const setupMediaSession = ({ title, artist, album, media, onStop } = {}) => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
        const sessionKey = `${title || ''}|${artist || ''}|${album || ''}`
        if (sessionKey === lastMediaSessionKey) return
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'Livestream',
                artist: artist || 'Oidarwave Radio',
                album: album || 'Oidarwave',
                artwork: FAVICON_ARTWORK,
            })
            navigator.mediaSession.setActionHandler('play', () =>
                media?.play().catch((e) => handlePlayErrorSafe(e, 'media-session'))
            )
            navigator.mediaSession.setActionHandler('pause', () => media?.pause())
            navigator.mediaSession.setActionHandler('stop', () => {
                media?.pause()
                onStop?.()
            })
            lastMediaSessionKey = sessionKey
        } catch (e) {
            logWarnSafe(errorCodeSafe('MEDIA_SESSION_SETUP', 'MEDIA_SESSION_SETUP_FAILED'), e, {
                page: typeof location !== 'undefined' ? location.pathname : '',
            })
        }
    }

    const clearMediaSession = () => {
        lastMediaSessionKey = null
        if (typeof navigator === 'undefined') return
        if ('mediaSession' in navigator && navigator.mediaSession?.metadata) {
            navigator.mediaSession.metadata = null
        }
    }

    // === STATUS-INDICATOR (gemeinsame CSS-Klassen aus style.css) ===

    const setStatusClass = (el, className) => {
        if (!el) return
        STATUS_CLASSES.forEach((c) => el.classList.remove(c))
        if (className) el.classList.add(className)
    }

    // Fabrik für Status-Anzeigen mit optionalem Text + Timeout
    // Ersetzt die duplizierte Logik aus player.js / video.js
    const createStatusDisplay = (el) => {
        let messageTimer = null

        const clearTimer = () => {
            if (messageTimer) {
                clearTimeout(messageTimer)
                messageTimer = null
            }
        }

        return {
            // Setzt nur die Status-Klasse (aktiver Retry-Text bleibt unangetastet)
            set(status) {
                setStatusClass(el, status)
            },
            // Nicht-blockierende Textmeldung; duration <= 0 = dauerhaft
            // nextStatus folgt nach dem Ausblenden (z. B. 'error')
            showMessage(message, type = 'error', duration = 5000, nextStatus = null) {
                if (!el) return
                clearTimer()
                // Erst Status setzen (entfernt 'text'), dann Text-Klasse ergänzen
                // – sonst bleiben z. B. 'buffering' und 'error' gleichzeitig aktiv
                setStatusClass(el, type)
                el.textContent = message
                el.classList.add('text')
                if (duration > 0) {
                    messageTimer = setTimeout(() => this.clearMessage(nextStatus), duration)
                }
            },
            // Text + Timeout löschen, Klasse auf nextStatus zurücksetzen
            clearMessage(nextStatus = null) {
                clearTimer()
                if (!el) return
                el.textContent = ''
                setStatusClass(el, nextStatus)
            },
            // true, solange eine Textmeldung (z. B. Retry-Countdown) sichtbar ist
            hasMessage() {
                return !!el?.classList.contains('text')
            },
        }
    }

    // === LOCALSTORAGE-HELFER (einzige Stelle mit try/catch für Storage) ===

    const readSetting = (key) => {
        try {
            return localStorage.getItem(key)
        } catch (e) {
            logStorageErrorSafe(errorCodeSafe('STORAGE_READ', 'STORAGE_READ_FAILED'), e, key)
            return null
        }
    }

    const readBoolSetting = (key) => readSetting(key) === 'true'

    const writeSetting = (key, value) => {
        try {
            localStorage.setItem(key, String(value))
        } catch (e) {
            logStorageErrorSafe(errorCodeSafe('STORAGE_WRITE', 'STORAGE_WRITE_FAILED'), e, key)
        }
    }

    const writeBoolSetting = (key, value) => writeSetting(key, String(Boolean(value)))

    const readJSON = (key, fallback = null) => {
        const raw = readSetting(key)
        if (!raw) return fallback
        try {
            return JSON.parse(raw)
        } catch (e) {
            logStorageErrorSafe(errorCodeSafe('STORAGE_READ', 'STORAGE_READ_FAILED'), e, key)
            return fallback
        }
    }

    const writeJSON = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
            logStorageErrorSafe(errorCodeSafe('STORAGE_WRITE', 'STORAGE_WRITE_FAILED'), e, key)
        }
    }

    const removeSetting = (key) => {
        try {
            localStorage.removeItem(key)
        } catch (e) {
            logStorageErrorSafe(errorCodeSafe('STORAGE_WRITE', 'STORAGE_WRITE_FAILED'), e, key)
        }
    }

    // === RETRY MIT EXPONENTIELLEM BACKOFF (player.js + video.js) ===

    // Maximale Auto-Retry-Versuche, bevor aufgegeben wird
    const MAX_RETRIES = 3
    // Wartezeit vor dem ersten Retry (Verdopplung je Versuch)
    const RETRY_BASE_DELAY = 1000

    const createRetryState = () => ({ count: 0, timerId: null })

    // Verzögerung: baseDelay * 2^attempt (attempt = bisherige Versuche)
    const getRetryDelay = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt)

    const clearRetry = (state) => {
        if (state?.timerId) {
            clearTimeout(state.timerId)
            state.timerId = null
        }
        return state
    }

    const resetRetry = (state) => {
        if (!state) return state
        clearRetry(state)
        state.count = 0
        return state
    }

    // Plant einen Retry und zählt den Versuch beim Auslösen hoch
    // Rückgabe: verwendete Verzögerung in ms
    const scheduleRetry = (state, fn, baseDelay) => {
        const delay = getRetryDelay(state.count, baseDelay)
        state.timerId = setTimeout(() => {
            state.timerId = null
            state.count += 1
            fn()
        }, delay)
        return delay
    }

    // === KLEINE UI-/DATEN-HELFER ===

    // Markiert genau einen Stations-Button als aktiv
    const setActiveStation = (buttons, activeButton) => {
        buttons.forEach((btn) => btn.classList.toggle('active', btn === activeButton))
    }

    // Tastatur-Shortcuts ignorieren, wenn Fokus in Eingabefeld/Button liegt
    const isEditableTarget = (target) => {
        if (!target || !target.tagName) return false
        const tag = target.tagName.toUpperCase()
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return true
        return !!target.isContentEditable
    }

    const clamp = (value, min = 0, max = 1, precision = 1) => {
        const bounded = Math.max(min, Math.min(max, value))
        return parseFloat(bounded.toFixed(precision))
    }

    // Extrahiert {title, artist} aus den unterschiedlichen Metadaten-Formaten der Sender
    const getMusicInfo = (data) => {
        const title = data?.song_now_title || data?.playlistItem?.title || ''
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist || ''
        return { title, artist }
    }

    // Formatiert "Titel - Interpret" oder den jeweils vorhandenen Teil
    const formatTrackDisplay = ({ title = '', artist = '' } = {}) => {
        if (title && artist) return `${title} - ${artist}`
        return title || artist || ''
    }

    // === EXPORT ===

    const PlayerCore = Object.freeze({
        FAVICON_ARTWORK,
        STATUS_CLASSES,
        HISTORY_KEY,
        setupMediaSession,
        clearMediaSession,
        setStatusClass,
        createStatusDisplay,
        readSetting,
        readBoolSetting,
        writeSetting,
        writeBoolSetting,
        readJSON,
        writeJSON,
        removeSetting,
        MAX_RETRIES,
        RETRY_BASE_DELAY,
        createRetryState,
        getRetryDelay,
        clearRetry,
        resetRetry,
        scheduleRetry,
        setActiveStation,
        isEditableTarget,
        clamp,
        getMusicInfo,
        formatTrackDisplay,
    })

    if (typeof window !== 'undefined') {
        window.PlayerCore = PlayerCore
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayerCore
    }
})()
