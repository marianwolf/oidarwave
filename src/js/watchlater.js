/**
 * WatchLater - Verwalten von Watch Later-Liste, Fortschrittsanzeige und Auto-Play-Queue
 */
const WatchLater = (() => {
    const WATCH_LATER_KEY = 'watchlater_queue';
    const PLAYBACK_PROGRESS_KEY = 'playback_progress';
    const PLAYBACK_QUEUE_KEY = 'autoplay_queue';
    const PROGRESS_UPDATE_INTERVAL = 5000; // Alle 5 Sekunden speichern
    let progressInterval = null;
    let currentMediaUrl = null;
    let currentMediaDuration = 0;

    // ==================== Watch Later ====================

    function getWatchLater() {
        const data = localStorage.getItem(WATCH_LATER_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveWatchLater(list) {
        localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(list));
    }

    function addToWatchLater(url, name, type = 'radio') {
        const list = getWatchLater();
        if (!list.some(item => item.url === url)) {
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

    function removeFromWatchLater(url) {
        const list = getWatchLater().filter(item => item.url !== url);
        saveWatchLater(list);
    }

    function isInWatchLater(url) {
        return getWatchLater().some(item => item.url === url);
    }

    // ==================== Fortschrittsanzeige ====================

    function getPlaybackProgress() {
        const data = localStorage.getItem(PLAYBACK_PROGRESS_KEY);
        return data ? JSON.parse(data) : {};
    }

    function savePlaybackProgress(url, currentTime, duration) {
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

    function getProgressForUrl(url) {
        const progress = getPlaybackProgress();
        return progress[url] || null;
    }

    function clearProgressForUrl(url) {
        const progress = getPlaybackProgress();
        delete progress[url];
        localStorage.setItem(PLAYBACK_PROGRESS_KEY, JSON.stringify(progress));
    }

    // ==================== Auto-Play-Queue ====================

    function getAutoPlayQueue() {
        const data = localStorage.getItem(PLAYBACK_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveAutoPlayQueue(queue) {
        localStorage.setItem(PLAYBACK_QUEUE_KEY, JSON.stringify(queue));
    }

    function addToQueue(url, name, type = 'radio') {
        const queue = getAutoPlayQueue();
        if (!queue.some(item => item.url === url)) {
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

    function removeFromQueue(url) {
        const queue = getAutoPlayQueue().filter(item => item.url !== url);
        saveAutoPlayQueue(queue);
    }

    function clearQueue() {
        localStorage.removeItem(PLAYBACK_QUEUE_KEY);
    }

    function getNextInQueue() {
        const queue = getAutoPlayQueue();
        return queue.length > 0 ? queue[0] : null;
    }

    function moveQueueForward() {
        const queue = getAutoPlayQueue();
        if (queue.length > 0) {
            queue.shift();
            saveAutoPlayQueue(queue);
        }
        return queue;
    }

    // ==================== Event-Handling ====================

    function startProgressTracking(url, duration) {
        currentMediaUrl = url;
        currentMediaDuration = duration;
        
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        
        const player = document.getElementById('audioPlayer') || document.getElementById('videoPlayer');
        if (!player) return;
        
        progressInterval = setInterval(() => {
            if (player && !player.paused) {
                savePlaybackProgress(url, player.currentTime, duration);
            }
        }, PROGRESS_UPDATE_INTERVAL);
    }

    function stopProgressTracking() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    function setupPlayerListeners() {
        const player = document.getElementById('audioPlayer') || document.getElementById('videoPlayer');
        if (!player) return;
        
        player.addEventListener('loadedmetadata', () => {
            currentMediaDuration = player.duration;
            startProgressTracking(currentMediaUrl, player.duration);
        });
        
        player.addEventListener('play', () => {
            startProgressTracking(currentMediaUrl, currentMediaDuration);
        });
        
        player.addEventListener('pause', () => {
            if (currentMediaUrl && player.currentTime > 0) {
                savePlaybackProgress(currentMediaUrl, player.currentTime, currentMediaDuration);
            }
        });
        
        player.addEventListener('ended', () => {
            stopProgressTracking();
            clearProgressForUrl(currentMediaUrl);
            
            // Auto-Play aus Queue
            const next = getNextInQueue();
            if (next) {
                moveQueueForward();
                playFromQueue(next);
            }
        });
    }

    function playFromQueue(item) {
        const player = document.getElementById('audioPlayer') || document.getElementById('videoPlayer');
        const stationButtons = document.querySelectorAll('.station-btn');
        const targetButton = Array.from(stationButtons).find(btn => btn.dataset.url === item.url);
        
        if (targetButton && player) {
            currentMediaUrl = item.url;
            targetButton.click();
        }
    }

    // ==================== UI-Hilfsfunktionen ====================

    function formatDuration(ms) {
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

    function getProgressStatus(url) {
        const progress = getProgressForUrl(url);
        if (!progress) return null;
        
        const percent = progress.progressPercent.toFixed(1);
        const remaining = formatDuration((progress.duration - progress.currentTime) * 1000);
        
        return {
            percent,
            remaining,
            formatted: `${percent}% (${remaining} übrig)`
        };
    }

    // ==================== Initialisierung ====================

    function init() {
        // Cleanup abgelaufener Fortschrittsdaten (älter als 30 Tage)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const progress = getPlaybackProgress();
        let hasChanges = false;
        
        Object.keys(progress).forEach(url => {
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
