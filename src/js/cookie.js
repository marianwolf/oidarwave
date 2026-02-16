const cookieBanner = document.getElementById('cookieBanner');
const acceptButton = document.getElementById('acceptCookies');
const declineButton = document.getElementById('declineCookies');

checkAndClearConsent();

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
    const addScript = (content, src = null, defer = false) => {
        const script = document.createElement('script');
        if (content) {
            script.textContent = content;
        }
        if (src) {
            script.src = src;
            if (defer) {
                script.defer = true;
            }
        }
        head.appendChild(script);
    };

    addScript("window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };");
    addScript(null, "/_vercel/insights/script.js", true);
    addScript("window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };");
    addScript(null, "/_vercel/speed-insights/script.js", true);
    addScript("window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');");
    addScript(null, "https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ", true);
}

function showCookieBanner() {
    const consent = getCookieConsent();
    if (consent === 'true') {
        cookieBanner.style.display = 'none';
        enableVercelScripts();
    } else {
        cookieBanner.style.display = 'block';
    }
}

acceptButton.addEventListener('click', () => {
    setCookieConsent('true');
    enableVercelScripts();
    cookieBanner.style.display = 'none';
});

declineButton.addEventListener('click', () => {
    setCookieConsent('false');
    cookieBanner.style.display = 'none';
});

showCookieBanner();