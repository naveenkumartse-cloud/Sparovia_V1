import type { Metadata } from 'next';
import './globals.css';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import { WebsiteContentProvider } from '@/components/providers/WebsiteContentProvider';
import { DynamicFavicon } from '@/components/providers/DynamicFavicon';
import { SocialControl } from '@/components/ui/SocialControl';

export const metadata: Metadata = {
  title: 'KVN Interior | Premium Home Interiors & uPVC Windows',
  description: 'Custom Home Interiors, Modular Kitchens, Luxury Wardrobes, Living Units & Architectural uPVC Window and Door Solutions by KVN Interior.',
  keywords: [
    'KVN Interior',
    'Interior Design Bengaluru',
    'Modular Kitchens',
    'uPVC Windows',
    'uPVC Doors',
    'Luxury Wardrobes',
    'Living TV Units',
    'Home Interior Solutions',
  ],
  authors: [{ name: 'KVN Interior' }],
  icons: {
    icon: [
      { url: '/images/Logo.jpeg', type: 'image/jpeg' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/images/Logo.jpeg', type: 'image/jpeg' },
    ],
  },
  openGraph: {
    title: 'KVN Interior | Premium Home Interiors & uPVC Windows',
    description: 'Custom Home Interiors, Modular Kitchens, Luxury Wardrobes, Living Units & Architectural uPVC Window and Door Solutions by KVN Interior.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'KVN Interior | Premium Home Interiors & uPVC Windows',
    description: 'Custom Home Interiors, Modular Kitchens, Luxury Wardrobes, Living Units & Architectural uPVC Window and Door Solutions by KVN Interior.',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-charcoal-900 antialiased selection:bg-gold-200 selection:text-[#102B50]">
        <SmoothScrollProvider>
          <WebsiteContentProvider>
            <DynamicFavicon />
            {children}
            <SocialControl />
          </WebsiteContentProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
