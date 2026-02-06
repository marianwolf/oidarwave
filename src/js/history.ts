/**
 * Station History - Verwaltet die Wiedergabe-Historie für Radiosender
 */

import { Station, StationHistoryData, StationOptions } from '../types';

/**
 * Station History Module - IIFE für Kapselung
 */
const StationHistory = (() => {
    const HISTORY_KEY = 'station_history';
    const EXPIRY_DAYS = 90;
    const EXPIRY_TIME_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const JSON_INDENTATION = 2;
    let historyCache: StationHistoryData;

    /**
     * Lädt die History aus dem localStorage
     */
    function loadHistory(): StationHistoryData {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (!historyStr) {
            return { version: 1, stations: {} };
        }
        try {
            const history = JSON.parse(historyStr);
            return { 
                version: history.version || 1, 
                stations: history.stations || {} 
            };
        } catch (e) {
            console.error("Fehler beim Parsen des Verlaufs, setze zurück:", e);
            return { version: 1, stations: {} };
        }
    }

    /**
     * Speichert die History im localStorage
     */
    function saveHistory(): void {
        if (historyCache) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache, null, JSON_INDENTATION));
        }
    }

    /**
     * Beendet eine Session und finalisiert die Statistiken
     */
    function stopAndFinalizeSession(station: Station, timestamp: number): void {
        const openSessionIndex = station.sessions.findIndex((s: { end: number | null }) => s.end === null);
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

    /**
     * Schließt alle anderen offenen Sessions
     */
    function closeOtherSessions(excludeUrl: string, timestamp: number): void {
        const history = historyCache;
        for (const station of Object.values(history.stations)) {
            if ((station as Station).url !== excludeUrl) {
                stopAndFinalizeSession(station as Station, timestamp);
            }
        }
    }

    /**
     * Startet die Wiedergabe einer Station
     */
    function startStation(url: string, name: string, options: StationOptions = {}): void {
        const history = historyCache;
        const now = Date.now();
        closeOtherSessions(url, now);
        
        if (!history.stations[url]) {
            history.stations[url] = {
                name,
                sessions: [],
                totalDurationMs: 0,
                playCount: 0,
                lastPlayed: now,
                url
            };
        }
        
        const station = history.stations[url];
        station.name = name;
        if (options.favicon) {
            station.favicon = options.favicon;
        }
        
        const openSession = station.sessions.find((s: { end: number | null }) => s.end === null);
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

    /**
     * Stoppt die Wiedergabe einer Station
     */
    function stopStation(url: string): void {
        const station = historyCache.stations[url];
        if (!station) return;
        stopAndFinalizeSession(station, Date.now());
        saveHistory();
    }

    /**
     * Entfernt abgelaufene Einträge aus der History
     */
    function pruneHistory(): void {
        const history = historyCache;
        const now = Date.now();
        const expiryLimit = now - EXPIRY_TIME_MS;
        let hasChanged = false;
        
        for (const [url, station] of Object.entries(history.stations)) {
            const validSessions = station.sessions.filter((s: { end: number | null }) =>
                s.end === null || s.end > expiryLimit
            );
            if (validSessions.length < station.sessions.length) {
                station.sessions = validSessions as { start: number; end: number | null }[];
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

    /**
     * Gibt die zuletzt gespielten Stationen zurück
     */
    function getLastStations(): { displayName: string; details: Pick<Station, 'favicon' | 'playCount' | 'totalDurationMs' | 'lastPlayed'> }[] {
        const history = historyCache;
        const sortedStations = Object.values(history.stations).sort((a: Station, b: Station) =>
            b.lastPlayed - a.lastPlayed
        );
        return sortedStations.map((station: Station) => {
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

    // Initialisierung
    historyCache = loadHistory();
    pruneHistory();

    // Öffentliche API
    return {
        startStation,
        stopStation,
        getLastStations,
        pruneHistory
    };
})();

// Export für externe Verwendung
export default StationHistory;
export { StationHistory };
