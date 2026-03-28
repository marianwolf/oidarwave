document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const HISTORY_KEY = 'station_history';

    // DIAGNOSE: Log all localStorage keys and values
    console.log('=== LocalStorage Diagnose ===');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`Key: ${key}`);
        console.log(`Value: ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}`);
    }
    console.log('===========================');

    function downloadHistory() {
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
    }

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === 's' && !event.target.matches('input, textarea')) {
            event.preventDefault();
            event.stopPropagation();
            downloadHistory();
        }
    });
});