import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "primary-text": "#F0F1F5",
        "secondary-text": "#BEC0C9",
        "tertiary-text": "#D7D9E3",
        "placeholder-shade": "#7D8096",
        "dark-shade": "#42444f"
      }
    },
  },
  plugins: [],
};
export default config;
