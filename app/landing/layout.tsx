import type { Metadata } from 'next';
import '../globals.css';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';

export const metadata: Metadata = {
  title: 'KVN Interiors | Home Interiors & uPVC Windows',
  description: 'KVN Interiors — Custom Modular Kitchens, Wardrobes, Living Systems, and uPVC Window Solutions.',
  keywords: [
    'KVN Interiors',
    'Modular Kitchens',
    'uPVC Windows',
    'Wardrobes',
    'Living TV Units',
    'Home Interior Design',
  ],
  authors: [{ name: 'KVN Interiors' }],
  icons: {
    icon: [
      { url: '/icon.png?v=kvn', type: 'image/png' },
      { url: '/icon.svg?v=kvn', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=kvn', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=kvn',
    apple: [
      { url: '/apple-icon.svg?v=kvn', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'KVN Interiors | Home Interiors & uPVC Windows',
    description: 'Custom Home Interiors, Modular Kitchens, Wardrobes, Living Units & uPVC Window Solutions.',
    type: 'website',
  },
  colorScheme: 'light only',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-charcoal-900 antialiased selection:bg-brand-200 selection:text-brand-900">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
