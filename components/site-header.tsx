import Link from 'next/link';
import { ArrowRight, Menu, Wrench } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="site-header app-header">
      <Link className="brand" href="/" aria-label="Pulse home">
        <span className="brand-mark">
          <Wrench />
        </span>
        <span>Pulse</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/repairs">Explore Repairs</Link>
        <Link href="/repair/new">Start a Repair</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/webmcp">About WebMCP</Link>
        <Link href="/about">Mission</Link>
      </nav>
      <Link className="header-cta" href="/repair/new">
        Contribute a repair <ArrowRight />
      </Link>
      <details className="mobile-menu">
        <summary aria-label="Open navigation">
          <Menu />
        </summary>
        <div>
          <Link href="/repairs">Explore Repairs</Link>
          <Link href="/repair/new">Start a Repair</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/webmcp">About WebMCP</Link>
          <Link href="/about">Mission</Link>
        </div>
      </details>
    </header>
  );
}
