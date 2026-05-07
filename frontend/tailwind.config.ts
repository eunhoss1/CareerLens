import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        line: "#d9dfdc",
        panel: "#f7f9f6",
        brand: "#1f6f78",
        mint: "#16865f",
        amber: "#b7791f",
        coral: "#b94a38",
        night: "#142126",
        paper: "#fbfcf8"
      },
      boxShadow: {
        dossier: "10px 10px 0 #142126",
        panel: "0 16px 40px rgba(20, 33, 38, 0.08)"
      },
      borderRadius: {
        lens: "10px"
      }
    }
  },
  plugins: []
};

export default config;
