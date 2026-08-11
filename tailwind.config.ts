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
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        accent: "var(--color-accent)",
        "accent-foreground": "var(--color-on-accent)",
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
