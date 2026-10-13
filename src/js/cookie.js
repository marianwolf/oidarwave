;(function () {
    'use strict'

    const CONSENT_KEY = 'cookieConsent'
    const TIMESTAMP_KEY = 'consentTimestamp'
    const EXPIRY_DAYS = 90
    const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000

    const storage = () => window.PlayerCore || null

    function readConsent() {
        return storage() ? storage().readSetting(CONSENT_KEY) : null
    }

    function writeConsent(consent) {
        if (!storage()) return
        storage().writeSetting(CONSENT_KEY, consent)
        storage().writeSetting(TIMESTAMP_KEY, String(Date.now()))
    }

    function clearExpiredConsent() {
        if (!storage()) return
        const rawTimestamp = storage().readSetting(TIMESTAMP_KEY)
        const timestamp = rawTimestamp ? Number(rawTimestamp) : NaN
        if (rawTimestamp && Number.isFinite(timestamp) && Date.now() - timestamp > EXPIRY_MS) {
            storage().removeSetting(CONSENT_KEY)
            storage().removeSetting(TIMESTAMP_KEY)
        }
    }

    function enableAnalyticsScripts() {
        const head = document.head
        if (!head || head.querySelector('script[src="/_vercel/insights/script.js"]')) return

        const scripts = [
            { content: 'window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };' },
            { src: '/_vercel/insights/script.js', defer: true },
            { content: 'window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };' },
            { src: '/_vercel/speed-insights/script.js', defer: true },
            {
                content:
                    "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');",
            },
            { src: 'https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ', defer: true },
        ]

        scripts.forEach(({ content, src, defer }) => {
            const script = document.createElement('script')
            if (content) script.textContent = content
            if (src) {
                script.src = src
                script.defer = defer
            }
            head.appendChild(script)
        })
    }

    function updateBannerVisibility() {
        const consent = readConsent()
        const banner = document.getElementById('cookieBanner')
        if (banner) banner.style.display = consent === null ? 'block' : 'none'
        if (consent === 'true') enableAnalyticsScripts()
    }

    function bindBannerActions() {
        document.getElementById('acceptCookies')?.addEventListener('click', () => {
            writeConsent('true')
            enableAnalyticsScripts()
            const banner = document.getElementById('cookieBanner')
            if (banner) banner.style.display = 'none'
        })
        document.getElementById('declineCookies')?.addEventListener('click', () => {
            writeConsent('false')
            const banner = document.getElementById('cookieBanner')
            if (banner) banner.style.display = 'none'
        })
    }

    clearExpiredConsent()
    bindBannerActions()
    updateBannerVisibility()
})()
