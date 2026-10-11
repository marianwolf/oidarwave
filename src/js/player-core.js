;(function () {
    'use strict'

    // === INTERNE LOG-HELFER (errors.js lädt zuerst, trotzdem defensiv) ===

    const getLogFn = (name, fallback) => {
        if (typeof window !== 'undefined' && typeof window[name] === 'function') return window[name].bind(window)
        return fallback
    }
    // Hinweis: Diese Wrapper werden erst beim Aufruf aufgelöst, damit ein später
    // geladenes errors.js trotzdem gefunden wird.
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

    /** Single Source of Truth für den Verlaufs-Schlüssel (history.js, favorite.js, download_history.js). */
    const HISTORY_KEY = 'station_history'

    // === MEDIA SESSION API (Android/iOS Lock Screen & Systemsteuerung) ===

    /**
     * Setzt MediaMetadata und Action-Handler für die System-Steuerung.
     * @param {Object} options
     * @param {string} [options.title] Titel (z. B. Trackname)
     * @param {string} [options.artist] Interpret
     * @param {string} [options.album] Album/Sektion (z. B. 'Oidarwave Video')
     * @param {HTMLMediaElement} [options.media] Element für Play/Pause-Handler
     * @param {Function} [options.onStop] Optionaler Stop-Handler
     */
    const setupMediaSession = ({ title, artist, album, media, onStop } = {}) => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
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
        } catch (e) {
            logWarnSafe(errorCodeSafe('MEDIA_SESSION_SETUP', 'MEDIA_SESSION_SETUP_FAILED'), e, {
                page: typeof location !== 'undefined' ? location.pathname : '',
            })
        }
    }

    const clearMediaSession = () => {
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

    /**
     * Fabrik für Status-Anzeigen mit optionaler Textmeldung und Timeout.
     * Fasst die vorher in player.js / video.js duplizierte Logik zusammen.
     * @param {HTMLElement|null} el Status-Element
     */
    const createStatusDisplay = (el) => {
        let messageTimer = null

        const clearTimer = () => {
            if (messageTimer) {
                clearTimeout(messageTimer)
                messageTimer = null
            }
        }

        return {
            /** Setzt nur die Status-Klasse (ohne Text anzufassen, wenn ein Retry-Text aktiv ist). */
            set(status) {
                setStatusClass(el, status)
            },
            /** Zeigt eine nicht-blockierende Textmeldung; duration<=0 = dauerhaft. */
            showMessage(message, type = 'error', duration = 5000) {
                if (!el) return
                clearTimer()
                el.textContent = message
                el.classList.add('text', type)
                if (duration > 0) {
                    messageTimer = setTimeout(() => this.clearMessage(), duration)
                }
            },
            /** Löscht Text + Timeout und setzt die Klasse zurück. */
            clearMessage(nextStatus = null) {
                clearTimer()
                if (!el) return
                el.textContent = ''
                setStatusClass(el, nextStatus)
            },
            /** true, wenn gerade eine Textmeldung (z. B. Retry-Countdown) angezeigt wird. */
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

    const createRetryState = () => ({ count: 0, timerId: null })

    /** delay = baseDelay * 2^attempt (attempt = bisherige Versuche). */
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

    /**
     * Plant einen Retry und inkrementiert den Zähler beim Auslösen.
     * @returns {number} die verwendete Verzögerung in ms
     */
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

    /** Markiert genau einen Stations-Button als aktiv. */
    const setActiveStation = (buttons, activeButton) => {
        buttons.forEach((btn) => btn.classList.toggle('active', btn === activeButton))
    }

    /** true, wenn Tastatur-Shortcuts ignoriert werden sollen (Fokus in Eingabefeld/Button). */
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

    /** Extrahiert {title, artist} aus den heterogenen Metadaten-Formaten der Sender. */
    const getMusicInfo = (data) => {
        const title = data?.song_now_title || data?.playlistItem?.title || ''
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist || ''
        return { title, artist }
    }

    /** Formatiert "Titel - Interpret" oder den jeweils vorhandenen Teil. */
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
