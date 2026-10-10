import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
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
        cobalt: {
          DEFAULT: '#315FEA',
          hover: '#254EDB',
          pressed: '#1E40AF',
          50: '#F0F4FF',
          100: '#E0E8FF',
          200: '#C7D6FE',
          500: '#315FEA',
          600: '#254EDB',
          700: '#1E40AF',
        },
        editorial: {
          cobalt: '#315FEA',
          hover: '#254EDB',
          pressed: '#1E40AF',
          navy: '#172033',
          supporting: '#475569',
          surface: '#F3F6FA',
          divider: '#E3E7ED',
          border: '#CBD5E1',
          boundary: '#64748B',
          purple: '#7950B8',
        },
        sparovia: {
          blue: '#3B82F6',
          purple: '#8B3FD1',
          cta: '#FF7043',
          'cta-hover': '#F4511E',
          navy: '#0B1220',
          white: '#FFFFFF',
          green: '#25D366',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B3FD1', // Locked Primary Purple
          600: '#7A28C7',
          700: '#6820AB',
          800: '#53198A',
          900: '#3D1266',
          blue: '#3B82F6', // Locked Primary Blue
          purple: '#8B3FD1', // Locked Primary Purple
          cta: '#FF7043', // Locked Primary CTA Orange
          'cta-hover': '#F4511E',
          navy: '#0B1220', // Locked Dark Navy
          green: '#25D366', // Locked WhatsApp Green
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
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3B82F6 0%, #8B3FD1 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #2563EB 0%, #7A28C7 100%)',
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
