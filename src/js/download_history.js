document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const HISTORY_KEY = 'station_history';

    function triggerDownload(data, key) {
        const now = new Date();
        const filename = `${key}_${now.toISOString().replace('T', '-').replace(/:/g, '-').slice(0, 19)}.json`;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadHistory() {
        const rawData = localStorage.getItem(HISTORY_KEY);
        if (!rawData) return;
        triggerDownload(rawData, HISTORY_KEY);
    }

    document.addEventListener('keydown', (event) => {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isHKey = event.key.toLowerCase() === 'h';
        if (isCtrlOrCmd && isHKey) {
            event.preventDefault();
            downloadHistory();
        }
    });
});