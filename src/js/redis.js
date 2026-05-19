/**
 * redis.js (Renderer)
 *
 * IMPORTANT:
 * - This file runs in the browser/renderer (no Node.js APIs).
 * - Do NOT import `redis` here.
 *
 * Supported runtimes:
 * - Electron: uses IPC via `electron/preload.js`
 * - Web (static + Vercel Functions): uses same-origin `/api/redis/*`
 * - Static-only fallback: localStorage (NOT real Redis)
 */

const Redis = (() => {
  const STORAGE_PREFIX = 'redis_fallback:';

  function isElectronIpcAvailable() {
    return !!window.electronAPI?.redis;
  }

  function isVercelApiAvailable() {
    // Same-origin serverless functions on Vercel (or any host that serves /api).
    // If /api is not deployed, calls will fail and we fall back to localStorage.
    return true;
  }

  function storageKey(key) {
    return `${STORAGE_PREFIX}${key}`;
  }

  function nowMs() {
    return Date.now();
  }

  function readFallback(key) {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'v' in parsed) {
        if (parsed.expiresAtMs && nowMs() > parsed.expiresAtMs) {
          localStorage.removeItem(storageKey(key));
          return null;
        }
        return parsed.v ?? null;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  function writeFallback(key, value, options = {}) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const ttlSeconds = Number.isFinite(options?.ttlSeconds) ? Math.max(0, Math.floor(options.ttlSeconds)) : 0;
    const expiresAtMs = ttlSeconds > 0 ? nowMs() + ttlSeconds * 1000 : null;
    localStorage.setItem(storageKey(key), JSON.stringify({ v: stringValue, expiresAtMs }));
    return { ok: true, fallback: true };
  }

  async function get(key) {
    if (isElectronIpcAvailable()) return window.electronAPI.redis.get(key);
    if (isVercelApiAvailable()) {
      try {
        const res = await fetch(`/api/redis/get?key=${encodeURIComponent(key)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          return data?.result ?? null;
        }
      } catch {
        // ignore and fall back
      }
    }
    return readFallback(key);
  }

  async function set(key, value, options = {}) {
    if (isElectronIpcAvailable()) return window.electronAPI.redis.set(key, value, options);
    if (isVercelApiAvailable()) {
      try {
        const res = await fetch('/api/redis/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ key, value, ttlSeconds: options?.ttlSeconds }),
          credentials: 'same-origin',
        });
        if (res.ok) return await res.json();
      } catch {
        // ignore and fall back
      }
    }
    try {
      return writeFallback(key, value, options);
    } catch (e) {
      return { ok: false, reason: 'localStorage_failed', error: String(e?.message || e) };
    }
  }

  return { get, set };
})();

window.Redis = Redis;
