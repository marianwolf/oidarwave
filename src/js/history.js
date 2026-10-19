;(function () {
    'use strict'

    const EXPIRY_DAYS = 90
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000
    /** Sitzungen unter 1s gelten als Fehlstart und werden verworfen. */
    const MIN_SESSION_MS = 1000

    const storage = () => window.PlayerCore
    const historyKey = () => storage()?.HISTORY_KEY || 'station_history'
    const uuid = () => (typeof generateUUID === 'function' ? generateUUID() : `fallback-${Date.now()}-${Math.random()}`)

    const StationHistory = (function () {
        let historyCache = { stations: {} }
        let urlToIdMap = {}
        let stationsCache = null
        let isCacheValid = false
        let activeStationUrl = null
        let initPromise = null

        // --- Migration & Laden ---

        function isOldFormat(history) {
            const keys = Object.keys(history.stations || {})
            return keys.length > 0 && keys[0].startsWith('http')
        }

        function migrateOldHistory(oldHistory) {
            const newStations = {}
            for (const [url, station] of Object.entries(oldHistory.stations || {})) {
                newStations[uuid()] = {
                    url,
                    name: station.name,
                    sessions: station.sessions || [],
                    favicon: station.favicon,
                }
            }
            return { ...oldHistory, stations: newStations }
        }

        function buildUrlMap() {
            urlToIdMap = {}
            for (const [id, station] of Object.entries(historyCache.stations)) {
                if (station.url) urlToIdMap[station.url] = id
            }
        }

        async function loadHistory() {
            const stored = storage()?.readJSON(historyKey(), null)
            if (!stored) {
                const raw = storage() ? null : readLegacyRaw()
                return raw || { stations: {} }
            }
            if (stored.activeStationUrl !== undefined) activeStationUrl = stored.activeStationUrl
            if (isOldFormat(stored)) {
                const migrated = migrateOldHistory(stored)
                saveHistoryDirect(migrated)
                return migrated
            }
            return { stations: stored.stations || {} }
        }

        /** Fallback, falls PlayerCore (noch) nicht geladen ist – sonst immer über PlayerCore. */
        function readLegacyRaw() {
            try {
                const raw = localStorage.getItem(historyKey())
                return raw ? JSON.parse(raw) : { stations: {} }
            } catch (e) {
                window.logError?.(window.ErrorCode?.STORAGE_READ, e, { key: historyKey() })
                return { stations: {} }
            }
        }

        /** Storage ist synchron – kein unnoetiger Promise-/Microtask-Umweg. */
        function saveHistoryDirect(history) {
            storage()?.writeJSON(historyKey(), history)
        }

        function saveHistory() {
            saveHistoryDirect({ ...historyCache, activeStationUrl })
        }

        // --- Sitzungen ---

        function stopAndFinalizeSession(station, timestamp) {
            const openIndex = station.sessions.findIndex((s) => s.end === null)
            if (openIndex === -1) return
            const session = station.sessions[openIndex]
            session.end = timestamp
            if (session.end - session.start < MIN_SESSION_MS) {
                station.sessions.splice(openIndex, 1)
            }
        }

        function getOrCreateStation(url, name, favicon) {
            let stationId = urlToIdMap[url]
            if (!stationId) {
                stationId = uuid()
                historyCache.stations[stationId] = { url, name, sessions: [], favicon }
                urlToIdMap[url] = stationId
            }
            const station = historyCache.stations[stationId]
            station.name = name
            if (favicon) station.favicon = favicon
            return station
        }

        function stopPreviousStation(url, now) {
            if (activeStationUrl === null || activeStationUrl === url) return
            const prevId = urlToIdMap[activeStationUrl]
            if (prevId && historyCache.stations[prevId]) {
                stopAndFinalizeSession(historyCache.stations[prevId], now)
            }
        }

        async function startStation(url, name, options = {}) {
            if (initPromise) await initPromise
            const now = Date.now()
            stopPreviousStation(url, now)

            const station = getOrCreateStation(url, name, options.favicon)
            stopAndFinalizeSession(station, now)
            station.sessions.unshift({ start: now, end: null })
            activeStationUrl = url
            saveHistory()
            invalidateCache()
        }

        async function stopStation(url) {
            if (initPromise) await initPromise
            const station = historyCache.stations[urlToIdMap[url]]
            if (!station) return
            stopAndFinalizeSession(station, Date.now())
            if (activeStationUrl === url) activeStationUrl = null
            saveHistory()
            invalidateCache()
        }

        // --- Aufräumen ---

        async function pruneHistory(isInternal = false) {
            if (!isInternal && initPromise) await initPromise
            const now = Date.now()
            const expiryLimit = now - EXPIRY_TIME_MS
            let hasChanged = false
            let mostRecentOpenUrl = null
            let mostRecentOpenTime = 0

            for (const [id, station] of Object.entries(historyCache.stations)) {
                const { validSessions, lastPlayed, newestOpen } = splitSessions(station, expiryLimit)
                if (newestOpen.start > mostRecentOpenTime) {
                    mostRecentOpenTime = newestOpen.start
                    mostRecentOpenUrl = station.url
                }
                if (validSessions.length !== station.sessions.length) {
                    station.sessions = validSessions
                    hasChanged = true
                }
                if (validSessions.length === 0 && lastPlayed < expiryLimit) {
                    delete historyCache.stations[id]
                    delete urlToIdMap[station.url]
                    hasChanged = true
                }
            }

            hasChanged = finalizeStaleSessions(mostRecentOpenUrl, now) || hasChanged
            if (mostRecentOpenUrl) activeStationUrl = mostRecentOpenUrl
            if (hasChanged) {
                saveHistory()
                invalidateCache()
            }
        }

        function splitSessions(station, expiryLimit) {
            let lastPlayed = 0
            const validSessions = []
            const newestOpen = { start: 0 }
            for (const session of station.sessions) {
                const time = session.end !== null ? session.end : session.start
                if (time > lastPlayed) lastPlayed = time
                if (session.end === null && session.start > newestOpen.start) newestOpen.start = session.start
                if (session.end === null || session.end > expiryLimit) validSessions.push(session)
            }
            return { validSessions, lastPlayed, newestOpen }
        }

        function finalizeStaleSessions(mostRecentOpenUrl, now) {
            let changed = false
            for (const station of Object.values(historyCache.stations)) {
                if (station.url === mostRecentOpenUrl) continue
                for (const session of station.sessions) {
                    if (session.end === null) {
                        stopAndFinalizeSession(station, now)
                        changed = true
                    }
                }
            }
            return changed
        }

        // --- Abfrage mit Cache ---

        function invalidateCache() {
            isCacheValid = false
        }

        function summarizeStation(station) {
            let totalDurationMs = 0
            let playCount = 0
            let lastPlayed = 0
            for (const session of station.sessions) {
                const hasEnd = session.end !== null
                const time = hasEnd ? session.end : session.start
                if (time > lastPlayed) lastPlayed = time
                if (hasEnd) {
                    totalDurationMs += session.end - session.start
                    playCount += 1
                }
            }
            return {
                displayName: station.name,
                details: { favicon: station.favicon, playCount, totalDurationMs, lastPlayed },
            }
        }

        function computeLastStations() {
            return Object.values(historyCache.stations)
                .map(summarizeStation)
                .sort((a, b) => b.details.lastPlayed - a.details.lastPlayed)
        }

        async function getLastStations() {
            if (initPromise) await initPromise
            if (!isCacheValid) {
                stationsCache = computeLastStations()
                isCacheValid = true
            }
            return stationsCache
        }

        async function init() {
            historyCache = await loadHistory()
            buildUrlMap()
            await pruneHistory(true)
        }

        initPromise = init()

        return { startStation, stopStation, getLastStations, pruneHistory, init }
    })()

    if (typeof window !== 'undefined') {
        window.StationHistory = StationHistory
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { StationHistory }
    }
})()
