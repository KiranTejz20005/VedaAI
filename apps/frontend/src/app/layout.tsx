import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/providers/theme-provider';

export const metadata: Metadata = {
  title: 'Vidya AI — AI-Powered Assessment Creator',
  description:
    'Generate professional exam papers in seconds with AI. Vidya AI helps educators create structured, high-quality assessments effortlessly.',
  keywords: ['AI assessment', 'exam generator', 'question paper', 'teacher tools', 'education AI'],
  openGraph: {
    title: 'Vidya AI — AI-Powered Assessment Creator',
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
      <head>
        {/*
          Inline synchronous script — runs BEFORE React hydration.
          This intercepts setAttribute to block browser extensions (e.g. Built-in Browser)
          from injecting `bis_skin_checked` and similar attrs that cause hydration mismatches.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var b=['bis_skin_checked','bis_status','bis_frame_id','bis_register'];var o=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(b.indexOf(n)!==-1)return;o.call(this,n,v);};})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
