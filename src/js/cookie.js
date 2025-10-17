const $ = (id) => document.getElementById(id);
const cookieBanner = $('cookieBanner');
const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
const CONSENT_KEY = 'cookieConsent';
const TIMESTAMP_KEY = 'consentTimestamp';

checkAndClearConsent();
initializeCookieConsent();

function setConsent(consent) {
    localStorage.setItem(CONSENT_KEY, consent);
    localStorage.setItem(TIMESTAMP_KEY, new Date().getTime());
}

function getConsent() {
    return localStorage.getItem(CONSENT_KEY);
}

function checkAndClearConsent() {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    if (timestamp && (new Date().getTime() - timestamp > ninetyDaysInMs)) {
        localStorage.removeItem(CONSENT_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
    }
}

function loadScript(src, isAsync = true, content = null) {
    const script = document.createElement('script');
    if (content) {
        script.textContent = content;
    } else {
        script.defer = isAsync; 
        script.src = src;
    }
    document.head.appendChild(script);
}

function enableTrackingScripts() {
    if (document.head.querySelector('script[src="/_vercel/insights/script.js"]')) return;
    loadScript(null, false, "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };");
    loadScript("/_vercel/insights/script.js");
    loadScript(null, false, "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };");
    loadScript("/_vercel/speed-insights/script.js");

    const gaId = 'G-93C0KPGRPJ';
    loadScript(null, false, `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
}

function initializeCookieConsent() {
    const consent = getConsent();
    
    if (consent === 'true') {
        enableTrackingScripts();
        if (cookieBanner) cookieBanner.style.display = 'none';
    } else if (consent === 'false') {
        if (cookieBanner) cookieBanner.style.display = 'none';
    } else {
        if (cookieBanner) cookieBanner.style.display = 'block';
    }
}

if ($('acceptCookies')) {
    $('acceptCookies').addEventListener('click', () => {
        setConsent('true');
        enableTrackingScripts();
        if (cookieBanner) cookieBanner.style.display = 'none';
    });
}

if ($('declineCookies')) {
    $('declineCookies').addEventListener('click', () => {
        setConsent('false');
        if (cookieBanner) cookieBanner.style.display = 'none';
    });
}