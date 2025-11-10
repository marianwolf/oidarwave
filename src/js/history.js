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

    function startStation() {
        const starttime = Date.now();
        return starttime;
    }

    function stopStation(url) {
        let history = getHistory();
        const now = Date.now();

        const itemIndex = history.findIndex(item => 
            item.url === url && item.durationMs === 0
        );

        if (itemIndex > -1) {
            const item = history[itemIndex];

            item.expiry = now + EXPIRY_TIME_MS;
            item.startTimestamp = startStation();
            item.durationMs = now - item.startTimestamp;
            item.endTimestamp = now;
            history[itemIndex] = item;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
    }

    function getLastStations() {
        return getHistory();
    }

    return {
        startStation,
        stopStation,
        getLastStations
    };
})();