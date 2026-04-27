document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const HISTORY_KEY = 'station_history';

    function downloadHistory() {
        try {
            const rawData = localStorage.getItem(HISTORY_KEY);
            if (!rawData) return;
            
            const now = new Date();
            const filename = `${HISTORY_KEY}_${now.toISOString().replace(/[T:]/g, '-').slice(0, 19)}.json`;
            const blob = new Blob([rawData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download fehlgeschlagen:', e);
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === 's' && !event.target.matches('input, textarea')) {
            event.preventDefault();
            event.stopPropagation();
            downloadHistory();
        }
    });
});