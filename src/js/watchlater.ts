/**
 * WatchLater - Verwalten von Watch Later-Liste, Fortschrittsanzeige und Auto-Play-Queue
 */

import { WatchLaterItem, QueueItem, PlaybackProgress, ProgressStatus } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WatchLater: any;

/**
 * WatchLater Module - IIFE für Kapselung
 */
const WatchLaterModule = (() => {
    const WATCH_LATER_KEY = 'watchlater_queue';
    const PLAYBACK_PROGRESS_KEY = 'playback_progress';
    const PLAYBACK_QUEUE_KEY = 'autoplay_queue';
    const PROGRESS_UPDATE_INTERVAL = 5000; // Alle 5 Sekunden speichern
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let currentMediaUrl: string | null = null;
    let currentMediaDuration = 0;

    // ==================== Watch Later ====================

    /**
     * Liest die Watch Later Liste aus dem localStorage
     */
    function getWatchLater(): WatchLaterItem[] {
        const data = localStorage.getItem(WATCH_LATER_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Speichert die Watch Later Liste im localStorage
     */
    function saveWatchLater(list: WatchLaterItem[]): void {
        localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(list));
    }

    /**
     * Fügt ein Element zur Watch Later Liste hinzu
     */
    function addToWatchLater(url: string, name: string, type: 'radio' | 'video' = 'radio'): boolean {
        const list = getWatchLater();
        if (!list.some((item) => item.url === url)) {
            list.unshift({
                url,
                name,
                type,
                addedAt: Date.now()
            });
            saveWatchLater(list);
            return true;
        }
        return false;
    }

    /**
     * Entfernt ein Element aus der Watch Later Liste
     */
    function removeFromWatchLater(url: string): void {
        const list = getWatchLater().filter((item) => item.url !== url);
        saveWatchLater(list);
    }

    /**
     * Prüft ob ein Element in der Watch Later Liste ist
     */
    function isInWatchLater(url: string): boolean {
        return getWatchLater().some((item) => item.url === url);
    }

    // ==================== Fortschrittsanzeige ====================

    /**
     * Liest den Fortschritt aus dem localStorage
     */
    function getPlaybackProgress(): Record<string, PlaybackProgress> {
        const data = localStorage.getItem(PLAYBACK_PROGRESS_KEY);
        return data ? JSON.parse(data) : {};
    }

    /**
     * Speichert den Fortschritt im localStorage
     */
    function savePlaybackProgress(url: string, currentTime: number, duration: number): void {
        if (!url || duration <= 0) return;
        const progress = getPlaybackProgress();
        progress[url] = {
            currentTime,
            duration,
            lastUpdated: Date.now(),
            progressPercent: (currentTime / duration) * 100
        };
        localStorage.setItem(PLAYBACK_PROGRESS_KEY, JSON.stringify(progress));
    }

    /**
     * Liest den Fortschritt für eine URL
     */
    function getProgressForUrl(url: string): PlaybackProgress | null {
        const progress = getPlaybackProgress();
        return progress[url] || null;
    }

    /**
     * Löscht den Fortschritt für eine URL
     */
    function clearProgressForUrl(url: string): void {
        const progress = getPlaybackProgress();
        delete progress[url];
        localStorage.setItem(PLAYBACK_PROGRESS_KEY, JSON.stringify(progress));
    }

    // ==================== Auto-Play-Queue ====================

    /**
     * Liest die Auto-Play-Queue aus dem localStorage
     */
    function getAutoPlayQueue(): QueueItem[] {
        const data = localStorage.getItem(PLAYBACK_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Speichert die Auto-Play-Queue im localStorage
     */
    function saveAutoPlayQueue(queue: QueueItem[]): void {
        localStorage.setItem(PLAYBACK_QUEUE_KEY, JSON.stringify(queue));
    }

    /**
     * Fügt ein Element zur Queue hinzu
     */
    function addToQueue(url: string, name: string, type: 'radio' | 'video' = 'radio'): boolean {
        const queue = getAutoPlayQueue();
        if (!queue.some((item) => item.url === url)) {
            queue.push({
                url,
                name,
                type,
                addedAt: Date.now()
            });
            saveAutoPlayQueue(queue);
            return true;
        }
        return false;
    }

    /**
     * Entfernt ein Element aus der Queue
     */
    function removeFromQueue(url: string): void {
        const queue = getAutoPlayQueue().filter((item) => item.url !== url);
        saveAutoPlayQueue(queue);
    }

    /**
     * Löscht die gesamte Queue
     */
    function clearQueue(): void {
        localStorage.removeItem(PLAYBACK_QUEUE_KEY);
    }

    /**
     * Gibt das nächste Element in der Queue zurück
     */
    function getNextInQueue(): QueueItem | null {
        const queue = getAutoPlayQueue();
        return queue.length > 0 ? queue[0] : null;
    }

    /**
     * Entfernt das erste Element aus der Queue
     */
    function moveQueueForward(): QueueItem[] {
        const queue = getAutoPlayQueue();
        if (queue.length > 0) {
            queue.shift();
            saveAutoPlayQueue(queue);
        }
        return queue;
    }

    // ==================== Event-Handling ====================

    /**
     * Startet die Fortschrittsverfolgung
     */
    function startProgressTracking(url: string, duration: number): void {
        currentMediaUrl = url;
        currentMediaDuration = duration;
        
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        
        const player = document.getElementById('audioPlayer') as HTMLAudioElement | null || 
                       document.getElementById('videoPlayer') as HTMLVideoElement | null;
        if (!player) return;
        
        progressInterval = setInterval(() => {
            if (player && !player.paused) {
                savePlaybackProgress(url, player.currentTime, duration);
            }
        }, PROGRESS_UPDATE_INTERVAL);
    }

    /**
     * Stoppt die Fortschrittsverfolgung
     */
    function stopProgressTracking(): void {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    /**
     * Richtet die Player-Event-Listener ein
     */
    function setupPlayerListeners(): void {
        const player = document.getElementById('audioPlayer') as HTMLAudioElement | null || 
                       document.getElementById('videoPlayer') as HTMLVideoElement | null;
        if (!player) return;
        
        player.addEventListener('loadedmetadata', () => {
            currentMediaDuration = player.duration;
            if (currentMediaUrl) {
                startProgressTracking(currentMediaUrl, player.duration);
            }
        });
        
        player.addEventListener('play', () => {
            if (currentMediaUrl) {
                startProgressTracking(currentMediaUrl, currentMediaDuration);
            }
        });
        
        player.addEventListener('pause', () => {
            if (currentMediaUrl && player.currentTime > 0) {
                savePlaybackProgress(currentMediaUrl, player.currentTime, currentMediaDuration);
            }
        });
        
        player.addEventListener('ended', () => {
            stopProgressTracking();
            if (currentMediaUrl) {
                clearProgressForUrl(currentMediaUrl);
            }
            
            // Auto-Play aus Queue
            const next = getNextInQueue();
            if (next) {
                moveQueueForward();
                playFromQueue(next);
            }
        });
    }

    /**
     * Spielt das nächste Element aus der Queue ab
     */
    function playFromQueue(item: QueueItem): void {
        const player = document.getElementById('audioPlayer') as HTMLAudioElement | null || 
                       document.getElementById('videoPlayer') as HTMLVideoElement | null;
        const stationButtons = document.querySelectorAll('.station-btn');
        const targetButton = Array.from(stationButtons).find((btn) => {
            const htmlBtn = btn as HTMLElement;
            return htmlBtn.dataset?.url === item.url;
        });
        
        if (targetButton && player) {
            currentMediaUrl = item.url;
            (targetButton as HTMLElement).click();
        }
    }

    // ==================== UI-Hilfsfunktionen ====================

    /**
     * Formatiert eine Dauer in Millisekunden
     */
    function formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Gibt den formatierten Fortschritt-Status zurück
     */
    function getProgressStatus(url: string): ProgressStatus | null {
        const progress = getProgressForUrl(url);
        if (!progress) return null;
        
        const percent = progress.progressPercent.toFixed(1);
        const remaining = formatDuration((progress.duration - progress.currentTime) * 1000);
        
        return {
            percent: parseFloat(percent),
            remaining,
            formatted: `${percent}% (${remaining} übrig)`
        };
    }

    // ==================== Initialisierung ====================

    /**
     * Initialisiert das Modul
     */
    function init(): void {
        // Cleanup abgelaufener Fortschrittsdaten (älter als 30 Tage)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const progress = getPlaybackProgress();
        let hasChanges = false;
        
        Object.keys(progress).forEach((url) => {
            if (progress[url].lastUpdated < thirtyDaysAgo) {
                delete progress[url];
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            localStorage.setItem(PLAYBACK_PROGRESS_KEY, JSON.stringify(progress));
        }
    }

    init();

    // ==================== Öffentliche API ====================

    return {
        // Watch Later
        addToWatchLater,
        removeFromWatchLater,
        isInWatchLater,
        getWatchLaterList: getWatchLater,
        
        // Fortschritt
        getProgressForUrl,
        getProgressStatus,
        
        // Auto-Play Queue
        addToQueue,
        removeFromQueue,
        getNextInQueue,
        clearQueue,
        getQueue: getAutoPlayQueue,
        
        // Player
        setupPlayerListeners
    };
})();

// Export für externe Verwendung
export default WatchLaterModule;
