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

    const vaScript = document.createElement('script');
    vaScript.textContent = "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };";
    head.appendChild(vaScript);

    const vaSrcScript = document.createElement('script');
    vaSrcScript.defer = true;
    vaSrcScript.src = "/_vercel/insights/script.js";
    head.appendChild(vaSrcScript);

    const siScript = document.createElement('script');
    siScript.textContent = "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };";
    head.appendChild(siScript);

    const siSrcScript = document.createElement('script');
    siSrcScript.defer = true;
    siSrcScript.src = "/_vercel/speed-insights/script.js";
    head.appendChild(siSrcScript);

    const gtagScript = document.createElement('script');
    gtagScript.textContent = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');";
    head.appendChild(gtagScript);

    const gtagSrcScript = document.createElement('script');
    gtagSrcScript.defer = true;
    gtagSrcScript.src = "https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ";
    head.appendChild(gtagSrcScript);
}

function showCookieBanner() {
    const consent = getCookieConsent();

    if (consent === 'true') {
        cookieBanner.style.display = 'none';
        enableVercelScripts();
    } else {
        cookieBanner.style.display = 'none';
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