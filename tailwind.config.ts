import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // rgb(var(--x) / <alpha-value>) is the documented Tailwind pattern
        // for CSS-variable colors that need to support `bg-accent/40`-style
        // opacity modifiers - it requires the variable to hold bare "R G B"
        // channel numbers (see globals.css), not a hex string.
        background: "rgb(var(--color-bg) / <alpha-value>)",
        foreground: "rgb(var(--color-fg) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-muted-fg) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--color-on-accent) / <alpha-value>)",
        // glass/glass-border are already rgba() literals and are only ever
        // used bare (bg-glass, border-glass-border), never with a slash
        // modifier, so they don't need the channel-value treatment.
        glass: "var(--color-glass)",
        "glass-border": "var(--color-glass-border)",
      },
      borderRadius: {
        card: "16px",
        sheet: "24px",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      backdropBlur: {
        xl: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
