const StationHistory = (() => {
    const EXPIRY_TIME_MS = 90 * 24 * 60 * 60 * 1000;
    const HISTORY_KEY = 'history';

    function getHistory() {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        let history = historyStr ? JSON.parse(historyStr) : [];
        const now = Date.now();

        history = history.filter(item => now < item.expiry);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        return history;
    }

    function addStationToHistory(url, name) {
        let history = getHistory();
        const now = Date.now();
        const expiry = now + EXPIRY_TIME_MS;
        history = history.filter(item => item.url !== url);
        const newItem = { url, name, timestamp: now, expiry };
        history.unshift(newItem);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function getLastStations() {
        return getHistory();
    }

    return {
        addStationToHistory,
        getLastStations
    };
})();