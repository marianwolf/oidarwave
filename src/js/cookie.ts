/**
 * Cookie Banner - Verwaltung von Cookie-Zustimmung und Vercel-Skripten
 */

// DOM Element Typen
const cookieBanner: HTMLElement | null = document.getElementById('cookieBanner');
const acceptButton: HTMLElement | null = document.getElementById('acceptCookies');
const declineButton: HTMLElement | null = document.getElementById('declineCookies');

// Initialisierung
checkAndClearConsent();

/**
 * Speichert die Cookie-Zustimmung im localStorage
 */
function setCookieConsent(consent: string): void {
    localStorage.setItem('cookieConsent', consent);
    localStorage.setItem('consentTimestamp', new Date().getTime().toString());
}

/**
 * Liest die Cookie-Zustimmung aus dem localStorage
 */
function getCookieConsent(): string | null {
    return localStorage.getItem('cookieConsent');
}

/**
 * Überprüft und löscht abgelaufene Consent-Daten (90 Tage)
 */
function checkAndClearConsent(): void {
    const timestampStr = localStorage.getItem('consentTimestamp');
    if (timestampStr) {
        const now = new Date().getTime();
        const timestamp = parseInt(timestampStr, 10);
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
        if (now - timestamp > ninetyDaysInMs) {
            localStorage.removeItem('cookieConsent');
            localStorage.removeItem('consentTimestamp');
        }
    }
}

/**
 * Fügt Vercel Insights und Analytics Skripte hinzu
 */
function enableVercelScripts(): void {
    const head = document.head;
    
    if (head.querySelector('script[src="/_vercel/insights/script.js"]')) {
        return;
    }
    
    const addScript = (content: string | null, src: string | null = null, defer = false): void => {
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

/**
 * Zeigt oder versteckt das Cookie-Banner basierend auf der gespeicherten Zustimmung
 */
function showCookieBanner(): void {
    const consent = getCookieConsent();
    if (consent === 'true') {
        if (cookieBanner) {
            cookieBanner.style.display = 'none';
        }
        enableVercelScripts();
    } else {
        if (cookieBanner) {
            cookieBanner.style.display = 'block';
        }
    }
}

// Event Listener
if (acceptButton) {
    acceptButton.addEventListener('click', () => {
        setCookieConsent('true');
        enableVercelScripts();
        if (cookieBanner) {
            cookieBanner.style.display = 'none';
        }
    });
}

if (declineButton) {
    declineButton.addEventListener('click', () => {
        setCookieConsent('false');
        if (cookieBanner) {
            cookieBanner.style.display = 'none';
        }
    });
}

// Banner anzeigen
showCookieBanner();
