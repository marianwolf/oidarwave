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
            
            // Sortiere einmal absteigend nach playCount und lastPlayed
            stations.sort((a, b) => (b.playCount || 0) - (a.playCount || 0) || (b.lastPlayed || 0) - (a.lastPlayed || 0));
            
            const mostPlayed = stations[0];
            const lastPlayed = [...stations].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))[0];
            
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

    function addFavorite(id, name, data = {}) {
        if (favoritesCache.favorites.some(f => f.id === id)) {
            console.warn("Favorit existiert bereits:", id);
            return false;
        }
        favoritesCache.favorites.push({ id, name, data, addedAt: Date.now() });
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
        (favoritesCache.preferences || (favoritesCache.preferences = {}))[key] = value;
        saveFavorites();
    }

    function getPreference(key, defaultValue = null) {
        if (preferencesCache?.[key] !== undefined) return preferencesCache[key];
        if (favoritesCache.preferences?.[key] !== undefined) return favoritesCache.preferences[key];
        return defaultValue;
    }

    function getAllPreferences() {
        return { ...preferencesCache, ...(favoritesCache.preferences || {}) };
    }

    function setPreferences(prefs) {
        (favoritesCache.preferences || (favoritesCache.preferences = {}));
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