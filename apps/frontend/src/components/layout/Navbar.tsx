'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, LayoutDashboard, Plus, BookOpen } from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assignments/create', label: 'Create', icon: Plus },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/[0.06]"
      style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)' }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <Brain className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">Veda</span>
            <span className="text-zinc-100">AI</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-300 bg-indigo-500/10'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}

          <Link
            href="/assignments/create"
            className="ml-2 btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={16} />
            New Assessment
          </Link>
        </div>
      </nav>
    </header>
  );
}
