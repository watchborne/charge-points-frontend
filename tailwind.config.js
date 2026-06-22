/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "wb-sm": "var(--r-sm)",
        "wb-md": "var(--r-md)",
        "wb-lg": "var(--r-lg)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        ink: {
          50: "var(--ink-50)",
          100: "var(--ink-100)",
          200: "var(--ink-200)",
          400: "var(--ink-400)",
          600: "var(--ink-600)",
          700: "var(--ink-700)",
          800: "var(--ink-800)",
          900: "var(--ink-900)",
        },
        charge: {
          50: "var(--charge-50)",
          100: "var(--charge-100)",
          200: "var(--charge-200)",
          400: "var(--charge-400)",
          500: "var(--charge-500)",
          600: "var(--charge-600)",
          700: "var(--charge-700)",
        },
        "st-available": {
          100: "var(--st-available-100)",
          500: "var(--st-available-500)",
          700: "var(--st-available-700)",
        },
        "st-charging": {
          100: "var(--st-charging-100)",
          500: "var(--st-charging-500)",
          700: "var(--st-charging-700)",
        },
        "st-error": {
          100: "var(--st-error-100)",
          500: "var(--st-error-500)",
          700: "var(--st-error-700)",
        },
        "st-offline": {
          100: "var(--st-offline-100)",
          500: "var(--st-offline-500)",
          700: "var(--st-offline-700)",
        },
        "st-maint": {
          100: "var(--st-maint-100)",
          500: "var(--st-maint-500)",
          700: "var(--st-maint-700)",
        },
        "bg-page": "var(--bg-page)",
        "bg-surface": "var(--bg-surface)",
        "bg-sunken": "var(--bg-sunken)",
        "text-primary-wb": "var(--text-primary)",
        "text-secondary-wb": "var(--text-secondary)",
        "text-tertiary-wb": "var(--text-tertiary)",
        "border-subtle": "var(--border-subtle)",
        "border-default-wb": "var(--border-default)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        base: "var(--space-base)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
