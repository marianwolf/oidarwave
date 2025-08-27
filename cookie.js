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
        const newVaScript = document.createElement('script');
        newVaScript.defer = true;
        newVaScript.src = '/_vercel/insights/script.js';
        document.head.appendChild(newVaScript);
        
        const newSiScript = document.createElement('script');
        newSiScript.defer = true;
        newSiScript.src = '/_vercel/speed-insights/script.js';
        document.head.appendChild(newSiScript);
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
        cookieBanner.style.display = 'none';
    });

    showCookieBanner();