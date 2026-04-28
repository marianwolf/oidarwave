class NotificationManager {
    constructor() {
        this.notificationsSupported = 'Notification' in window;
        this.notificationsEnabled = false;
        this.notificationDebounceTimer = null;
        this.currentTrackTitle = '';
            this.currentTrackStation = '';
        
        // Initialisieren, sobald das DOM geladen ist
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.notificationToggle = document.getElementById('notificationToggle');
        this.isAudioPlayer = !!document.getElementById('audioPlayer');

        if (!this.notificationToggle) return;

        if (!this.notificationsSupported || !this.isAudioPlayer) {
            this.notificationToggle.style.display = 'none';
        } else {
            try {
                this.notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            } catch (e) {
                console.warn('localStorage notificationsEnabled read failed:', e);
            }
            this.updateNotificationToggleUI();
            
            this.notificationToggle.addEventListener('click', async () => {
                if (!this.notificationsSupported) return;

                if (!this.notificationsEnabled) {
                    if (Notification.permission === 'denied') {
                        alert('Benachrichtigungen sind in Ihrem Browser blockiert. Bitte erlauben Sie sie in den Browser-Einstellungen.');
                        return;
                    }

                    if (Notification.permission !== 'granted') {
                        const newPermission = await Notification.requestPermission();
                        if (newPermission !== 'granted') return;
                    }

                    this.notificationsEnabled = true;
                } else {
                    this.notificationsEnabled = false;
                }

                this.saveNotificationPreference();
                this.updateNotificationToggleUI();
            });
        }
    }

    saveNotificationPreference() {
        try {
            localStorage.setItem('notificationsEnabled', this.notificationsEnabled.toString());
        } catch (e) {
            console.warn('localStorage notificationsEnabled save failed:', e);
        }
    }

    updateNotificationToggleUI() {
        if (!this.notificationToggle) return;
        if (this.notificationsEnabled) {
            this.notificationToggle.classList.add('active');
            this.notificationToggle.title = 'Benachrichtigungen deaktivieren';
            this.notificationToggle.setAttribute('aria-label', 'Benachrichtigungen deaktivieren');
        } else {
            this.notificationToggle.classList.remove('active');
            this.notificationToggle.title = 'Benachrichtigungen bei Titeländerung';
            this.notificationToggle.setAttribute('aria-label', 'Benachrichtigungen aktivieren');
        }
    }

    sendNotification(title, stationName) {
        if (!this.notificationsSupported || !this.notificationsEnabled) return;
        if (Notification.permission !== 'granted') return;

        const notification = new Notification('Oidarwave - Neuer Titel', {
            body: `${title}\nSender: ${stationName}`,
            icon: '/favicon.svg',
            tag: 'oidarwave-notification',
            requireInteraction: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        setTimeout(() => notification.close(), 10000);
    }

    handleTrackChange(newTitle, stationName) {
        if (!newTitle || (newTitle === this.currentTrackTitle && stationName === this.currentTrackStation)) return;
        if (newTitle === "Keine Titelinformationen" || newTitle === "Metadaten nicht verfügbar") return;
        
        // Don't notify on station switch - only on title change within same station
        if (stationName !== this.currentTrackStation) {
            if (this.notificationDebounceTimer) {
                clearTimeout(this.notificationDebounceTimer);
                this.notificationDebounceTimer = null;
            }
            this.currentTrackStation = stationName;
            this.currentTrackTitle = newTitle;
            return;
        }

        if (this.notificationDebounceTimer) {
            clearTimeout(this.notificationDebounceTimer);
        }

        this.notificationDebounceTimer = setTimeout(() => {
            this.sendNotification(newTitle, stationName);
        }, 2000);

        this.currentTrackTitle = newTitle;
    }
}

window.notificationManager = new NotificationManager();
