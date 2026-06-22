/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
          light: '#4CAF50',
        },
        secondary: '#4CAF50',
        'light-green': '#A5D6A7',
        mint: '#E8F5E9',
        forest: '#1B5E20',
        accent: '#81D4FA',
        'eco-bg': '#F8FFF8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(46, 125, 50, 0.12)',
      },
    },
  },
  plugins: [],
}
