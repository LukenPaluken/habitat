import type { Config } from "tailwindcss";

// Paper-and-ink palette: warm background, near-black text, and a single accent
// (brick) reserved for the primary action and counters.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F1EDE3",
        sheet: "#FAF8F2",
        ink: "#1B1915",
        graphite: "#4A453C",
        stone: "#6A6355",
        rule: "#D6CFBF",
        "rule-strong": "#B5AC97",
        brick: {
          DEFAULT: "#B8451F",
          deep: "#963614",
          wash: "#F3E0D6",
        },
        moss: { DEFAULT: "#2F5233", wash: "#DDE7D6" },
        ochre: { DEFAULT: "#7A5412", wash: "#F2E4C2" },
        slate: { DEFAULT: "#28496B", wash: "#D9E3EE" },
        // Monthly chart series (validated against the `sheet` background).
        chart: { published: "#1F6BB5", closed: "#B8451F" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "3px",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
