import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: 'Vidya AI — AI-Powered Assessment Creator',
  description:
    'Generate professional exam papers in seconds with AI. Vidya AI helps educators create structured, high-quality assessments effortlessly.',
  keywords: ['AI assessment', 'exam generator', 'question paper', 'teacher tools', 'education AI'],
  icons: {
    icon: [
      { url: '/logo-icon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  openGraph: {
    title: 'Vidya AI — AI-Powered Assessment Creator',
    description: 'Generate professional exam papers in seconds with AI.',
    type: 'website',
    images: ['/logo.png'],
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
        <link rel="icon" type="image/png" href="/logo-icon.png" sizes="any" />
        <link rel="shortcut icon" type="image/png" href="/logo-icon.png" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        {/*
          Inline synchronous script — runs BEFORE React hydration.
          This uses a MutationObserver to catch and remove `bis_skin_checked` and similar attrs
          injected by browser extensions (e.g. Bitdefender) that cause hydration mismatches.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var b=['bis_skin_checked','bis_status','bis_frame_id','bis_register'];
              var o=Element.prototype.setAttribute;
              Element.prototype.setAttribute=function(n,v){if(b.indexOf(n)!==-1)return;o.call(this,n,v);};
              new MutationObserver(function(m){m.forEach(function(r){if(r.type==='attributes'&&b.indexOf(r.attributeName)!==-1){r.target.removeAttribute(r.attributeName);}})}).observe(document.documentElement,{attributes:true,subtree:true});
            })();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <ThemeProvider>
            <CommandPalette />
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
