document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const downloadButton = document.getElementById('downloadButton');
    const statusMessage = document.getElementById('statusMessage');
    const HISTORY_KEY = 'station_history';
    
    function triggerDownload(data, key) {
        const now = new Date();
        const filename = `${key}_${now.toISOString().slice(0, 10)}.json`;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        statusMessage.textContent = `✅ Datei "${filename}" erfolgreich heruntergeladen.`;
        statusMessage.style.color = 'var(--color-status-online)';
    }

    function getRawHistoryData() {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        
        if (!historyStr) {
            statusMessage.textContent = "⚠️ Keine Verlaufsdaten im LocalStorage gefunden.";
            statusMessage.style.color = 'var(--color-status-error)';
            return null;
        }
        
        statusMessage.textContent = ""; 
        return historyStr;
    }

    function downloadHistory() {
        const rawData = getRawHistoryData();
        if (!rawData) return;
        
        triggerDownload(rawData, HISTORY_KEY);
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', downloadHistory);
    }

    document.addEventListener('keydown', (event) => {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isHKey = event.key.toLowerCase() === 'h'

        if (isCtrlOrCmd && isHKey) {
            event.preventDefault(); 
            
            if (downloadButton) {
                downloadButton.focus();
            }
            downloadHistory();
        }
    });

    getRawHistoryData(); 
});