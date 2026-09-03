const ErrorCode = Object.freeze({
  STORAGE_READ: 'STORAGE_READ_FAILED',
  STORAGE_WRITE: 'STORAGE_WRITE_FAILED',
  METADATA_FETCH: 'METADATA_FETCH_FAILED',
  MEDIA_AUTOPLAY: 'MEDIA_AUTOPLAY_BLOCKED',
  HLS_NETWORK: 'HLS_NETWORK_ERROR',
  HLS_MEDIA: 'HLS_MEDIA_ERROR',
  HLS_FATAL: 'HLS_FATAL_ERROR',
  PATH_TRAVERSAL: 'PATH_TRAVERSAL_BLOCKED',
  FILE_REQUEST: 'FILE_REQUEST_FAILED',
  NPMIGNORE_READ: 'NPMIGNORE_READ_FAILED',
  PAGE_DISCOVERY: 'PAGE_DISCOVERY_FAILED',
  INVALID_NAVIGATION_URL: 'INVALID_NAVIGATION_URL',
  PLAYER_INIT_NO_ELEMENT: 'PLAYER_INIT_NO_ELEMENT',
  PLAYER_MEDIA_ERROR: 'PLAYER_MEDIA_ERROR',
  FAVORITE_DUPLICATE_ID: 'FAVORITE_DUPLICATE_ID',
  FAVORITE_DUPLICATE_URL: 'FAVORITE_DUPLICATE_URL',
  FAVORITE_NOT_FOUND: 'FAVORITE_NOT_FOUND',
});

const HlsErrorMap = Object.freeze({
  [Hls.ErrorTypes.NETWORK_ERROR]: 'HLS_NETWORK',
  [Hls.ErrorTypes.MEDIA_ERROR]: 'HLS_MEDIA',
  [Hls.ErrorTypes.KEY_ERROR]: 'HLS_KEY_ERROR',
  [Hls.ErrorTypes.MUX_ERROR]: 'HLS_MUX_ERROR',
});

function logError(code, err, ctx = {}) {
  if (!code || typeof code !== 'string') {
    console.error('[UNKNOWN_ERROR]', { message: err?.message, name: err?.name, ...ctx });
    return;
  }
  console.error(`[${code}]`, { message: err?.message, name: err?.name, ...ctx });
}

function logWarn(code, err, ctx = {}) {
  if (!code || typeof code !== 'string') {
    console.warn('[UNKNOWN_WARN]', { message: err?.message, name: err?.name, ...ctx });
    return;
  }
  console.warn(`[${code}]`, { message: err?.message, name: err?.name, ...ctx });
}

function logDebug(code, err, ctx = {}) {
  if (!code || typeof code !== 'string') {
    console.debug('[UNKNOWN_DEBUG]', { message: err?.message, name: err?.name, ...ctx });
    return;
  }
  console.debug(`[${code}]`, { message: err?.message, name: err?.name, ...ctx });
}

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
  const errType = getStorageErrorType(err);
  logError(code, err, { key, type: errType });
}

window.ErrorCode = ErrorCode;
window.HlsErrorMap = HlsErrorMap;
window.logError = logError;
window.logWarn = logWarn;
window.logDebug = logDebug;
window.handlePlayError = handlePlayError;
window.logStorageError = logStorageError;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ErrorCode,
    HlsErrorMap,
    logError,
    logWarn,
    logDebug,
    handlePlayError,
    logStorageError,
  };
}
