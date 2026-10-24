/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Tiempos Text', 'Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        // Neutres chauds (inspiration Claude / Anthropic)
        ink: {
          50: '#FBF9F5',
          100: '#F3EFE7',
          200: '#E6E0D4',
          300: '#C9C1B4',
          400: '#8F8A84',
          500: '#666362',
          600: '#4A4744',
          700: '#33302D',
          800: '#26231F',
          900: '#191919',
          950: '#141210',
        },
        cream: '#FBF9F5',
        sand: { DEFAULT: '#E6E0D4', line: '#E5DFD5' },
        night: { DEFAULT: '#1A1714', card: '#221F1B', line: '#34302A' },
        accent: { DEFAULT: '#CC5A37', soft: '#DA7756' },
        ochre: '#D97706',
        income: '#6F7F55',
        expense: '#C2603F',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(26, 22, 18, 0.035), 0 1px 2px rgba(26, 22, 18, 0.03)',
        lift: '0 10px 30px -12px rgba(26, 22, 18, 0.12)',
        glow: '0 8px 24px -10px rgba(204, 90, 55, 0.45)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.2,0.8,0.2,1) both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.2,0.8,0.2,1) both',
      },
    },
  },
  plugins: [],
};
