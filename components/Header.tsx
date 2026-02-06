'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header>
      <div className="logo">🎵 Oidarwave</div>
      <nav aria-label="Hauptnavigation">
        <Link href="/" aria-current={isActive('/') ? 'page' : undefined}>
          Radio
        </Link>
        <Link href="/video" aria-current={isActive('/video') ? 'page' : undefined}>
          Video
        </Link>
        <a href="mailto:marian.wolf2008@gmail.com">Kontakt</a>
        <a href="https://beta0.vercel.app" target="_blank" rel="noopener noreferrer">
          Beta
        </a>
      </nav>
    </header>
  );
}
