import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Sparovia',
  description: 'Sparovia Client Platform',
  icons: {
    icon: [
      { url: '/icon.svg?v=v2', type: 'image/svg+xml' },
      { url: '/favicon.png?v=v2', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico?v=v2', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=v2',
    apple: [
      { url: '/apple-icon.png?v=v2', sizes: '180x180', type: 'image/png' },
      { url: '/icon.svg?v=v2', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg?v=v2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=v2" />
        <link rel="shortcut icon" href="/favicon.ico?v=v2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=v2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('sparovia_admin_theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark) || (theme === 'system' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
