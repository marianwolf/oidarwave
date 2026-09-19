/**
 * player-core.js – Gemeinsames Kernmodul für Audio- (player.js) und Video-Player (video.js).
 *
 * Enthält ausschließlich Code, der in beiden Kontexten identisch verwendet wird,
 * damit player.js (reine Audio-Übertragung) und video.js (Video-Ergänzung) keine
 * Duplikate mehr enthalten.
 *
 * Lädt vor errors.js / player.js / video.js und hängt sich als `window.PlayerCore` an.
 */
(function () {
    'use strict';

    // === GEMEINSAME KONSTANTEN ===
    const FAVICON_ARTWORK = Object.freeze([
        { src: '/favicon/favicon.svg', sizes: '128x128', type: 'image/svg+xml' },
        { src: '/favicon/favicon.svg', sizes: '256x256', type: 'image/svg+xml' },
        { src: '/favicon/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
    ]);

    const STATUS_CLASSES = Object.freeze(['online', 'error', 'buffering', 'paused', 'text']);

    // === MEDIA SESSION API (Android/iOS Lock Screen & Systemsteuerung) ===

    /**
     * Setzt MediaMetadata und Action-Handler für die System-Steuerung.
     * @param {Object} options
     * @param {string} [options.title]      Titel (z. B. Trackname)
     * @param {string} [options.artist]     Interpret
     * @param {string} [options.album]      Album/Sektion (z. B. 'Oidarwave Video')
     * @param {HTMLMediaElement} [options.media] Element für Play/Pause-Handler
     * @param {Function} [options.onStop]   Optionaler Stop-Handler (z. B. Media Session schließen)
     */
    const setupMediaSession = ({ title, artist, album, media, onStop } = {}) => {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title || 'Livestream',
                artist: artist || 'Oidarwave Radio',
                album: album || 'Oidarwave',
                artwork: FAVICON_ARTWORK
            });
            navigator.mediaSession.setActionHandler('play', () => media?.play().catch(e => handlePlayError(e, 'media-session')));
            navigator.mediaSession.setActionHandler('pause', () => media?.pause());
            navigator.mediaSession.setActionHandler('stop', () => {
                media?.pause();
                onStop?.();
            });
        } catch (e) {
            logWarn(ErrorCode.MEDIA_SESSION_SETUP, e, { page: location.pathname });
        }
    };

    const clearMediaSession = () => {
        if ('mediaSession' in navigator && navigator.mediaSession?.metadata) {
            navigator.mediaSession.metadata = null;
        }
    };

    // === STATUS-INDICATOR (gemeinsame CSS-Klassen aus style.css) ===

    const setStatusClass = (el, className) => {
        if (!el) return;
        STATUS_CLASSES.forEach(c => el.classList.remove(c));
        if (className) el.classList.add(className);
    };

    // === LOCALSTORAGE-HELFER (ersetzt die identischen try/catch-Blöcke in player.js/video.js) ===

    const readSetting = (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            logStorageError(ErrorCode.STORAGE_READ, e, key);
            return null;
        }
    };

    const readBoolSetting = (key) => readSetting(key) === 'true';

    const writeSetting = (key, value) => {
        try {
            localStorage.setItem(key, String(value));
        } catch (e) {
            logStorageError(ErrorCode.STORAGE_WRITE, e, key);
        }
    };

    const writeBoolSetting = (key, value) => writeSetting(key, String(Boolean(value)));

    // === EXPORT ===
    window.PlayerCore = Object.freeze({
        FAVICON_ARTWORK,
        setupMediaSession,
        clearMediaSession,
        setStatusClass,
        readSetting,
        readBoolSetting,
        writeSetting,
        writeBoolSetting
    });
})();
