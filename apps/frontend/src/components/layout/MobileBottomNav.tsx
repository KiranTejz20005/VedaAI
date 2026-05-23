'use client';

import { Home, BookOpen, Library, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MOBILE_NAV = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard', label: 'Assignments', icon: BookOpen },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/toolkit', label: 'AI Toolkit', icon: Sparkles },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {/* First two items */}
      {MOBILE_NAV.slice(0, 2).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}

      {/* Centre FAB */}
      <Link
        href="/assignments/create"
        className="mobile-nav-fab"
        aria-label="Create Assignment"
      >
        <Plus size={22} aria-hidden="true" />
      </Link>

      {/* Last two items */}
      {MOBILE_NAV.slice(2).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
