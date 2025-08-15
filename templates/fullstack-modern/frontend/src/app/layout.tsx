import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/navigation';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '{{projectName}}',
    template: '%s | {{projectName}}',
  },
  description: 'Modern full-stack application with React, Next.js, and Rust',
  keywords: ['Next.js', 'React', 'TypeScript', 'Rust', 'Full-stack'],
  authors: [{ name: 'Your Team' }],
  creator: 'Your Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: '{{projectName}}',
    description: 'Modern full-stack application with React, Next.js, and Rust',
    siteName: '{{projectName}}',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '{{projectName}}',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '{{projectName}}',
    description: 'Modern full-stack application with React, Next.js, and Rust',
    images: ['/og-image.png'],
    creator: '@yourhandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${firaCode.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}