import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6D5BF5",
          ink: "#5A47E0",
          soft: "#EEEBFE",
          border: "#E0DAFC",
        },
        nagmCyan: "#11B6D4",
        line: {
          DEFAULT: "#E8EAEE",
          subtle: "#DADDE3",
        },
        ink: {
          DEFAULT: "#0E1525",
          muted: "#586173",
          soft: "#4A5568",
        },
        sanad: {
          50: "#f5f3ff",
          100: "#ede9fe",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          900: "#4c1d95",
        },
      },
    },
  },
  plugins: [],
};

export default config;
