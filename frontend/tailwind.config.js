/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#d97757",
        "category-data": "#6fcbbe",
        "category-model": "#b5a8e0",
        "category-eval": "#e8c07d",
        surface: "#1a1b23",
      },
    },
  },
  plugins: [],
}

