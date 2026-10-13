;(function () {
    'use strict'

    const historyKey = () => window.PlayerCore?.HISTORY_KEY || 'station_history'

    function buildFilename() {
        const stamp = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 19)
        return `${historyKey()}_${stamp}.json`
    }

    function downloadHistory() {
        try {
            const rawData = window.PlayerCore?.readSetting(historyKey())
            if (!rawData) return

            const blob = new Blob([rawData], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = buildFilename()
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (e) {
            window.logError?.(window.ErrorCode?.DOWNLOAD_HISTORY, e, { key: historyKey() })
        }
    }

    function isSaveShortcut(event) {
        return event.ctrlKey && event.key.toLowerCase() === 's' && !event.target.matches('input, textarea')
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('keydown', (event) => {
            if (!isSaveShortcut(event)) return
            event.preventDefault()
            event.stopPropagation()
            downloadHistory()
        })
    })

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { downloadHistory }
    }
})()
