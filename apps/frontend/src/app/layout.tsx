import type { Metadata } from 'next';
import './globals.css';
import { AppChromeGate } from '@/components/layout/AppChromeGate';
import { ThemeProvider } from '@/components/providers/theme-provider';

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppChromeGate>{children}</AppChromeGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
