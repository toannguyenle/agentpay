import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#0a0a0a",
        card: "#1a1a1a",
        emerald: "#10b981"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
