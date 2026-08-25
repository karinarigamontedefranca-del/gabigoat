import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pasture: {
          DEFAULT: "#0F1B14",
          light: "#17241C",
          lighter: "#1E2E23",
          border: "#2A3B2E",
        },
        lime: {
          DEFAULT: "#C8FF4D",
          dim: "#9BD936",
        },
        horn: "#E8A94C",
        cream: "#F4F1E8",
        muted: "#8FA593",
        danger: "#FF6B57",
        warn: "#F2C744",
        ok: "#5FD98A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(200,255,77,0.25), 0 0 24px rgba(200,255,77,0.08)",
      },
      backgroundImage: {
        grain: "radial-gradient(rgba(244,241,232,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grain: "4px 4px",
      },
    },
  },
  plugins: [],
};
export default config;
