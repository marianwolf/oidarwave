const $ = (id) => document.getElementById(id);
const cookieBanner = $('cookieBanner');
const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
const CONSENT_KEY = 'cookieConsent';
const TIMESTAMP_KEY = 'consentTimestamp';

checkAndClearConsent();
showCookieBanner();

function setConsent(consent) {
    localStorage.setItem(CONSENT_KEY, consent);
    localStorage.setItem(TIMESTAMP_KEY, new Date().getTime());
}

function getConsent() {
    return localStorage.getItem(CONSENT_KEY);
}

function checkAndClearConsent() {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    if (timestamp && new Date().getTime() - timestamp > ninetyDaysInMs) {
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
    loadScript(null, false, `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-93C0KPGRPJ');`);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=G-93C0KPGRPJ`);
}

function showCookieBanner() {
    const consent = getConsent();
    if (consent === 'true') {
        enableTrackingScripts();
    } else {
        cookieBanner.style.display = consent === 'false' ? 'none' : 'block';
    }
}

$('acceptCookies').addEventListener('click', () => {
    setConsent('true');
    enableTrackingScripts();
    cookieBanner.style.display = 'none';
});

$('declineCookies').addEventListener('click', () => {
    setConsent('false');
    cookieBanner.style.display = 'none';
});