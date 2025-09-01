const cookieBanner = document.getElementById('cookieBanner');
const acceptButton = document.getElementById('acceptCookies');
const declineButton = document.getElementById('declineCookies');

function setCookieConsent(consent) {
    localStorage.setItem('cookieConsent', consent);
}

function getCookieConsent() {
    return localStorage.getItem('cookieConsent');
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
}

function showCookieBanner() {
    const consent = getCookieConsent();
    if (consent === null) {
        cookieBanner.style.display = 'block';
    } else if (consent === 'true') {
        enableVercelScripts();
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