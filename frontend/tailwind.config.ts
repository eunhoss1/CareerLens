import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15202b",
        line: "#d9e2ec",
        panel: "#f7fafc",
        brand: "#2563eb",
        mint: "#0f9f6e",
        amber: "#b7791f",
        coral: "#c2410c"
      }
    }
  },
  plugins: []
};

export default config;
