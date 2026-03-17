const StationHistory = (() => {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    let historyCache;

    function loadHistory() {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (!historyStr) {
            return { stations: {} };
        }
        try {
            const history = JSON.parse(historyStr);
            return { stations: history.stations || {} };
        } catch (e) {
            console.error("Fehler beim Parsen des Verlaufs, setze zurück:", e);
            return { stations: {} };
        }
    }

    function saveHistory() {
        if (historyCache) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache));
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

    function closeOtherSessions(excludeUrl, timestamp) {
        for (const station of Object.values(historyCache.stations)) {
            if (station.url !== excludeUrl) {
                stopAndFinalizeSession(station, timestamp);
            }
        }
    }

    function startStation(url, name, options = {}) {
        const history = historyCache;
        const now = Date.now();
        closeOtherSessions(url, now);
        
        if (!history.stations[url]) {
            history.stations[url] = {
                name,
                sessions: [],
                favicon: options.favicon
            };
        }
        
        const station = history.stations[url];
        station.name = name;
        if (options.favicon) station.favicon = options.favicon;
        
        const openSession = station.sessions.find(s => s.end === null);
        if (openSession) {
            console.warn("startStation: Station hatte bereits eine offene Session. Schließe sie.", url);
            openSession.end = now;
            stopAndFinalizeSession(station, now);
        }
        
        station.sessions.unshift({ start: now, end: null });
        saveHistory();
    }

    function stopStation(url) {
        const station = historyCache.stations[url];
        if (!station) return;
        stopAndFinalizeSession(station, Date.now());
        saveHistory();
    }

    function pruneHistory() {
        const history = historyCache;
        const now = Date.now();
        const expiryLimit = now - EXPIRY_TIME_MS;
        let hasChanged = false;
        
        for (const [url, station] of Object.entries(history.stations)) {
            const validSessions = station.sessions.filter(s => s.end === null || s.end > expiryLimit);
            
            if (validSessions.length < station.sessions.length) {
                station.sessions = validSessions;
                hasChanged = true;
            }
            
            let lastPlayed = 0;
            for (const session of station.sessions) {
                const time = session.end !== null ? session.end : session.start;
                if (time > lastPlayed) {
                    lastPlayed = time;
                }
            }
            
            if (validSessions.length === 0 && lastPlayed < expiryLimit) {
                delete history.stations[url];
                hasChanged = true;
            }
        }
        
        if (hasChanged) saveHistory();
    }

    function getLastStations() {
        return Object.values(historyCache.stations)
            .map(station => {
                let totalDurationMs = 0;
                let playCount = 0;
                let lastPlayed = 0;
                for (const session of station.sessions) {
                    if (session.end !== null) {
                        const duration = session.end - session.start;
                        totalDurationMs += duration;
                        playCount++;
                    }
                    const time = session.end !== null ? session.end : session.start;
                    if (time > lastPlayed) {
                        lastPlayed = time;
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

    historyCache = loadHistory();
    pruneHistory();
    
    return { startStation, stopStation, getLastStations, pruneHistory };
})();