const cookieBanner = document.getElementById('cookieBanner');
const acceptButton = document.getElementById('acceptCookies');
const declineButton = document.getElementById('declineCookies');

if (cookieBanner && acceptButton && declineButton) {

    function setCookieConsent(consent) {
        localStorage.setItem('cookieConsent', consent);
        localStorage.setItem('consentTimestamp', new Date().getTime());
    }

    function getCookieConsent() {
        return localStorage.getItem('cookieConsent');
    }

    function checkAndClearConsent() {
        const timestamp = localStorage.getItem('consentTimestamp');
        if (timestamp) {
            const now = new Date().getTime();
            const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
            if (now - timestamp > ninetyDaysInMs) {
                localStorage.removeItem('cookieConsent');
                localStorage.removeItem('consentTimestamp');
            }
        }
    }

    function enableVercelScripts() {
        const head = document.head;

        if (head.querySelector('script[src="/_vercel/insights/script.js"]')) {
            return;
        }

        const scripts = [
            { textContent: "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };" },
            { defer: true, src: "/_vercel/insights/script.js" },
            { textContent: "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };" },
            { defer: true, src: "/_vercel/speed-insights/script.js" }
        ];

        scripts.forEach(scriptProps => {
            const script = document.createElement('script');
            Object.assign(script, scriptProps);
            head.appendChild(script);
        });
    }

    function enablegtags() {
        const head = document.head;

        if (head.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ"]')) {
            return;
        }

        const scripts = [
            { textContent: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');" },
            { defer: true, src: "https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ" },
        ];

        scripts.forEach(scriptProps => {
            const script = document.createElement('script');
            Object.assign(script, scriptProps);
            head.appendChild(script);
        });
    }

    function showCookieBanner() {
        const consent = getCookieConsent();
        if (consent === 'true') {
            cookieBanner.style.display = 'none';
            enableVercelScripts();
            enablegtags();
        } else {
            cookieBanner.style.display = 'block';
        }
    }

    acceptButton.addEventListener('click', () => {
        setCookieConsent('true');
        enableVercelScripts();
        enablegtags();
        cookieBanner.style.display = 'none';
    });

    declineButton.addEventListener('click', () => {
        setCookieConsent('false');
        cookieBanner.style.display = 'none';
    });

    checkAndClearConsent();
    showCookieBanner();
} else {
    console.error("Required DOM elements for the cookie banner were not found.");
}