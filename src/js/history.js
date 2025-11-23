const StationHistory = (() => {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    let historyCache = null;

    function loadHistory() {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (!historyStr) {
            return { version: 2, stations: {} };
        }
        
        try {
            return JSON.parse(historyStr);
        } catch (e) {
            console.error("Fehler beim Parsen des Verlaufs, setze zurück:", e);
            return { version: 2, stations: {} };
        }
    }

    function saveHistory() {
        if (historyCache) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache));
        }
    }

    function getHistory() {
        return historyCache;
    }

    function stopAndFinalizeSession(station, timestamp) {
        if (!station) return;
        
        const openSessionIndex = station.sessions.findIndex(s => s.end === null);
        if (openSessionIndex === -1) return;

        const session = station.sessions[openSessionIndex];
        session.end = timestamp;
        const duration = session.end - session.start;
        
        if (duration > 1000) {
            station.totalDurationMs += duration;
            station.playCount++;
            station.lastPlayed = timestamp;
        } else {
            station.sessions.splice(openSessionIndex, 1);
        }
    }

    function startStation(url, name, options = {}) {
        const history = getHistory();
        const now = Date.now();
        for (const stationUrl in history.stations) {
            if (stationUrl !== url) {
                stopAndFinalizeSession(history.stations[stationUrl], now);
            }
        }
        
        if (!history.stations[url]) {
            history.stations[url] = {
                url: url,
                name: name,
                sessions: [],
                totalDurationMs: 0,
                playCount: 0,
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
        }

        station.sessions.unshift({
            start: now,
            end: null
        });

        saveHistory();
    }

    function stopStation(url) {
        const history = getHistory();
        const now = Date.now();

        const station = history.stations[url];
        if (!station) return;

        stopAndFinalizeSession(station, now);
        saveHistory();
    }

    function pruneHistory() {
        const history = getHistory();
        const now = Date.now();
        const expiryLimit = now - EXPIRY_TIME_MS;
        
        let hasChanged = false;

        for (const url in history.stations) {
            const station = history.stations[url];
            
            const validSessions = station.sessions.filter(s => 
                s.end === null || s.end > expiryLimit
            );
            
            if (validSessions.length < station.sessions.length) {
                station.sessions = validSessions;
                hasChanged = true;
            }

            if (station.lastPlayed < expiryLimit && station.sessions.length === 0) {
                delete history.stations[url];
                hasChanged = true;
            }
        }

        if (hasChanged) {
            saveHistory();
        }
    }

    function getLastStations() {
        const history = getHistory();
        
        const sortedStations = Object.values(history.stations).sort((a, b) => {
            return b.lastPlayed - a.lastPlayed;
        });

        return sortedStations.map(station => {
            return {
                displayName: station.name, 
                details: {
                    url: station.url,
                    favicon: station.favicon,
                    playCount: station.playCount,
                    totalDurationMs: station.totalDurationMs,
                    lastPlayed: station.lastPlayed
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