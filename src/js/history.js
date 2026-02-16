const StationHistory = (() => {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    let historyCache;

    function loadHistory() {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (!historyStr) {
            return { version: 1, stations: {} };
        }
        try {
            const history = JSON.parse(historyStr);
            return { version: history.version || 1, stations: history.stations || {} };
        } catch (e) {
            console.error("Fehler beim Parsen des Verlaufs, setze zurück:", e);
            return { version: 1, stations: {} };
        }
    }

    function saveHistory() {
        if (historyCache) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache));
        }
    }

    function stopAndFinalizeSession(station, timestamp) {
        const openSessionIndex = station.sessions.findIndex(s => s.end === null);
        if (openSessionIndex === -1) {
            return;
        }
        const currentSession = station.sessions[openSessionIndex];
        currentSession.end = timestamp;
        const duration = currentSession.end - currentSession.start;
        if (duration < 1000) {
            station.sessions.splice(openSessionIndex, 1);
        } else {
            station.totalDurationMs += duration;
            station.playCount++;
            station.lastPlayed = timestamp;
        }
    }

    function closeOtherSessions(excludeUrl, timestamp) {
        const history = historyCache;
        for (const station of Object.values(history.stations)) {
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
                totalDurationMs: 0,
                playCount: 0,
                lastPlayed: now
            };
        }
        const station = history.stations[url];
        station.name = name;
        if (options.favicon) {
            station.favicon = options.favicon;
        }
        const openSession = station.sessions.find(s => s.end === null);
        if (openSession) {
             console.warn("startStation: Station hatte bereits eine offene Session. Schließe sie.", url);
             openSession.end = now;
             stopAndFinalizeSession(station, now);
        }
        station.sessions.unshift({
            start: now,
            end: null
        });
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
            const validSessions = station.sessions.filter(s =>
                s.end === null || s.end > expiryLimit
            );
            if (validSessions.length < station.sessions.length) {
                station.sessions = validSessions;
                hasChanged = true;
            }
            if (station.lastPlayed < expiryLimit && validSessions.length === 0) {
                delete history.stations[url];
                hasChanged = true;
            }
        }
        if (hasChanged) {
            saveHistory();
        }
    }

    function getLastStations() {
        const history = historyCache;
        const sortedStations = Object.values(history.stations).sort((a, b) =>
            b.lastPlayed - a.lastPlayed
        );
        return sortedStations.map(station => {
            const { name, favicon, playCount, totalDurationMs, lastPlayed } = station;
            return {
                displayName: name,
                details: {
                    favicon,
                    playCount,
                    totalDurationMs,
                    lastPlayed
                }
            };
        });
    }

    historyCache = loadHistory();
    pruneHistory();
    return {
        startStation,
        stopStation,
        getLastStations,
        pruneHistory
    };
})();