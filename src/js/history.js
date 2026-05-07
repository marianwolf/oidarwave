const HISTORY_KEY = 'station_history';
const EXPIRY_DAYS = 90;
const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

let historyCache;
let stationsCache = null;
let isCacheValid = false;
let activeStationUrl = null;

async function loadHistory() {
    // Try Redis first (via IPC)
    try {
        if (window.electronAPI && window.electronAPI.history) {
            const redisData = await window.electronAPI.history.getHistory();
            if (redisData) {
                if (redisData.activeStationUrl !== undefined) {
                    activeStationUrl = redisData.activeStationUrl;
                }
                return { stations: redisData.stations || {} };
            }
        }
    } catch (e) {
        console.error('Fehler beim Laden aus Redis:', e);
    }
    // Fallback to localStorage
    try {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (!historyStr) return { stations: {} };
        const history = JSON.parse(historyStr);
        if (history.activeStationUrl !== undefined) {
            activeStationUrl = history.activeStationUrl;
        }
        return { stations: history.stations || {} };
    } catch (e) {
        console.error('Fehler beim Laden des Verlaufs:', e);
        return { stations: {} };
    }
}

async function saveHistory() {
    const dataToSave = {
        ...historyCache,
        activeStationUrl: activeStationUrl
    };
    // Try Redis first (via IPC)
    try {
        if (window.electronAPI && window.electronAPI.history) {
            await window.electronAPI.history.saveHistory(dataToSave);
        }
    } catch (e) {
        console.error('Fehler beim Speichern in Redis:', e);
    }
    // Also save to localStorage as backup
    try {
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

async function startStation(url, name, options = {}) {
    const now = Date.now();
    
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
    const station = historyCache.stations[url];
    if (!station) return;
    
    stopAndFinalizeSession(station, Date.now());
    if (activeStationUrl === url) {
        activeStationUrl = null;
    }
    await saveHistory();
    invalidateCache();
}

async function pruneHistory() {
    const history = historyCache;
    const now = Date.now();
    const expiryLimit = now - EXPIRY_TIME_MS;
    let hasChanged = false;

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

    for (const [url, station] of Object.entries(history.stations)) {
        for (const session of station.sessions) {
            if (session.end === null && url !== mostRecentOpenStationUrl) {
                stopAndFinalizeSession(station, now);
                hasChanged = true;
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

function getLastStations() {
    if (!isCacheValid) {
        stationsCache = computeLastStations();
        isCacheValid = true;
    }
    return stationsCache;
}

async function init() {
    historyCache = await loadHistory();
    pruneHistory();
}

const StationHistory = { startStation, stopStation, getLastStations, pruneHistory, init };

init();