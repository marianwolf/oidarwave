import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <p>
        {currentYear} by
        <img
          src="https://profilbild.vercel.app/mw.svg"
          width="22"
          alt="Profilbild"
          style={{ verticalAlign: 'middle', marginLeft: '5px', marginRight: '5px' }}
        />
        | Alle Rechte vorbehalten. |{' '}
        <Link href="/impressum" target="_blank" rel="noopener noreferrer">
          Impressum & Datenschutz
        </Link>
      </p>
    </footer>
  );
}
