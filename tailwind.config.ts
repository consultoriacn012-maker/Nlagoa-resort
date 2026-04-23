import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lagoa: {
          blue: "#003366",
          orange: "#FF6600",
          yellow: "#FFCC00",
          lightBlue: "#E6F0F9",
          dark: "#001A33"
        }
      },
    },
  },
  plugins: [],
};
export default config;
