import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#FAFAFA',
        'surface-elevated': '#F8FAFC',
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        charcoal: {
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        muted: {
          400: '#94A3B8',
          500: '#64748B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      spacing: {
        // Strict 8px grid extensions
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
        '26': '6.5rem',  // 104px
        '30': '7.5rem',  // 120px
      },
      boxShadow: {
        'purple-glow': '0 4px 20px rgba(124, 58, 237, 0.18)',
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'soft-md': '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 12px 32px -4px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
