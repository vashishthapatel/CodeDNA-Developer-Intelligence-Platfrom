export default {
  content: ["./index.html", "./app.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        void: "#FFFFFF",
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F5F5F7",
          hover: "#EEF2F7",
        },
        line: {
          DEFAULT: "rgba(15, 26, 32, 0.08)",
          soft: "rgba(15, 26, 32, 0.06)",
          accent: "rgba(255, 40, 0, 0.40)",
        },
        ink: {
          DEFAULT: "#0F1A20",
          secondary: "#1E293B",
          muted: "#000000",
          faint: "#000000",
        },
        accent: {
          DEFAULT: "#FF2800",       // Iconic Ferrari Rosso Corsa
          light: "#FF5940",         // Ferrari Bright Flare
          deep: "#D01E00",          // Deep Rosso
          crimson: "#991400",       // Dark Carbon Red
          sapphire: "#FF5940",
          teal: "#10B981",
          tealSoft: "#34D399",
          pearl: "#FFFFFF",
          burnt: "#D01E00",
          apricot: "#FF2800",
          amethyst: "#FF5940",
        },
        good: "#10B981",
        warn: "#F59E0B",
        bad: "#FF2800",
      },
      boxShadow: {
        luxe: "0 16px 40px -12px rgba(15, 26, 32, 0.08), 0 0 0 1px rgba(15, 26, 32, 0.06)",
        glow: "0 0 24px -4px rgba(255, 40, 0, 0.35)",
        'glow-sm': "0 0 14px -2px rgba(255, 40, 0, 0.45)",
        'glow-ferrari': "0 0 0 1px rgba(255, 40, 0, 0.40), 0 16px 40px -12px rgba(15, 26, 32, 0.08)",
        'glow-champagne': "0 0 0 1px rgba(255, 40, 0, 0.40), 0 16px 40px -12px rgba(15, 26, 32, 0.08)",
        'glow-apricot': "0 0 0 1px rgba(255, 40, 0, 0.35), 0 16px 40px -12px rgba(15, 26, 32, 0.08)",
        'glow-sapphire': "0 0 24px -4px rgba(255, 89, 64, 0.28)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Cormorant Garamond", "Georgia", "serif"],
        mono: ["Fragment Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(circle at 50% -20%, rgba(255, 40, 0, 0.12) 0%, transparent 70%)",
        "gold-gradient": "linear-gradient(135deg, #FFFFFF 0%, #FF2800 50%, #D01E00 100%)",
        "red-gradient": "linear-gradient(135deg, #FF5940 0%, #FF2800 50%, #D01E00 100%)",
        "accent-gradient": "linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 50%, rgba(255, 40, 0, 0.10) 100%)",
      },
      letterSpacing: {
        luxe: "0.14em",
      },
    },
  },
  plugins: [],
};
