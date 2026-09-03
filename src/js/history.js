const StationHistory = (function() {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    let historyCache = { stations: {} };
    let urlToIdMap = {};
    let stationsCache = null;
    let isCacheValid = false;
    let activeStationUrl = null;
    let initPromise = null;

    function isOldFormat(history) {
        const keys = Object.keys(history.stations || {});
        return keys.length > 0 && keys[0].startsWith('http');
    }

    function migrateOldHistory(oldHistory) {
        const newStations = {};
        for (const [url, station] of Object.entries(oldHistory.stations || {})) {
            const id = generateUUID();
            newStations[id] = {
                url,
                name: station.name,
                sessions: station.sessions || [],
                favicon: station.favicon
            };
        }
        return {
            ...oldHistory,
            stations: newStations
        };
    }

    function buildUrlMap() {
        urlToIdMap = {};
        for (const [id, station] of Object.entries(historyCache.stations)) {
            if (station.url) {
                urlToIdMap[station.url] = id;
            }
        }
    }

    async function loadHistory() {
        try {
            const historyStr = localStorage.getItem(HISTORY_KEY);
            if (!historyStr) return { stations: {} };
            const history = JSON.parse(historyStr);
            if (history.activeStationUrl !== undefined) {
                activeStationUrl = history.activeStationUrl;
            }
            if (isOldFormat(history)) {
                const migrated = migrateOldHistory(history);
                await saveHistoryDirect(migrated);
                return migrated;
            }
            return { stations: history.stations || {} };
        } catch (e) {
            const errType = e?.name || 'UnknownError';
            const ctx = { key: HISTORY_KEY, type: errType };
            if (errType === 'SyntaxError') ctx.reason = 'corrupt-json';
            if (errType === 'QuotaExceededError' || e?.code === 22) ctx.reason = 'quota-exceeded';
            logError(ErrorCode.STORAGE_READ, e, ctx);
            return { stations: {} };
        }
    }

    async function saveHistoryDirect(history) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            logStorageError(ErrorCode.STORAGE_WRITE, e, HISTORY_KEY);
        }
    }

    async function saveHistory() {
        const dataToSave = {
            ...historyCache,
            activeStationUrl: activeStationUrl
        };
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            logStorageError(ErrorCode.STORAGE_WRITE, e, HISTORY_KEY);
        }
    }

    function stopAndFinalizeSession(station, timestamp) {
        const openSessionIndex = station.sessions.findIndex(s => s.end === null);
        if (openSessionIndex === -1) return;
        
        const currentSession = station.sessions[openSessionIndex];
        currentSession.end = timestamp;
        const duration = currentSession.end - currentSession.start;
        
        if (duration < 1000) {
            station.sessions.splice(openSessionIndex, 1);
        }
    }

    async function startStation(url, name, options = {}) {
        if (initPromise) await initPromise;
        const now = Date.now();
        
        if (activeStationUrl !== null && activeStationUrl !== url) {
            const prevStationId = urlToIdMap[activeStationUrl];
            if (prevStationId) {
                stopAndFinalizeSession(historyCache.stations[prevStationId], now);
            }
        }
        
        let stationId = urlToIdMap[url];
        if (!stationId) {
            stationId = generateUUID();
            historyCache.stations[stationId] = {
                url,
                name,
                sessions: [],
                favicon: options.favicon
            };
            urlToIdMap[url] = stationId;
        }
        
        const station = historyCache.stations[stationId];
        station.name = name;
        if (options.favicon) station.favicon = options.favicon;
        
        const openSession = station.sessions.find(s => s.end === null);
        if (openSession) {
            stopAndFinalizeSession(station, now);
        }
        
        station.sessions.unshift({ start: now, end: null });
        activeStationUrl = url;
        await saveHistory();
        invalidateCache();
    }

    async function stopStation(url) {
        if (initPromise) await initPromise;
        const stationId = urlToIdMap[url];
        if (!stationId) return;
        const station = historyCache.stations[stationId];
        if (!station) return;
        
        stopAndFinalizeSession(station, Date.now());
        if (activeStationUrl === url) {
            activeStationUrl = null;
        }
        await saveHistory();
        invalidateCache();
    }

    async function pruneHistory(isInternal = false) {
        if (!isInternal && initPromise) await initPromise;
        const history = historyCache;
        const now = Date.now();
        const expiryLimit = now - EXPIRY_TIME_MS;
        let hasChanged = false;

        let mostRecentOpenStationUrl = null;
        let mostRecentOpenTime = 0;

        for (const [id, station] of Object.entries(history.stations)) {
            let lastPlayed = 0;
            let validSessions = [];

            for (const session of station.sessions) {
                const time = session.end !== null ? session.end : session.start;
                if (time > lastPlayed) {
                    lastPlayed = time;
                }

                if (session.end === null && session.start > mostRecentOpenTime) {
                    mostRecentOpenTime = session.start;
                    mostRecentOpenStationUrl = station.url;
                }

                if (session.end === null || session.end > expiryLimit) {
                    validSessions.push(session);
                }
            }

            if (validSessions.length !== station.sessions.length) {
                station.sessions = validSessions;
                hasChanged = true;
            }

            if (validSessions.length === 0 && lastPlayed < expiryLimit) {
                delete history.stations[id];
                delete urlToIdMap[station.url];
                hasChanged = true;
            } else {
                // Finalize stale open sessions for any station other than the most recently opened one
                if (station.url !== mostRecentOpenStationUrl) {
                    for (const session of station.sessions) {
                        if (session.end === null) {
                            stopAndFinalizeSession(station, now);
                            hasChanged = true;
                        }
                    }
                }
            }
        }

        if (mostRecentOpenStationUrl) {
            activeStationUrl = mostRecentOpenStationUrl;
        }

        if (hasChanged) {
            await saveHistory();
            invalidateCache();
        }
    }

    function invalidateCache() {
        isCacheValid = false;
    }

    function computeLastStations() {
        return Object.values(historyCache.stations)
            .map(station => {
                let totalDurationMs = 0;
                let playCount = 0;
                let lastPlayed = 0;

                for (const session of station.sessions) {
                    const start = session.start;
                    const end = session.end;
                    const hasEnd = end !== null;
                    const time = hasEnd ? end : start;

                    if (time > lastPlayed) {
                        lastPlayed = time;
                    }

                    if (hasEnd) {
                        totalDurationMs += end - start;
                        playCount++;
                    }
                }

                return {
                    displayName: station.name,
                    details: {
                        favicon: station.favicon,
                        playCount,
                        totalDurationMs,
                        lastPlayed
                    }
                };
            })
            .sort((a, b) => b.details.lastPlayed - a.details.lastPlayed);
    }

    async function getLastStations() {
        if (initPromise) await initPromise;
        if (!isCacheValid) {
            stationsCache = computeLastStations();
            isCacheValid = true;
        }
        return stationsCache;
    }

    async function init() {
        historyCache = await loadHistory();
        buildUrlMap();
        await pruneHistory(true);
    }

    initPromise = init();

    return { startStation, stopStation, getLastStations, pruneHistory, init };
})();
