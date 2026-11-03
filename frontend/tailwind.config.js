/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      colors: {
        primary: '#FF385C',
        secondary: '#E61E4D',
        accent: '#FF385C',
        dark: '#1a1a1a',
        'light-gray': '#F7F7F7',
        'border-color': '#E5E5E5'
      }
    },
  },
  plugins: [],
}

