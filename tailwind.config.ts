import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./{app,lib,types}/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        suno: {
          50:  "#f0f7ff",
          100: "#e0effe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a5f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
