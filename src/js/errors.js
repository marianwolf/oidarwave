const LOG_LEVELS = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 });

function getLogLevel() {
    if (typeof window !== 'undefined' && window.LOG_LEVEL) {
        const level = String(window.LOG_LEVEL).toUpperCase();
        return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.WARN;
    }
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('logLevel');
        if (stored) {
            const level = String(stored).toUpperCase();
            return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.WARN;
        }
    }
    return LOG_LEVELS.WARN;
}

const currentLogLevel = getLogLevel();

function shouldLog(level) {
    return level >= currentLogLevel;
}

function formatLogEntry(code, err, ctx, timestamp) {
    const entry = {
        timestamp: timestamp || new Date().toISOString(),
        code: code || 'UNKNOWN',
        message: err?.message || null,
        name: err?.name || null,
        ...ctx
    };
    if (err instanceof Error && err.stack) {
        entry.stack = err.stack;
    }
    return entry;
}

const ErrorCode = Object.freeze({
    STORAGE_READ: 'STORAGE_READ_FAILED',
    STORAGE_WRITE: 'STORAGE_WRITE_FAILED',
    METADATA_FETCH: 'METADATA_FETCH_FAILED',
    MEDIA_AUTOPLAY: 'MEDIA_AUTOPLAY_BLOCKED',
    HLS_NETWORK: 'HLS_NETWORK_ERROR',
    HLS_MEDIA: 'HLS_MEDIA_ERROR',
    HLS_FATAL: 'HLS_FATAL_ERROR',
    HLS_KEY_ERROR: 'HLS_KEY_ERROR',
    HLS_MUX_ERROR: 'HLS_MUX_ERROR',
    PATH_TRAVERSAL: 'PATH_TRAVERSAL_BLOCKED',
    FILE_REQUEST: 'FILE_REQUEST_FAILED',
    NPMIGNORE_READ: 'NPMIGNORE_READ_FAILED',
    PAGE_DISCOVERY: 'PAGE_DISCOVERY_FAILED',
    INVALID_NAVIGATION_URL: 'INVALID_NAVIGATION_URL',
    PLAYER_INIT_NO_ELEMENT: 'PLAYER_INIT_NO_ELEMENT',
    PLAYER_MEDIA_ERROR: 'PLAYER_MEDIA_ERROR',
    FAVORITE_LOAD: 'FAVORITE_LOAD_FAILED',
    FAVORITE_SAVE: 'FAVORITE_SAVE_FAILED',
    FAVORITE_DUPLICATE_ID: 'FAVORITE_DUPLICATE_ID',
    FAVORITE_DUPLICATE_URL: 'FAVORITE_DUPLICATE_URL',
    FAVORITE_NOT_FOUND: 'FAVORITE_NOT_FOUND',
    MEDIA_SESSION_SETUP: 'MEDIA_SESSION_SETUP_FAILED',
    DOWNLOAD_HISTORY: 'DOWNLOAD_HISTORY_FAILED',
    UNHANDLED_ERROR: 'UNHANDLED_ERROR',
    UNHANDLED_REJECTION: 'UNHANDLED_REJECTION',
});

const HlsErrorMap = Object.freeze(
    typeof Hls !== 'undefined' && Hls.ErrorTypes ? {
        [Hls.ErrorTypes.NETWORK_ERROR]: 'HLS_NETWORK',
        [Hls.ErrorTypes.MEDIA_ERROR]: 'HLS_MEDIA',
        [Hls.ErrorTypes.KEY_ERROR]: 'HLS_KEY_ERROR',
        [Hls.ErrorTypes.MUX_ERROR]: 'HLS_MUX_ERROR',
    } : {}
);

let electronLog = null;
if (typeof module !== 'undefined') {
    try {
        electronLog = require('electron-log');
    } catch (e) {
        electronLog = null;
    }
}

function getLogger() {
    return electronLog ? electronLog : console;
}

function createLogger(method, level) {
    return (code, err, ctx = {}) => {
        if (!shouldLog(level)) return;
        const log = getLogger();
        const entry = formatLogEntry(code, err, ctx);
        if (!code || typeof code !== 'string') {
            log[method](entry);
        } else {
            log[method](`[${code}]`, entry);
        }
    };
}

const logError = createLogger('error', LOG_LEVELS.ERROR);
const logWarn = createLogger('warn', LOG_LEVELS.WARN);
const logInfo = createLogger('info', LOG_LEVELS.INFO);
const logDebug = createLogger('debug', LOG_LEVELS.DEBUG);

function handlePlayError(e, context = '') {
    const name = e?.name || e?.constructor?.name || 'UnknownError';
    if (name === 'NotAllowedError') {
        logDebug(ErrorCode.MEDIA_AUTOPLAY, e, { context, reason: 'Browser policy blocked autoplay (missing user gesture)' });
    } else if (name === 'NotSupportedError') {
        logError(ErrorCode.MEDIA_AUTOPLAY, e, { context, reason: 'Browser does not support playback' });
    } else {
        logError(ErrorCode.MEDIA_AUTOPLAY, e, { context, reason: name });
    }
}

function getStorageErrorType(err) {
    const name = err?.name || '';
    if (name === 'QuotaExceededError' || err?.code === 22) return 'QUOTA_EXCEEDED';
    if (name === 'SecurityError') return 'SECURITY_ERROR';
    return 'UNKNOWN';
}

function logStorageError(code, err, key = '') {
    logError(code, err, { key, type: getStorageErrorType(err) });
}

function initGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    window.onerror = (message, source, lineno, colno, error) => {
        logError(ErrorCode.UNHANDLED_ERROR, error || new Error(message), {
            source,
            lineno,
            colno,
            message
        });
    };

    window.addEventListener('unhandledrejection', (event) => {
        const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        logError(ErrorCode.UNHANDLED_REJECTION, err, {});
    });
}

function initMainProcessErrorHandlers() {
    if (typeof process === 'undefined') return;

    process.on('unhandledRejection', (reason) => {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        logError(ErrorCode.UNHANDLED_REJECTION, err, {});
    });

    process.on('uncaughtException', (err) => {
        logError(ErrorCode.UNHANDLED_ERROR, err, {});
    });
}

if (typeof window !== 'undefined') {
    window.ErrorCode = ErrorCode;
    window.HlsErrorMap = HlsErrorMap;
    window.logError = logError;
    window.logWarn = logWarn;
    window.logInfo = logInfo;
    window.logDebug = logDebug;
    window.handlePlayError = handlePlayError;
    window.logStorageError = logStorageError;
    window.initGlobalErrorHandlers = initGlobalErrorHandlers;
    initGlobalErrorHandlers();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ErrorCode,
        HlsErrorMap,
        logError,
        logWarn,
        logInfo,
        logDebug,
        handlePlayError,
        logStorageError,
        initGlobalErrorHandlers,
        initMainProcessErrorHandlers,
    };
}