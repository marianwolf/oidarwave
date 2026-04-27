/**
 * favorite.js - Verwaltung von Benutzerfavoriten und Präferenzen
 * Nutzt den bestehenden Verlauf aus localStorage
 */
const FavoriteManager = (() => {
    const FAVORITES_KEY = 'user_favorites';
    const HISTORY_KEY = 'station_history';
    
    const defaultPreferences = {
        version: 1,
        favoriteStation: null,
        favoriteStationName: null,
        lastPlayedStation: null,
        lastPlayedStationName: null,
        totalPlayCount: 0,
        totalStations: 0,
        lastUpdated: Date.now()
    };
    
    let favoritesCache;
    let preferencesCache;
    let favoriteIdsSet; // O(1) Lookup für isFavorite()

    function loadFavorites() {
        try {
            const favoritesStr = localStorage.getItem(FAVORITES_KEY);
            if (!favoritesStr) {
                return { version: 1, favorites: [], preferences: {} };
            }
            const favorites = JSON.parse(favoritesStr);
            return {
                version: favorites.version || 1,
                favorites: favorites.favorites || [],
                preferences: favorites.preferences || {}
            };
        } catch (e) {
            console.error('Fehler beim Laden der Favoriten:', e);
            return { version: 1, favorites: [], preferences: {} };
        }
    }

    function saveFavorites() {
        if (favoritesCache) {
            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesCache));
            } catch (e) {
                console.error('Fehler beim Speichern der Favoriten:', e);
            }
        }
    }

    function loadPreferencesFromHistory() {
        try {
            const historyStr = localStorage.getItem(HISTORY_KEY);
            if (!historyStr) {
                return { ...defaultPreferences };
            }
            const history = JSON.parse(historyStr);
            const stations = Object.values(history.stations || {});
            
            if (stations.length === 0) {
                return { ...defaultPreferences };
            }
            
            // Einmal sortieren: Erst nach playCount, dann nach lastPlayed
            // Wir berechnen beide Metriken in einem Durchlauf
            let mostPlayed = stations[0];
            let lastPlayed = stations[0];
            
            for (let i = 1; i < stations.length; i++) {
                const station = stations[i];
                const pC = station.playCount || 0;
                const mPC = mostPlayed.playCount || 0;
                
                if (pC > mPC || (pC === mPC && (station.lastPlayed || 0) > (mostPlayed.lastPlayed || 0))) {
                    mostPlayed = station;
                }
                
                const lP = station.lastPlayed || 0;
                const mLP = lastPlayed.lastPlayed || 0;
                
                if (lP > mLP) {
                    lastPlayed = station;
                }
            }
            
            return {
                version: history.version || 1,
                favoriteStation: mostPlayed?.url || null,
                favoriteStationName: mostPlayed?.name || null,
                lastPlayedStation: lastPlayed?.url || null,
                lastPlayedStationName: lastPlayed?.name || null,
                totalPlayCount: stations.reduce((sum, s) => sum + (s.playCount || 0), 0),
                totalStations: stations.length,
                lastUpdated: Date.now()
            };
        } catch (e) {
            console.error("Fehler beim Laden der Präferenzen aus dem Verlauf:", e);
            return { ...defaultPreferences };
        }
    }

    function updateFavoriteIdsSet() {
        favoriteIdsSet = new Set(favoritesCache.favorites.map(f => f.id));
    }

    function addFavorite(id, name, data = {}) {
        if (favoriteIdsSet.has(id)) {
            console.warn("Favorit existiert bereits:", id);
            return false;
        }
        favoritesCache.favorites.push({ id, name, data, addedAt: Date.now() });
        updateFavoriteIdsSet();
        saveFavorites();
        return true;
    }

    function removeFavorite(id) {
        const index = favoritesCache.favorites.findIndex(f => f.id === id);
        if (index === -1) {
            console.warn("Favorit nicht gefunden:", id);
            return false;
        }
        favoritesCache.favorites.splice(index, 1);
        updateFavoriteIdsSet();
        saveFavorites();
        return true;
    }

    function isFavorite(id) {
        return favoriteIdsSet.has(id);
    }

    function getAllFavorites() {
        return favoritesCache.favorites;
    }

    function refreshPreferences() {
        preferencesCache = loadPreferencesFromHistory();
        return preferencesCache;
    }

    function setPreference(key, value) {
        (favoritesCache.preferences || (favoritesCache.preferences = {}))[key] = value;
        saveFavorites();
    }

    function getPreference(key, defaultValue = null) {
        if (favoritesCache.preferences && key in favoritesCache.preferences) return favoritesCache.preferences[key];
        if (preferencesCache && key in preferencesCache) return preferencesCache[key];
        return defaultValue;
    }

    function getAllPreferences() {
        return { ...preferencesCache, ...(favoritesCache.preferences || {}) };
    }

    function setPreferences(prefs) {
        favoritesCache.preferences = favoritesCache.preferences || {};
        Object.assign(favoritesCache.preferences, prefs);
        saveFavorites();
    }

    function clearFavorites() {
        favoritesCache.favorites = [];
        saveFavorites();
    }

    function resetPreferences() {
        favoritesCache.preferences = {};
        saveFavorites();
    }

    // Initialisierung
    favoritesCache = loadFavorites();
    updateFavoriteIdsSet(); // Set für O(1) Lookup initialisieren
    preferencesCache = loadPreferencesFromHistory();

    return {
        addFavorite,
        removeFavorite,
        isFavorite,
        getAllFavorites,
        clearFavorites,
        refreshPreferences,
        setPreference,
        getPreference,
        setPreferences,
        getAllPreferences,
        resetPreferences
    };
})();