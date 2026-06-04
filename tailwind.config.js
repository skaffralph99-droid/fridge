/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        frost: {
          bg: '#0C1015',
          dark: '#0C1015',
          card: '#151B23',
          elevated: '#1C242E',
          border: '#2A3441',
          steel: '#E5E9ED',
          dim: '#6B7B8D',
          blue: '#10B981',
          cyan: '#10B981',
        }
      }
    }
  },
  plugins: [],
}
