import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // One accent colour for the whole site (buttons, links, focus rings).
        brand: {
          50: "#eefaf6",
          100: "#d5f2e8",
          200: "#aee4d2",
          300: "#7cceb7",
          400: "#4ab299",
          500: "#2a967f",
          600: "#1e7868",
          700: "#1a6055",
          800: "#184d45",
          900: "#163f3a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
