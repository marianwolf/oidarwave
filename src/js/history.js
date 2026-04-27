const StationHistory = (() => {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    let historyCache;
    let stationsCache = null;
    let isCacheValid = false;
    let activeStationUrl = null;

    function loadHistory() {
        try {
            const historyStr = localStorage.getItem(HISTORY_KEY);
            if (!historyStr) return { stations: {} };
            const history = JSON.parse(historyStr);
            // Restore activeStationUrl if present in saved data
            if (history.activeStationUrl !== undefined) {
                activeStationUrl = history.activeStationUrl;
            }
            return { stations: history.stations || {} };
        } catch (e) {
            console.error('Fehler beim Laden des Verlaufs:', e);
            return { stations: {} };
        }
    }

    function saveHistory() {
        try {
            // Include activeStationUrl in the saved data
            const dataToSave = {
                ...historyCache,
                activeStationUrl: activeStationUrl
            };
            localStorage.setItem(HISTORY_KEY, JSON.stringify(dataToSave));
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
            stopAndFinalizeSession(station, now);
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

        // Find the most recently played station with an open session
        let mostRecentOpenStationUrl = null;
        let mostRecentOpenTime = 0;

        for (const [url, station] of Object.entries(history.stations)) {
            let lastPlayed = 0;
            let validSessions = [];

            for (const session of station.sessions) {
                const time = session.end !== null ? session.end : session.start;
                if (time > lastPlayed) {
                    lastPlayed = time;
                }

                // Track the most recent open session
                if (session.end === null && session.start > mostRecentOpenTime) {
                    mostRecentOpenTime = session.start;
                    mostRecentOpenStationUrl = url;
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

        // Close any open sessions that aren't in the most recently played station
        for (const [url, station] of Object.entries(history.stations)) {
            for (const session of station.sessions) {
                if (session.end === null && url !== mostRecentOpenStationUrl) {
                    stopAndFinalizeSession(station, now);
                    hasChanged = true;
                }
            }
        }

        // If we found a station with an open session, make it active
        if (mostRecentOpenStationUrl) {
            activeStationUrl = mostRecentOpenStationUrl;
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