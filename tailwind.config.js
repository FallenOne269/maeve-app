/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maeve: {
          gold:   "#D4AF37",
          cyan:   "#7EB8DA",
          navy:   "#0A0818",
          deep:   "#07050F",
          panel:  "#0F0D1E",
          border: "#1E1A3A",
          muted:  "#3A3460",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
