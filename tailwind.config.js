/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        nca: {
          pink: '#e05c97',
          purple: '#6c63ff',
          dark: '#0f0c29',
          mid: '#1a1a2e',
        }
      }
    },
  },
  plugins: [],
}
