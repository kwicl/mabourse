/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Century Gothic (Windows / macOS) ; Questrial (Google Fonts, même dessin géométrique) sur iOS / Android
        sans: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', 'Questrial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', 'Questrial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Tokens de thème (voir src/theme/themes.js) : aucune couleur écrite en dur.
      // fg / fg-muted / surface suivent la surface courante (.surface-main ou .surface-second).
      colors: {
        main: 'rgb(var(--main) / <alpha-value>)',
        second: 'rgb(var(--second) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'on-main': 'rgb(var(--on-main) / <alpha-value>)',
        'on-second': 'rgb(var(--on-second) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        fg: { DEFAULT: 'rgb(var(--fg) / <alpha-value>)', muted: 'rgb(var(--fg-muted) / <alpha-value>)' },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
      },
      // Texte : variantes ajustées pour rester lisibles (≥ 4.5:1) sur la surface courante
      textColor: {
        accent: 'rgb(var(--accent-ink) / <alpha-value>)',
        success: 'rgb(var(--success-ink) / <alpha-value>)',
        warning: 'rgb(var(--warning-ink) / <alpha-value>)',
        error: 'rgb(var(--error-ink) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 4px 20px rgb(var(--shadow) / 0.10), 0 1px 2px rgb(var(--shadow) / 0.08)',
        lift: '0 10px 30px -12px rgb(var(--shadow) / 0.35)',
        glow: '0 8px 24px -10px rgb(var(--accent) / 0.55)',
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
