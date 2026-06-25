/**
 * Standalone Tailwind config for compiling the Claude Design preview bundle.
 * Mirrors the color/token mapping of the repo's tailwind.config.js, but drops
 * the tailwindcss-animate plugin (not needed for static cards) so it builds
 * without the project's node_modules / private registry.
 */
const v = (n) => `var(${n})`;

module.exports = {
  content: ["./claude-design-bundle/dist/**/*.html"],
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
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        ink: { 50: v("--ink-50"), 100: v("--ink-100"), 200: v("--ink-200"), 400: v("--ink-400"), 600: v("--ink-600"), 700: v("--ink-700"), 800: v("--ink-800"), 900: v("--ink-900") },
        charge: { 50: v("--charge-50"), 100: v("--charge-100"), 200: v("--charge-200"), 400: v("--charge-400"), 500: v("--charge-500"), 600: v("--charge-600"), 700: v("--charge-700") },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
