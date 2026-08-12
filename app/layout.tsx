import type { Metadata } from 'next';
import './globals.css';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';

export const metadata: Metadata = {
  title: 'Sparovia Client Edition V1 | Home Interiors & uPVC Windows',
  description: 'Sparovia Digital Showroom — Custom Modular Kitchens, Wardrobes, Living Systems, and uPVC Window Solutions.',
  keywords: [
    'Sparovia Interiors',
    'Modular Kitchens',
    'uPVC Windows',
    'Wardrobes',
    'Living TV Units',
    'Home Interior Design',
  ],
  authors: [{ name: 'Sparovia Client Edition V1' }],
  openGraph: {
    title: 'Sparovia Client Edition V1 | Home Interiors & uPVC Windows',
    description: 'Custom Home Interiors, Modular Kitchens, Wardrobes, Living Units & uPVC Window Solutions.',
    type: 'website',
  },
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
