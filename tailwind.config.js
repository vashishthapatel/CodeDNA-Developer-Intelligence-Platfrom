export default {
  content: ["./index.html", "./app.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        void: "#000000",
        surface: {
          DEFAULT: "#0A0A0A",
          raised: "#121212",
          hover: "#1A1A1A",
        },
        line: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          soft: "rgba(255, 255, 255, 0.04)",
          accent: "rgba(255, 40, 0, 0.40)",
        },
        ink: {
          DEFAULT: "#FFFFFF",
          secondary: "#F1F5F9",
          muted: "#94A3B8",
          faint: "#64748B",
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
        luxe: "0 16px 40px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.07)",
        glow: "0 0 24px -4px rgba(255, 40, 0, 0.35)",
        'glow-sm': "0 0 14px -2px rgba(255, 40, 0, 0.45)",
        'glow-ferrari': "0 0 0 1px rgba(255, 40, 0, 0.40), 0 16px 40px -12px rgba(0, 0, 0, 0.95)",
        'glow-champagne': "0 0 0 1px rgba(255, 40, 0, 0.40), 0 16px 40px -12px rgba(0, 0, 0, 0.95)",
        'glow-apricot': "0 0 0 1px rgba(255, 40, 0, 0.35), 0 16px 40px -12px rgba(0, 0, 0, 0.95)",
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
        "accent-gradient": "linear-gradient(135deg, #0A0A0A 0%, #141414 50%, rgba(255, 40, 0, 0.22) 100%)",
      },
      letterSpacing: {
        luxe: "0.14em",
      },
    },
  },
  plugins: [],
};
