const StationHistory = (() => {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    let historyCache = { stations: {} };
    let stationsCache = null;
    let isCacheValid = false;
    let activeStationUrl = null;

    console.log('=== LocalStorage Diagnose ===');
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`Key: ${key}`);
            console.log(`Value: ${value ? value.substring(0, 200) + (value.length > 200 ? '...' : '') : 'null'}`);
        }
    } catch (e) {
        console.warn('LocalStorage Zugriff fehlgeschlagen:', e);
    }
    console.log('===========================');
    
    function loadHistory() {
        try {
            const historyStr = localStorage.getItem(HISTORY_KEY);
            if (!historyStr) return { stations: {} };
            const history = JSON.parse(historyStr);
            return { stations: history.stations || {} };
        } catch (e) {
            console.error('Fehler beim Laden des Verlaufs:', e);
            return { stations: {} };
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache));
        } catch (e) {
            console.error('Fehler beim Speichern des Verlaufs:', e);
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

    function startStation(url, name, options = {}) {
        const now = Date.now();
        
        // Close previous active station if different
        if (activeStationUrl !== null && activeStationUrl !== url) {
            const prevStation = historyCache.stations[activeStationUrl];
            if (prevStation) {
                stopAndFinalizeSession(prevStation, now);
            }
        }
        
        if (!historyCache.stations[url]) {
            historyCache.stations[url] = {
                name,
                sessions: [],
                favicon: options.favicon
            };
        }
        
        const station = historyCache.stations[url];
        station.name = name;
        if (options.favicon) station.favicon = options.favicon;
        
        // Close any existing open session
        const openSession = station.sessions.find(s => s.end === null);
        if (openSession) {
            openSession.end = now;
        }
        
        station.sessions.unshift({ start: now, end: null });
        activeStationUrl = url;
        saveHistory();
        invalidateCache();
    }

    function stopStation(url) {
        const station = historyCache.stations[url];
        if (!station) return;
        
        stopAndFinalizeSession(station, Date.now());
        if (activeStationUrl === url) {
            activeStationUrl = null;
        }
        saveHistory();
        invalidateCache();
    }

    function pruneHistory() {
        const history = historyCache;
        const now = Date.now();
        const expiryLimit = now - EXPIRY_TIME_MS;
        let hasChanged = false;

        for (const [url, station] of Object.entries(history.stations)) {
            let lastPlayed = 0;
            let validSessions = [];

            for (const session of station.sessions) {
                const time = session.end !== null ? session.end : session.start;
                if (time > lastPlayed) {
                    lastPlayed = time;
                }

                if (session.end === null) {
                    if (!activeStationUrl) {
                        activeStationUrl = url;
                    } else if (activeStationUrl !== url) {
                        session.end = now;
                        hasChanged = true;
                    }
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
                delete history.stations[url];
                hasChanged = true;
            }
        }

        if (hasChanged) {
            saveHistory();
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

    function getLastStations() {
        if (!isCacheValid) {
            stationsCache = computeLastStations();
            isCacheValid = true;
        }
        return stationsCache;
    }

    historyCache = loadHistory();
    pruneHistory();
    
    return { startStation, stopStation, getLastStations, pruneHistory };
})();