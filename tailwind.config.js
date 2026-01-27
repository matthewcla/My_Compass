/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/(hub)/**/*.{js,jsx,ts,tsx}",
    "./app/(pcs)/**/*.{js,jsx,ts,tsx}",
    "./app/(assignment)/**/*.{js,jsx,ts,tsx}",
    "./app/(admin)/**/*.{js,jsx,ts,tsx}",
    "./app/(profile)/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        systemGray: "rgb(var(--color-system-gray) / <alpha-value>)",
        systemGray6: "rgb(var(--color-system-gray6) / <alpha-value>)",
        systemBlue: "rgb(var(--color-system-blue) / <alpha-value>)",
        navyBlue: "rgb(var(--color-navy-blue) / <alpha-value>)",
        navyLight: "#1E3A5F",
        navyGold: "rgb(var(--color-navy-gold) / <alpha-value>)",
        systemBackground: "rgb(var(--color-background) / <alpha-value>)",
        labelPrimary: "rgb(var(--color-label-primary) / <alpha-value>)",
        labelSecondary: "rgb(var(--color-label-secondary) / <alpha-value>)",
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
