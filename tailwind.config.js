export default {
  content: ["./index.html", "./app.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        void: "#FFFFFF",
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F7F7F8",
          hover: "#F0F0F2",
        },
        line: {
          DEFAULT: "rgba(0, 0, 0, 0.10)",
          soft: "rgba(0, 0, 0, 0.06)",
          accent: "rgba(255, 40, 0, 0.30)",
        },
        ink: {
          DEFAULT: "#000000",
          secondary: "#000000",
          muted: "#000000",
          faint: "#000000",
        },
        accent: {
          DEFAULT: "#FF2800",
          light: "#FF2800",
          deep: "#D01E00",
          crimson: "#991400",
          sapphire: "#FF2800",
          teal: "#10B981",
          tealSoft: "#34D399",
          pearl: "#FFFFFF",
          burnt: "#D01E00",
          apricot: "#FF2800",
          amethyst: "#FF2800",
        },
        good: "#10B981",
        warn: "#F59E0B",
        bad: "#FF2800",
      },
      boxShadow: {
        luxe: "0 8px 32px -12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
        glow: "0 0 24px -4px rgba(255, 40, 0, 0.35)",
        'glow-sm': "0 0 14px -2px rgba(255, 40, 0, 0.35)",
        'glow-ferrari': "0 0 0 1px rgba(255, 40, 0, 0.30), 0 8px 32px -12px rgba(0, 0, 0, 0.10)",
        'glow-champagne': "0 0 0 1px rgba(255, 40, 0, 0.30), 0 8px 32px -12px rgba(0, 0, 0, 0.10)",
        'glow-apricot': "0 0 0 1px rgba(255, 40, 0, 0.25), 0 8px 32px -12px rgba(0, 0, 0, 0.10)",
        'glow-sapphire': "0 0 24px -4px rgba(255, 89, 64, 0.22)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Cormorant Garamond", "Georgia", "serif"],
        mono: ["Fragment Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(circle at 50% -20%, rgba(255, 40, 0, 0.08) 0%, transparent 70%)",
        "gold-gradient": "linear-gradient(135deg, #FFFFFF 0%, #FF2800 50%, #D01E00 100%)",
        "red-gradient": "linear-gradient(135deg, #FF5940 0%, #FF2800 50%, #D01E00 100%)",
        "accent-gradient": "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 50%, rgba(255, 40, 0, 0.07) 100%)",
      },
      letterSpacing: {
        luxe: "0.14em",
      },
    },
  },
  plugins: [],
};
