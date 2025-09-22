const cookieBanner = document.getElementById('cookieBanner');
const acceptButton = document.getElementById('acceptCookies');
const declineButton = document.getElementById('declineCookies');

if (cookieBanner && acceptButton && declineButton) {
    const setCookieConsent = (consent) => {
        localStorage.setItem('cookieConsent', consent.toString());
        localStorage.setItem('consentTimestamp', new Date().getTime());
    };

    const getCookieConsent = () => {
        const consent = localStorage.getItem('cookieConsent');
        if (consent === 'true') return true;
        if (consent === 'false') return false;
        return null;
    };

    const enableAllScripts = () => {
        window.va = window.va || function () {
            (window.vaq = window.vaq || []).push(arguments);
        };
        window.si = window.si || function () {
            (window.siq = window.siq || []).push(arguments);
        };
        window.dataLayer = window.dataLayer || [];
        function gtag(){
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'G-93C0KPGRPJ');
    };

    const handleAcceptAction = () => {
        setCookieConsent(true);
        cookieBanner.style.display = 'none';
        enableAllScripts();
    };

    const handleDeclineAction = () => {
        setCookieConsent(false);
        cookieBanner.style.display = 'none';
    };

    const checkAndClearConsent = () => {
        const timestamp = parseInt(localStorage.getItem('consentTimestamp'), 10);
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
        if (timestamp && (new Date().getTime() - timestamp > ninetyDaysInMs)) {
            localStorage.removeItem('cookieConsent');
            localStorage.removeItem('consentTimestamp');
        }
    };

    const showCookieBanner = () => {
        const consent = getCookieConsent();
        if (consent === true) {
            enableAllScripts();
        } else if (consent === false) {
            cookieBanner.style.display = 'none';
        } else {
            cookieBanner.style.display = 'block';
        }
    };

    acceptButton.addEventListener('click', handleAcceptAction);
    declineButton.addEventListener('click', handleDeclineAction);

    checkAndClearConsent();
    showCookieBanner();

} else {
    console.error("Erforderliche DOM-Elemente für das Cookie-Banner wurden nicht gefunden. Bitte überprüfen Sie die IDs 'cookieBanner', 'acceptCookies' und 'declineCookies'.");
}