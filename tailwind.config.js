/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0B1120',
        darkCard: '#111827',
        darkSurface: '#1E293B',
        darkBorder: '#334155',
        lightBg: '#F8FAFC',
        lightCard: '#FFFFFF',
        lightBorder: '#E2E8F0',
        primaryIndigo: {
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
