;(function () {
    'use strict'

    class NotificationManager {
        constructor() {
            this.notificationsSupported = typeof window !== 'undefined' && 'Notification' in window
            this.notificationsEnabled = false
            this.notificationDebounceTimer = null
            this.currentTrackTitle = ''
            this.currentTrackStation = ''
            document.addEventListener('DOMContentLoaded', () => this.init())
        }

        init() {
            this.notificationToggle = document.getElementById('notificationToggle')
            this.isAudioPlayer = !!document.getElementById('audioPlayer')
            if (!this.notificationToggle) return

            if (!this.notificationsSupported || !this.isAudioPlayer) {
                this.notificationToggle.style.display = 'none'
                return
            }

            this.notificationsEnabled = window.PlayerCore?.readBoolSetting('notificationsEnabled') ?? false
            this.updateNotificationToggleUI()
            this.notificationToggle.addEventListener('click', () => this.toggleNotifications())
        }

        async toggleNotifications() {
            if (!this.notificationsSupported) return

            if (!this.notificationsEnabled) {
                const granted = await this.ensurePermission()
                if (!granted) return
                this.notificationsEnabled = true
            } else {
                this.notificationsEnabled = false
            }

            this.saveNotificationPreference()
            this.updateNotificationToggleUI()
        }

        async ensurePermission() {
            if (Notification.permission === 'denied') {
                alert(
                    'Benachrichtigungen sind in Ihrem Browser blockiert. Bitte erlauben Sie sie in den Browser-Einstellungen.'
                )
                return false
            }
            if (Notification.permission !== 'granted') {
                return (await Notification.requestPermission()) === 'granted'
            }
            return true
        }

        saveNotificationPreference() {
            window.PlayerCore?.writeSetting('notificationsEnabled', String(this.notificationsEnabled))
        }

        updateNotificationToggleUI() {
            if (!this.notificationToggle) return
            const enabled = this.notificationsEnabled
            const label = enabled ? 'Benachrichtigungen deaktivieren' : 'Benachrichtigungen aktivieren'
            this.notificationToggle.classList.toggle('active', enabled)
            this.notificationToggle.title = enabled ? label : 'Benachrichtigungen bei Titeländerung'
            this.notificationToggle.setAttribute('aria-label', label)
        }

        sendNotification(title, stationName) {
            if (!this.notificationsSupported || !this.notificationsEnabled) return
            if (Notification.permission !== 'granted') return

            const notification = new Notification('Oidarwave - Neuer Titel', {
                body: `${title}\nSender: ${stationName}`,
                icon: '/favicon/favicon.svg',
                tag: 'oidarwave-notification',
                requireInteraction: false,
            })
            notification.onclick = () => {
                window.focus()
                notification.close()
            }
            setTimeout(() => notification.close(), 10000)
        }

        handleTrackChange(newTitle, stationName) {
            if (!newTitle || (newTitle === this.currentTrackTitle && stationName === this.currentTrackStation)) return
            if (newTitle === 'Keine Titelinformationen' || newTitle === 'Metadaten nicht verfügbar') return

            // Senderwechsel nur übernehmen, ohne zu benachrichtigen.
            if (stationName !== this.currentTrackStation) {
                this.clearDebounceTimer()
                this.currentTrackStation = stationName
                this.currentTrackTitle = newTitle
                return
            }

            this.clearDebounceTimer()
            this.notificationDebounceTimer = setTimeout(() => this.sendNotification(newTitle, stationName), 2000)
            this.currentTrackTitle = newTitle
        }

        clearDebounceTimer() {
            if (this.notificationDebounceTimer) {
                clearTimeout(this.notificationDebounceTimer)
                this.notificationDebounceTimer = null
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.NotificationManager = window.NotificationManager || NotificationManager
        window.notificationManager = window.notificationManager || new NotificationManager()
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { NotificationManager }
    }
})()
