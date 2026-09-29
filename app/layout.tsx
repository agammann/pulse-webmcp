import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { WebMcpProvider } from '@/components/webmcp-provider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pulse.alx21.chatgpt.site'),
  title: 'Pulse — The open repair memory',
  description:
    'Keep a public repair journal, search reported outcomes, and record observations with ordinary forms or WebMCP.',
  applicationName: 'Pulse',
  alternates: { canonical: '/' },
  keywords: [
    'repair evidence',
    'right to repair',
    'WebMCP',
    'human in the loop',
    'AI agents',
  ],
  openGraph: {
    title: 'Pulse — The open repair memory',
    description: 'Humans test the fix. Agents remember what worked.',
    type: 'website',
    url: '/',
    siteName: 'Pulse',
    images: [
      {
        url: '/og.png',
        width: 1536,
        height: 1024,
        alt: 'Pulse repair evidence network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse — The open repair memory',
    description: 'Humans test the fix. Agents remember what worked.',
    images: ['/og.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Pulse',
  url: 'https://pulse.alx21.chatgpt.site/',
  description: 'The open repair memory for humans and AI agents.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any modern web browser',
  isAccessibleForFree: true,
  codeRepository: 'https://github.com/agammann/pulse-webmcp',
  license: 'https://opensource.org/license/mit',
  featureList: [
    'Search structured repair evidence',
    'Record human-observed diagnostic results',
    'Publish durable repair outcomes',
    'Expose shared application capabilities through WebMCP',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <WebMcpProvider />
      </body>
    </html>
  );
}
