/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          darkest: '#090D16',
          dark: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          gold: '#D97706',
          goldLight: '#F59E0B',
          goldGlow: 'rgba(245, 158, 11, 0.15)',
          muted: '#94A3B8',
          text: '#F8FAFC'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
