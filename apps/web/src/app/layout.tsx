import type { Metadata, Viewport } from 'next';
import { Source_Code_Pro, Source_Sans_3 } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import { THEME_SCRIPT } from '@/lib/theme-script';
import './globals.css';

const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source' });
const mono = Source_Code_Pro({ subsets: ['latin'], variable: '--font-source-code' });

export const metadata: Metadata = {
  title: { default: 'OS Lab — Interactive Operating Systems Simulator', template: '%s · OS Lab' },
  description:
    'Learn operating system concepts through interactive simulations of process management, CPU scheduling, memory allocation, page replacement and disk scheduling.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f5' },
    { media: '(prefers-color-scheme: dark)', color: '#1f1e1d' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
