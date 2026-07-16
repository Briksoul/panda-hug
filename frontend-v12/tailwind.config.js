/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        panda: {
          bg: '#FFF8F0',
          primary: '#FF8C42',
          secondary: '#4ECDC4',
          dark: '#2D3436',
          light: '#F8E8D0',
          warm: '#FFB347',
          calm: '#87CEEB',
          sad: '#6B7B8D',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'bubble': '20px',
      }
    },
  },
  plugins: [],
}
