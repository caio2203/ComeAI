/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B0F14',
          elev: '#11161D',
          card: '#161C26',
        },
        brand: {
          50: '#E8FBF4',
          100: '#C5F4E2',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#B45309',
        },
        protein: '#F87171',
        carb: '#FBBF24',
        fat: '#A78BFA',
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '"SF Pro Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        fab: '0 12px 28px -8px rgba(16, 185, 129, 0.55)',
        tab: '0 -8px 24px -12px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-soft': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
