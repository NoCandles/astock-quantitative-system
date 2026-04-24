/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stock: {
          up: '#F5455C',    // 涨
          down: '#1BB934',  // 跌
          flat: '#999999',  // 平
        }
      }
    },
  },
  plugins: [],
}
