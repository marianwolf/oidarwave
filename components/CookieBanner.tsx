'use client';

import { useState, useEffect } from 'react';

interface Station {
  url: string;
  name: string;
  metadataUrl?: string;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    localStorage.setItem('consentTimestamp', new Date().getTime().toString());
    setIsVisible(false);
    enableVercelScripts();
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'false');
    localStorage.setItem('consentTimestamp', new Date().getTime().toString());
    setIsVisible(false);
  };

  const enableVercelScripts = () => {
    const head = document.head;

    if (head.querySelector('script[src="/_vercel/insights/script.js"]')) {
      return;
    }

    const addScript = (content: string | null, src: string | null = null, defer = false) => {
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
  };

  if (!isVisible) return null;

  return (
    <div
      className="cookie-banner visible"
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookieBannerHeading"
    >
      <div className="cookie-banner-content">
        <p>
          Um die Website für Sie zu optimieren, nutzen wir anonyme Nutzungsstatistiken.
        </p>
        <div className="cookie-buttons">
          <button className="cookie-btn accept-btn" onClick={acceptCookies}>
            Akzeptieren
          </button>
          <button className="cookie-btn decline-btn" onClick={declineCookies}>
            Ablehnen
          </button>
        </div>
      </div>
    </div>
  );
}
