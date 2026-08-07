/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  presets: [require("@watchborne/electrons/tailwind-preset")],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@watchborne/electrons/dist/**/*.{js,mjs}",
  ],
  plugins: [require("tailwindcss-animate")],
};
