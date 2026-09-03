const cookieBanner = document.getElementById('cookieBanner');
const acceptButton = document.getElementById('acceptCookies');
const declineButton = document.getElementById('declineCookies');

const CONSENT_KEY = 'cookieConsent';
const TIMESTAMP_KEY = 'consentTimestamp';
const EXPIRY_DAYS = 90;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

function setCookieConsent(consent) {
    try {
        localStorage.setItem(CONSENT_KEY, consent);
        localStorage.setItem(TIMESTAMP_KEY, Date.now());
    } catch (e) {
        logStorageError(ErrorCode.STORAGE_WRITE, e, CONSENT_KEY);
    }
}

function getCookieConsent() {
    try {
        return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
        logStorageError(ErrorCode.STORAGE_READ, e, CONSENT_KEY);
        return null;
    }
}

function checkConsentExpiry() {
    try {
        const timestamp = localStorage.getItem(TIMESTAMP_KEY);
        if (timestamp && Date.now() - timestamp > EXPIRY_MS) {
            localStorage.removeItem(CONSENT_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);
        }
    } catch (e) {
        logStorageError(ErrorCode.STORAGE_READ, e, TIMESTAMP_KEY);
    }
}

function enableVercelScripts() {
    const head = document.head;
    if (head.querySelector('script[src="/_vercel/insights/script.js"]')) {
        return;
    }
    
    const scripts = [
        { content: "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };" },
        { src: "/_vercel/insights/script.js", defer: true },
        { content: "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };" },
        { src: "/_vercel/speed-insights/script.js", defer: true },
        { content: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');" },
        { src: "https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ", defer: true }
    ];
    
    scripts.forEach(({ content, src, defer }) => {
        const script = document.createElement('script');
        if (content) script.textContent = content;
        if (src) { script.src = src; script.defer = defer; }
        head.appendChild(script);
    });
}

function showCookieBanner() {
    const consent = getCookieConsent();
    const show = consent !== 'true';
    if (cookieBanner) cookieBanner.style.display = show ? 'block' : 'none';
    if (consent === 'true') enableVercelScripts();
}

checkConsentExpiry();

if (acceptButton) {
    acceptButton.addEventListener('click', () => {
        setCookieConsent('true');
        enableVercelScripts();
        if (cookieBanner) cookieBanner.style.display = 'none';
    });
}

if (declineButton) {
    declineButton.addEventListener('click', () => {
        setCookieConsent('false');
        if (cookieBanner) cookieBanner.style.display = 'none';
    });
}

showCookieBanner();