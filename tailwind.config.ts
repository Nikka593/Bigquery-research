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
        bg: "#0b0c10",
        panel: "#15171f",
        panelAlt: "#1d202b",
        border: "#2a2f3d",
        text: "#e6e8ee",
        muted: "#8a91a3",
        accent: "#7aa2ff",
        accentMuted: "#3a4a85",
        danger: "#ff7a7a",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Hiragino Sans",
          "Yu Gothic UI",
          "Meiryo",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
