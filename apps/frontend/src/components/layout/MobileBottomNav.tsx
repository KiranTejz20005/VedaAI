'use client';

import { LayoutGrid, FileText, GraduationCap, Library, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/papers', label: 'Papers', icon: FileText },
  { href: '/syllabus', label: 'Syllabus', icon: GraduationCap },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/toolkit', label: 'Toolkit', icon: Sparkles },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const firstTwo = MOBILE_NAV.slice(0, 2);
  const lastTwo = MOBILE_NAV.slice(2, 4);

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {firstTwo.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`mobile-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}

      <Link href="/assignments/create" className="mobile-nav-fab" aria-label="Create Assignment">
        <Plus size={22} aria-hidden="true" />
      </Link>

      {lastTwo.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`mobile-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}