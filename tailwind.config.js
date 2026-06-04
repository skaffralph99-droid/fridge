/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        frost: {
          bg: '#0F1318',
          dark: '#0F1318',
          card: '#1A2030',
          elevated: '#232E3E',
          border: '#334155',
          steel: '#E8ECF0',
          dim: '#7B8CA0',
          blue: '#10B981',
          cyan: '#10B981',
        }
      }
    }
  },
  plugins: [],
}
