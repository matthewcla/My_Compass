/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        systemGray: "#8E8E93",
        systemGray6: "#F2F2F7",
        systemBlue: "#007AFF",
        navyBlue: "#0A1628",
        navyGold: "#C9A227",
      },
      fontFamily: {
        sans: ['System', 'Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        "apple-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "apple-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "apple-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
}

