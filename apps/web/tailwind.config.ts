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
          50: '#F0F4FF',
          100: '#E0E8FF',
          200: '#C7D6FE',
          300: '#93B4FD',
          400: '#6090FA',
          500: '#3B82F6',
          600: '#315FEA', // color.brand.primary (Editorial Cobalt)
          700: '#254EDB',
          800: '#1E40AF',
          900: '#172554',
          secondary: '#7950B8',
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
      borderRadius: {
        indicator: '4px',
        control: '6px',
        panel: '8px',
        dialog: '10px',
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
        subtle: '0 1px 2px rgb(23 32 51 / 0.06)',
        overlay: '0 12px 32px rgb(23 32 51 / 0.16)',
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'soft-md': '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 12px 32px -4px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
