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
          300: '#93B4FD',
          400: '#608FFE',
          500: '#315FEA',
          600: '#254EDB',
          700: '#1E40AF',
          800: '#173082',
          900: '#10225E',
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
          'purple-light': '#F5F0FB',
        },
        sparovia: {
          blue: '#315FEA',
          purple: '#7950B8',
          cta: '#315FEA',
          'cta-hover': '#254EDB',
          navy: '#172033',
          white: '#FFFFFF',
          green: '#25D366',
        },
        brand: {
          primary: '#315FEA', // color.brand.primary (Editorial Cobalt)
          secondary: '#7950B8', // color.brand.secondary (Restrained Purple)
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7950B8',
          600: '#6820AB',
          700: '#53198A',
          800: '#3D1266',
          900: '#2A0B47',
          blue: '#315FEA',
          purple: '#7950B8',
          cta: '#315FEA',
          'cta-hover': '#254EDB',
          navy: '#172033',
        },
        action: {
          primary: '#315FEA',
          hover: '#254EDB',
          pressed: '#1E40AF',
        },
        focus: {
          selected: '#1D4ED8',
        },
        status: {
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
          info: '#1D4ED8',
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
        table: '0px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #315FEA 0%, #7950B8 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #254EDB 0%, #6820AB 100%)',
        'creative-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 240, 251, 0.7) 100%)',
        'studio-canvas': 'radial-gradient(circle at 50% 50%, rgba(243, 246, 250, 0.8) 0%, rgba(255, 255, 255, 1) 100%)',
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
        subtle: '0 1px 2px rgb(23 32 51 / 0.06)',
        overlay: '0 12px 32px rgb(23 32 51 / 0.16)',
        'soft-xs': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        'soft-md': '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 12px 32px -4px rgba(15, 23, 42, 0.08)',
        'soft-xl': '0 20px 40px -8px rgba(15, 23, 42, 0.12)',
        'glass-sm': '0 2px 8px 0 rgba(31, 38, 135, 0.05)',
        'glass-md': '0 8px 24px 0 rgba(31, 38, 135, 0.08)',
        'creative-glow': '0 4px 20px -2px rgba(121, 80, 184, 0.15)',
        'cobalt-glow': '0 4px 20px -2px rgba(49, 95, 234, 0.18)',
      },
    },
  },
  plugins: [],
};
export default config;
