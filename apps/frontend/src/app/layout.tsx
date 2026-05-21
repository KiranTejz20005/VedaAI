import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VedaAI — AI-Powered Assessment Creator',
  description:
    'Generate professional exam papers in seconds with AI. VedaAI helps educators create structured, high-quality assessments effortlessly.',
  keywords: ['AI assessment', 'exam generator', 'question paper', 'teacher tools', 'education AI'],
  openGraph: {
    title: 'VedaAI — AI-Powered Assessment Creator',
    description: 'Generate professional exam papers in seconds with AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="app-shell">
          {/* Fixed sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="main-wrapper">
            <TopBar />
            <main className="page-container">{children}</main>
          </div>

          {/* Mobile bottom nav */}
          <MobileBottomNav />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
