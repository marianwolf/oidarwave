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
    let favoriteIdsSet;
    let favoriteUrlsMap;

    function isUrl(value) {
        return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
    }

    function isOldFavorite(favorite) {
        return !!favorite.id && isUrl(favorite.id);
    }

    function migrateOldFavorites(data) {
        if (!data.favorites) return data;
        const migrated = data.favorites.map(f => isOldFavorite(f)
            ? { id: generateUUID(), url: f.id, name: f.name, data: f.data, addedAt: f.addedAt }
            : f
        );
        return migrated;
    }

    function loadFavorites() {
        try {
            const favoritesStr = localStorage.getItem(FAVORITES_KEY);
            if (!favoritesStr) {
                return { version: 1, favorites: [], preferences: {} };
            }
            const favorites = JSON.parse(favoritesStr);
            const migrated = migrateOldFavorites(favorites);
            if (migrated !== favorites) {
                favoritesCache = migrated;
                saveFavoritesDirect(migrated);
            }
            return {
                version: migrated.version || 1,
                favorites: migrated.favorites || [],
                preferences: migrated.preferences || {}
            };
        } catch (e) {
            logError(ErrorCode.FAVORITE_LOAD, e, { source: 'loadFavorites' });
            return { version: 1, favorites: [], preferences: {} };
        }
    }

    function saveFavorites() {
        if (favoritesCache) {
            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesCache));
            } catch (e) {
                logError(ErrorCode.FAVORITE_SAVE, e, { source: 'saveFavorites' });
            }
        }
    }

    function saveFavoritesDirect(data) {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
        } catch (e) {
            logError(ErrorCode.FAVORITE_SAVE, e, { source: 'saveFavoritesDirect' });
        }
    }

    function updateFavoriteLookups() {
        favoriteIdsSet = new Set();
        favoriteUrlsMap = {};
        favoritesCache.favorites.forEach(f => {
            favoriteIdsSet.add(f.id);
            if (f.url) {
                favoriteUrlsMap[f.url] = f.id;
            }
        });
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
            logError(ErrorCode.FAVORITE_LOAD, e, { source: 'loadPreferencesFromHistory' });
            return { ...defaultPreferences };
        }
    }

    function addFavorite(name, data = {}, url = null) {
        const id = generateUUID();
        
        const favorite = { id, name, data, addedAt: Date.now() };
        if (url) {
            favorite.url = url;
        }
        
        if (favoriteIdsSet.has(id)) {
            logWarn(ErrorCode.FAVORITE_DUPLICATE_ID, null, { id });
            return false;
        }
        
        if (url && favoriteUrlsMap[url]) {
            logWarn(ErrorCode.FAVORITE_DUPLICATE_URL, null, { url });
            return false;
        }
        
        favoritesCache.favorites.push(favorite);
        updateFavoriteLookups();
        saveFavorites();
        return true;
    }

    function removeFavorite(urlOrId) {
        let index;
        if (isUrl(urlOrId)) {
            const id = favoriteUrlsMap[urlOrId];
            index = favoritesCache.favorites.findIndex(f => f.id === id);
        } else {
            index = favoritesCache.favorites.findIndex(f => f.id === urlOrId);
        }

        if (index === -1) {
            logWarn(ErrorCode.FAVORITE_NOT_FOUND, null, { urlOrId });
            return false;
        }
        favoritesCache.favorites.splice(index, 1);
        updateFavoriteLookups();
        saveFavorites();
        return true;
    }

    function isFavorite(urlOrId) {
        return isUrl(urlOrId) ? !!favoriteUrlsMap[urlOrId] : favoriteIdsSet.has(urlOrId);
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
        if (favoritesCache.preferences && Object.prototype.hasOwnProperty.call(favoritesCache.preferences, key)) return favoritesCache.preferences[key];
        if (preferencesCache && Object.prototype.hasOwnProperty.call(preferencesCache, key)) return preferencesCache[key];
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

    favoritesCache = loadFavorites();
    updateFavoriteLookups();
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
