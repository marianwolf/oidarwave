/**
 * favorite.js - Verwaltung von Benutzerfavoriten und Präferenzen
 * Nutzt den bestehenden Verlauf aus localStorage
 */
const FavoriteManager = (() => {
    const FAVORITES_KEY = 'user_favorites';
    const HISTORY_KEY = 'station_history';
    let favoritesCache;
    let preferencesCache;

    function loadFavorites() {
        const favoritesStr = localStorage.getItem(FAVORITES_KEY);
        if (!favoritesStr) {
            return { version: 1, favorites: [], preferences: {} };
        }
        try {
            const favorites = JSON.parse(favoritesStr);
            return {
                version: favorites.version || 1,
                favorites: favorites.favorites || [],
                preferences: favorites.preferences || {}
            };
        } catch (e) {
            console.error("Fehler beim Parsen der Favoriten, setze zurück:", e);
            return { version: 1, favorites: [], preferences: {} };
        }
    }

    function saveFavorites() {
        if (favoritesCache) {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesCache));
        }
    }

    function loadPreferencesFromHistory() {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (!historyStr) {
            return getDefaultPreferences();
        }
        try {
            const history = JSON.parse(historyStr);
            const stations = history.stations || {};
            const stationList = Object.values(stations);
            
            if (stationList.length === 0) {
                return getDefaultPreferences();
            }
            
            // Meistgespielte Station finden
            const mostPlayed = stationList.sort((a, b) => 
                (b.playCount || 0) - (a.playCount || 0)
            )[0];
            
            // Zuletzt gespielte Station
            const lastPlayed = stationList.sort((a, b) => 
                (b.lastPlayed || 0) - (a.lastPlayed || 0)
            )[0];
            
            return {
                version: history.version || 1,
                favoriteStation: mostPlayed ? mostPlayed.url : null,
                favoriteStationName: mostPlayed ? mostPlayed.name : null,
                lastPlayedStation: lastPlayed ? lastPlayed.url : null,
                lastPlayedStationName: lastPlayed ? lastPlayed.name : null,
                totalPlayCount: stationList.reduce((sum, s) => sum + (s.playCount || 0), 0),
                totalStations: stationList.length,
                lastUpdated: Date.now()
            };
        } catch (e) {
            console.error("Fehler beim Laden der Präferenzen aus dem Verlauf:", e);
            return getDefaultPreferences();
        }
    }

    function getDefaultPreferences() {
        return {
            version: 1,
            favoriteStation: null,
            favoriteStationName: null,
            lastPlayedStation: null,
            lastPlayedStationName: null,
            totalPlayCount: 0,
            totalStations: 0,
            lastUpdated: Date.now()
        };
    }

    function addFavorite(id, name, data = {}) {
        const favorites = favoritesCache.favorites;
        if (favorites.some(f => f.id === id)) {
            console.warn("Favorit existiert bereits:", id);
            return false;
        }
        favorites.push({
            id,
            name,
            data,
            addedAt: Date.now()
        });
        saveFavorites();
        return true;
    }

    function removeFavorite(id) {
        const favorites = favoritesCache.favorites;
        const index = favorites.findIndex(f => f.id === id);
        if (index === -1) {
            console.warn("Favorit nicht gefunden:", id);
            return false;
        }
        favorites.splice(index, 1);
        saveFavorites();
        return true;
    }

    function isFavorite(id) {
        return favoritesCache.favorites.some(f => f.id === id);
    }

    function getAllFavorites() {
        return favoritesCache.favorites.map(f => ({
            id: f.id,
            name: f.name,
            data: f.data,
            addedAt: f.addedAt
        }));
    }

    function refreshPreferences() {
        preferencesCache = loadPreferencesFromHistory();
        return preferencesCache;
    }

    function setPreference(key, value) {
        if (!favoritesCache.preferences) {
            favoritesCache.preferences = {};
        }
        favoritesCache.preferences[key] = value;
        saveFavorites();
    }

    function getPreference(key, defaultValue = null) {
        // Zuerst in Präferenzen aus Verlauf suchen
        if (preferencesCache && preferencesCache[key] !== undefined) {
            return preferencesCache[key];
        }
        // Dann in benutzerdefinierten Einstellungen suchen
        if (favoritesCache.preferences && favoritesCache.preferences[key] !== undefined) {
            return favoritesCache.preferences[key];
        }
        return defaultValue;
    }

    function getAllPreferences() {
        return {
            ...preferencesCache,
            ...(favoritesCache.preferences || {})
        };
    }

    function setPreferences(prefs) {
        if (!favoritesCache.preferences) {
            favoritesCache.preferences = {};
        }
        for (const [key, value] of Object.entries(prefs)) {
            favoritesCache.preferences[key] = value;
        }
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
    preferencesCache = loadPreferencesFromHistory();

    return {
        // Favoriten
        addFavorite,
        removeFavorite,
        isFavorite,
        getAllFavorites,
        clearFavorites,
        // Präferenzen
        refreshPreferences,
        setPreference,
        getPreference,
        setPreferences,
        getAllPreferences,
        resetPreferences
    };
})();