/**
 * Download History - Ermöglicht das Herunterladen des Station-History als JSON-Datei
 */

document.addEventListener('DOMContentLoaded', () => {
    const HISTORY_KEY = 'station_history';

    /**
     * Triggert einen Datei-Download mit den übergebenen Daten
     */
    function triggerDownload(data: string, key: string): void {
        const now = new Date();
        const filename = `${key}_${now.toISOString().replace(/[T:]/g, '-').slice(0, 19)}.json`;
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

    /**
     * Lädt den gesamten Station-History herunter
     */
    function downloadHistory(): void {
        const rawData = localStorage.getItem(HISTORY_KEY);
        if (!rawData) return;
        triggerDownload(rawData, HISTORY_KEY);
    }

    // Tastenkombination Ctrl/Cmd + H zum Herunterladen
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isHKey = event.key.toLowerCase() === 'h';
        if (isCtrlOrCmd && isHKey) {
            event.preventDefault();
            downloadHistory();
        }
    });
});
