import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import MouseTracker from '@/components/MouseTracker';

export const metadata: Metadata = {
  title: 'Oidarwave',
  description: 'Oidarwave ist dein Webradio für jeden Geschmack.',
  keywords: ['Webradio', 'Radio', 'Online-Radio', 'Oidarwave'],
  authors: [{ name: 'Marian Wolf' }],
  openGraph: {
    title: 'Oidarwave',
    description: 'Oidarwave ist dein Webradio mit einer großen Auswahl an Sendern.',
    url: '/',
    siteName: 'Oidarwave',
    images: [
      {
        url: '/favicon.svg',
        width: 512,
        height: 512,
        alt: 'Oidarwave Logo',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <MouseTracker />
        <div className="container">
          <Header />
          <main id="radio">{children}</main>
          <Footer />
        </div>
        <CookieBanner />
      </body>
    </html>
  );
}
