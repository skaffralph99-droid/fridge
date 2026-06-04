/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        frost: {
          bg: '#0A1628',
          dark: '#0D1B2A',
          card: '#132238',
          elevated: '#1A2D47',
          border: '#253D5B',
          steel: '#E8EDF2',
          dim: '#7A8FA6',
          blue: '#3B82F6',
          cyan: '#22D3EE',
        }
      }
    }
  },
  plugins: [],
}
