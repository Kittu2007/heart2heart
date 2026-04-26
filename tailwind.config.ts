import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-rose": "#E8274B",
        "secondary-container": "#e2dfe1",
        "inverse-surface": "#2f3130",
        "surface-bright": "#f9f9f7",
        "tertiary-fixed": "#e4e2e4",
        "surface-variant": "#e2e3e1",
        "on-error": "#ffffff",
        "tertiary-container": "#757476",
        "on-surface-variant": "#5b4041",
        error: "#ba1a1a",
        "on-secondary-container": "#636264",
        "surface-container-high": "#e8e8e6",
        "on-surface": "#1a1c1b",
        "on-primary": "#ffffff",
        "error-container": "#ffdad6",
        "surface-tint": "#bc0b3b",
        "surface-dim": "#dadad8",
        primary: "#b90538",
        "primary-container": "#dc2c4f",
        "surface-container-low": "#f4f4f2",
        "outline-variant": "#e3bdbf",
        "on-secondary-fixed": "#1b1b1d",
        "on-error-container": "#93000a",
        "tertiary-fixed-dim": "#c8c6c8",
        "on-background": "#1a1c1b",
        "on-secondary-fixed-variant": "#474648",
        "inverse-primary": "#ffb2b7",
        "on-tertiary-fixed-variant": "#474649",
        "on-primary-container": "#fffbff",
        outline: "#8f6f71",
        surface: "#f9f9f7",
        "on-tertiary-fixed": "#1b1b1d",
        "on-primary-fixed-variant": "#92002a",
        tertiary: "#5c5b5e",
        "primary-fixed-dim": "#ffb2b7",
        "secondary-fixed": "#e5e2e4",
        "on-tertiary-container": "#fffcfe",
        "primary-fixed": "#ffdadb",
        "secondary-fixed-dim": "#c8c6c8",
        "on-secondary": "#ffffff",
        secondary: "#5f5e60",
        "on-primary-fixed": "#40000d",
        "inverse-on-surface": "#f1f1ef",
        background: "#f9f9f7",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e2e3e1",
        "on-tertiary": "#ffffff",
        "surface-container": "#eeeeec",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      spacing: {
        "s-sm": "8px",
        gutter: "20px",
        "s-xxl": "64px",
        "s-xl": "32px",
        "s-md": "16px",
        margin: "max(20px, 5vw)",
        "s-xs": "4px",
        "s-lg": "24px",
      },
      fontFamily: {
        label: ["Inter", "sans-serif"],
        h1: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        button: ["Inter", "sans-serif"],
        h2: ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        h3: ["Inter", "sans-serif"],
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        label: [
          "13px",
          {
            lineHeight: "1.2",
            letterSpacing: "0.05em",
            fontWeight: "500",
          },
        ],
        h1: [
          "48px",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        display: [
          "80px",
          {
            lineHeight: "1.05",
            letterSpacing: "-0.04em",
            fontWeight: "900",
          },
        ],
        "body-md": [
          "16px",
          {
            lineHeight: "1.5",
            letterSpacing: "0em",
            fontWeight: "400",
          },
        ],
        button: [
          "17px",
          {
            lineHeight: "1",
            letterSpacing: "-0.01em",
            fontWeight: "600",
          },
        ],
        h2: [
          "32px",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            fontWeight: "700",
          },
        ],
        "body-lg": [
          "19px",
          {
            lineHeight: "1.5",
            letterSpacing: "0em",
            fontWeight: "400",
          },
        ],
        h3: [
          "24px",
          {
            lineHeight: "1.3",
            letterSpacing: "0em",
            fontWeight: "600",
          },
        ],
      },
      boxShadow: {
        "apple-card":
          "0 8px 32px rgba(232, 39, 75, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
        "apple-card-hover":
          "0 20px 40px -15px rgba(232, 39, 75, 0.05)",
        "apple-btn":
          "0 8px 16px rgba(232, 39, 75, 0.2)",
        "apple-btn-hover":
          "0 12px 24px rgba(232, 39, 75, 0.25)",
        "social-btn":
          "0 2px 8px rgba(0,0,0,0.02)",
        "social-btn-hover":
          "0 8px 16px rgba(232, 39, 75, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
