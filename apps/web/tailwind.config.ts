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
        surface: '#FFFFFF',
        'surface-elevated': '#F8FAFC',
        'surface-silver': '#F3F4F5',
        'surface-warm': '#FAF8F2',
        brand: {
          50: '#EEF2FC',
          100: '#DCE4F8',
          200: '#BDCEF2',
          300: '#92B0E9',
          400: '#5E8BDD',
          500: '#2B5EC7',
          600: '#011E75', // Official KVN Royal Navy Blue
          700: '#01185E',
          800: '#011247',
          900: '#000D33',
          navy: '#011E75',
          gold: '#CE9E34',
          'gold-light': '#DFB95C',
          'gold-dark': '#A87D20',
          'gold-subtle': '#FAF8F2',
        },
        gold: {
          50: '#FAF8F2',
          100: '#F5EEDC',
          200: '#EBDEBA',
          300: '#DFCA8F',
          400: '#CE9E34', // Official KVN Metallic Gold
          500: '#BA8B27',
          600: '#9E741B',
          700: '#7E5A12',
          800: '#5F420B',
          900: '#3F2B05',
        },
        navy: {
          50: '#EEF2FC',
          100: '#DCE4F8',
          200: '#BDCEF2',
          300: '#92B0E9',
          400: '#5E8BDD',
          500: '#2B5EC7',
          600: '#011E75',
          700: '#01185E',
          800: '#011247',
          900: '#000D33',
        },
        charcoal: {
          600: '#475569', // Supporting Text
          700: '#334155',
          800: '#1E293B',
          900: '#172033', // Official KVN Deep Navy Main Text
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
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        // Strict 8px grid extensions
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
        '26': '6.5rem',  // 104px
        '30': '7.5rem',  // 120px
      },
      boxShadow: {
        subtle: '0 1px 2px rgb(1 30 117 / 0.06)',
        overlay: '0 12px 32px rgb(1 30 117 / 0.14)',
        'soft-sm': '0 1px 3px rgba(1, 30, 117, 0.04), 0 1px 2px rgba(1, 30, 117, 0.02)',
        'soft-md': '0 4px 16px -2px rgba(1, 30, 117, 0.06)',
        'soft-lg': '0 12px 32px -4px rgba(1, 30, 117, 0.08)',
        'gold-glow': '0 0 20px -4px rgba(206, 158, 52, 0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
