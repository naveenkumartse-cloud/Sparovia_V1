import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import { WebsiteContentProvider } from '@/components/providers/WebsiteContentProvider';
import { DynamicFavicon } from '@/components/providers/DynamicFavicon';
import { SocialControl } from '@/components/ui/SocialControl';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sparovia | Business Website',
  description: 'Custom Home Interiors, Modular Kitchens, Wardrobes, Living Units & Architectural Window Solutions.',
  keywords: [
    'Interior Design',
    'Modular Kitchens',
    'Architectural Windows',
    'Wardrobes',
    'Living TV Units',
    'Home Interior Solutions',
  ],
  authors: [{ name: 'Sparovia' }],
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Sparovia | Home Interiors & Architectural Systems',
    description: 'Custom Home Interiors, Modular Kitchens, Wardrobes, Living Units & Architectural Window Solutions.',
    type: 'website',
  },
};

export const viewport = {
  colorScheme: 'only light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-charcoal-900 antialiased selection:bg-brand-200 selection:text-brand-900">
        <SmoothScrollProvider>
          <WebsiteContentProvider>
            <DynamicFavicon />
            {children}
          </WebsiteContentProvider>
        </SmoothScrollProvider>
        <SocialControl />
      </body>
    </html>
  );
}
