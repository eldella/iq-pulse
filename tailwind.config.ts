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
        "surface-hover": "var(--color-surface-hover)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warn: "rgb(var(--color-warn) / <alpha-value>)",
      },
      borderRadius: {
        control: "12px",
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
      boxShadow: {
        // The only three accent-glow strengths in the system: -sm for
        // active/selected state, -md for a primary CTA, -lg reserved for
        // the hero's single hover escalation. Replaces the four ad-hoc
        // shadow-accent/NN opacities previously scattered per component.
        "accent-sm": "0 4px 12px -2px rgb(var(--color-accent) / 0.25)",
        "accent-md": "0 8px 24px -4px rgb(var(--color-accent) / 0.3)",
        "accent-lg": "0 16px 40px -8px rgb(var(--color-accent) / 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
