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

    function handleAcceptAction() {
        setCookieConsent('true');
        cookieBanner.style.display = 'none';
        enableAllScripts();
    }

    function handleDeclineAction() {
        setCookieConsent('false');
        cookieBanner.style.display = 'none';
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

    function enableAllScripts() {
        enableVercelScripts();
        enablegtags();
    }

    function createScripts(scriptConfigs) {
        const head = document.head;
        scriptConfigs.forEach(scriptProps => {
            const script = document.createElement('script');
            Object.assign(script, scriptProps);
            head.appendChild(script);
        });
    }

    function enableVercelScripts() {
        if (document.head.querySelector('script[src="/_vercel/insights/script.js"]')) {
            return;
        }

        const scripts = [
            { textContent: "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };" },
            { defer: true, src: "/_vercel/insights/script.js" },
            { textContent: "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };" },
            { defer: true, src: "/_vercel/speed-insights/script.js" }
        ];
        createScripts(scripts);
    }

    function enablegtags() {
        if (document.head.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ"]')) {
            return;
        }

        const scripts = [
            { textContent: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');" },
            { defer: true, src: "https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ" },
        ];
        createScripts(scripts);
    }

    function showCookieBanner() {
        const consent = getCookieConsent();
        if (consent === 'true') {
            handleAcceptAction();
        } else {
            cookieBanner.style.display = 'block';
        }
    }

    acceptButton.addEventListener('click', handleAcceptAction);
    declineButton.addEventListener('click', handleDeclineAction);

    checkAndClearConsent();
    showCookieBanner();
} else {
    console.error("Required DOM elements for the cookie banner were not found.");
}