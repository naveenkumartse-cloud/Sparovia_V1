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
        'surface-warm': '#FAF7EE',
        brand: {
          50: '#F0F4FA',
          100: '#E1E9F5',
          200: '#C4D4EB',
          300: '#96B3DC',
          400: '#5E8BC8',
          500: '#2A5EA3',
          600: '#102B50', // KVN Primary Deep Navy (Sampled from official logo)
          700: '#0C2340',
          800: '#091A30',
          900: '#050E1A',
          navy: '#102B50',
          gold: '#C6A052',
          'gold-light': '#DFBE76',
          'gold-dark': '#9E7B35',
          'gold-subtle': '#FAF7EE',
        },
        gold: {
          50: '#FAF8F2',
          100: '#F4EFE0',
          200: '#E9DEC3',
          300: '#DBC99F',
          400: '#C6A052', // KVN Metallic Gold Accent (Sampled from official logo)
          500: '#B89047',
          600: '#9E7B35',
          700: '#7E6128',
          800: '#5F491E',
          900: '#3F3014',
        },
        navy: {
          50: '#F0F4FA',
          100: '#E1E9F5',
          200: '#C4D4EB',
          300: '#96B3DC',
          400: '#5E8BC8',
          500: '#2A5EA3',
          600: '#102B50',
          700: '#0C2340',
          800: '#091A30',
          900: '#050E1A',
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
        subtle: '0 1px 2px rgb(16 43 80 / 0.08)',
        overlay: '0 12px 32px rgb(16 43 80 / 0.16)',
        'soft-sm': '0 1px 3px rgba(16, 43, 80, 0.04), 0 1px 2px rgba(16, 43, 80, 0.02)',
        'soft-md': '0 4px 16px -2px rgba(16, 43, 80, 0.06)',
        'soft-lg': '0 12px 32px -4px rgba(16, 43, 80, 0.08)',
        'gold-glow': '0 0 20px -4px rgba(198, 160, 82, 0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
