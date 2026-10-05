import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8FAFC",
        ink: "#0F172A",
        muted: "#64748B",
        hairline: "#E2E8F0",
        accent: {
          DEFAULT: "#0F766E",
          hover: "#0D9488",
          light: "#CCFBF1",
          dark: "#115E59",
          emerald: "#10B981",
          legacy: "#1F6E5C",
        },
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          900: "#064e3b",
        },
        slate: {
          850: "#131C2E",
          950: "#0B0F17",
        },
        warn: {
          DEFAULT: "#B45309",
          light: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        xl2: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.06)",
        "card-hover": "0 20px 40px -15px rgba(15, 118, 110, 0.12)",
        glow: "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        "glow-lg": "0 0 50px -10px rgba(16, 185, 129, 0.25)",
      },
      animation: {
        "pulse-glow": "pulseGlow 3s infinite ease-in-out",
        "float": "float 4s infinite ease-in-out",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

