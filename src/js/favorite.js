;(function () {
    'use strict'

    const FAVORITES_KEY = 'user_favorites'

    const defaultPreferences = () => ({
        version: 1,
        favoriteStation: null,
        favoriteStationName: null,
        lastPlayedStation: null,
        lastPlayedStationName: null,
        totalPlayCount: 0,
        totalStations: 0,
        lastUpdated: Date.now(),
    })

    const storage = () => window.PlayerCore
    const historyKey = () => storage()?.HISTORY_KEY || 'station_history'
    const uuid = () => (typeof generateUUID === 'function' ? generateUUID() : `fav-${Date.now()}`)

    const FavoriteManager = (() => {
        let favoritesCache
        let preferencesCache
        let favoriteIdsSet
        let favoriteUrlsMap

        // --- Format & Migration ---

        function isUrl(value) {
            return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))
        }

        function migrateFavorite(favorite) {
            if (favorite.id && isUrl(favorite.id)) {
                return {
                    id: uuid(),
                    url: favorite.id,
                    name: favorite.name,
                    data: favorite.data,
                    addedAt: favorite.addedAt,
                }
            }
            return favorite
        }

        function migrateOldFavorites(data) {
            if (!data.favorites) return data
            const migrated = data.favorites.map(migrateFavorite)
            return migrated.some((f, i) => f !== data.favorites[i]) ? { ...data, favorites: migrated } : data
        }

        // --- Laden & Speichern (einzige Storage-Stelle dieses Moduls) ---

        function emptyFavorites() {
            return { version: 1, favorites: [], preferences: {} }
        }

        function loadFavorites() {
            const stored = storage()?.readJSON(FAVORITES_KEY, null)
            if (!stored) return emptyFavorites()
            const migrated = migrateOldFavorites(stored)
            if (migrated !== stored) saveFavoritesDirect(migrated)
            return {
                version: migrated.version || 1,
                favorites: migrated.favorites || [],
                preferences: migrated.preferences || {},
            }
        }

        function persist(cache) {
            storage()?.writeJSON(FAVORITES_KEY, cache)
        }

        function saveFavorites() {
            if (favoritesCache) persist(favoritesCache)
        }

        function saveFavoritesDirect(data) {
            persist(data)
        }

        function updateFavoriteLookups() {
            favoriteIdsSet = new Set()
            favoriteUrlsMap = {}
            favoritesCache.favorites.forEach((f) => {
                favoriteIdsSet.add(f.id)
                if (f.url) favoriteUrlsMap[f.url] = f.id
            })
        }

        // --- Präferenzen aus dem Verlauf ---

        function summarizeHistoryStations(stations) {
            let mostPlayed = stations[0]
            let lastPlayed = stations[0]
            for (let i = 1; i < stations.length; i += 1) {
                const station = stations[i]
                const playCount = station.playCount || 0
                const bestCount = mostPlayed.playCount || 0
                if (
                    playCount > bestCount ||
                    (playCount === bestCount && (station.lastPlayed || 0) > (mostPlayed.lastPlayed || 0))
                ) {
                    mostPlayed = station
                }
                if ((station.lastPlayed || 0) > (lastPlayed.lastPlayed || 0)) {
                    lastPlayed = station
                }
            }
            return { mostPlayed, lastPlayed }
        }

        function loadPreferencesFromHistory() {
            try {
                const history = storage()?.readJSON(historyKey(), null)
                const stations = Object.values(history?.stations || {})
                if (stations.length === 0) return defaultPreferences()
                const { mostPlayed, lastPlayed } = summarizeHistoryStations(stations)
                return {
                    version: history.version || 1,
                    favoriteStation: mostPlayed?.url || null,
                    favoriteStationName: mostPlayed?.name || null,
                    lastPlayedStation: lastPlayed?.url || null,
                    lastPlayedStationName: lastPlayed?.name || null,
                    totalPlayCount: stations.reduce((sum, s) => sum + (s.playCount || 0), 0),
                    totalStations: stations.length,
                    lastUpdated: Date.now(),
                }
            } catch (e) {
                window.logError?.(window.ErrorCode?.FAVORITE_LOAD, e, { source: 'loadPreferencesFromHistory' })
                return defaultPreferences()
            }
        }

        // --- Öffentliche API ---

        function addFavorite(name, data = {}, url = null) {
            const id = uuid()
            if (favoriteIdsSet.has(id)) {
                window.logWarn?.(window.ErrorCode?.FAVORITE_DUPLICATE_ID, null, { id })
                return false
            }
            if (url && favoriteUrlsMap[url]) {
                window.logWarn?.(window.ErrorCode?.FAVORITE_DUPLICATE_URL, null, { url })
                return false
            }
            const favorite = { id, name, data, addedAt: Date.now() }
            if (url) favorite.url = url
            favoritesCache.favorites.push(favorite)
            updateFavoriteLookups()
            saveFavorites()
            return true
        }

        function findFavoriteIndex(urlOrId) {
            if (isUrl(urlOrId)) {
                const id = favoriteUrlsMap[urlOrId]
                return favoritesCache.favorites.findIndex((f) => f.id === id)
            }
            return favoritesCache.favorites.findIndex((f) => f.id === urlOrId)
        }

        function removeFavorite(urlOrId) {
            const index = findFavoriteIndex(urlOrId)
            if (index === -1) {
                window.logWarn?.(window.ErrorCode?.FAVORITE_NOT_FOUND, null, { urlOrId })
                return false
            }
            favoritesCache.favorites.splice(index, 1)
            updateFavoriteLookups()
            saveFavorites()
            return true
        }

        function isFavorite(urlOrId) {
            return isUrl(urlOrId) ? !!favoriteUrlsMap[urlOrId] : favoriteIdsSet.has(urlOrId)
        }

        function getAllFavorites() {
            return favoritesCache.favorites
        }

        function refreshPreferences() {
            preferencesCache = loadPreferencesFromHistory()
            return preferencesCache
        }

        function ensurePreferencesObject() {
            return (favoritesCache.preferences ||= {})
        }

        function setPreference(key, value) {
            ensurePreferencesObject()[key] = value
            saveFavorites()
        }

        function getPreference(key, defaultValue = null) {
            if (favoritesCache.preferences && Object.prototype.hasOwnProperty.call(favoritesCache.preferences, key)) {
                return favoritesCache.preferences[key]
            }
            if (preferencesCache && Object.prototype.hasOwnProperty.call(preferencesCache, key)) {
                return preferencesCache[key]
            }
            return defaultValue
        }

        function getAllPreferences() {
            return { ...preferencesCache, ...(favoritesCache.preferences || {}) }
        }

        function setPreferences(prefs) {
            Object.assign(ensurePreferencesObject(), prefs)
            saveFavorites()
        }

        function clearFavorites() {
            favoritesCache.favorites = []
            updateFavoriteLookups()
            saveFavorites()
        }

        function resetPreferences() {
            favoritesCache.preferences = {}
            saveFavorites()
        }

        favoritesCache = loadFavorites()
        updateFavoriteLookups()
        preferencesCache = loadPreferencesFromHistory()

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
            resetPreferences,
        }
    })()

    if (typeof window !== 'undefined') {
        window.FavoriteManager = FavoriteManager
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FavoriteManager }
    }
})()
