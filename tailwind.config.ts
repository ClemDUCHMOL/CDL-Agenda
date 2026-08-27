import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        available: "#16a34a",
        unavailable: "#dc2626",
        weekend: "#9ca3af",
        brand: {
          DEFAULT: "#1e293b",
          light: "#334155",
        },
      },
    },
  },
  plugins: [],
};
export default config;
