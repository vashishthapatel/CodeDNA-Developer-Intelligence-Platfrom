export default {
  content: ["./index.html", "./app.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        void: "#000000",
        surface: {
          DEFAULT: "#0A0A0A",
          raised: "#141414",
          hover: "#1A1A1A",
        },
        line: {
          DEFAULT: "rgba(255, 255, 255, 0.12)",
          soft: "rgba(255, 255, 255, 0.06)",
          accent: "rgba(0, 255, 136, 0.35)",
        },
        ink: {
          DEFAULT: "#F0F0F0",
          secondary: "#9CA3AF",
          muted: "rgba(240, 240, 240, 0.72)",
          faint: "rgba(240, 240, 240, 0.48)",
        },
        accent: {
          DEFAULT: "#00FF88",
          light: "#66FFAA",
          deep: "#00CC6A",
          crimson: "#DC2626",
          sapphire: "#00FF88",
          teal: "#10B981",
          tealSoft: "#00FF88",
          pearl: "#F0F9FF",
          burnt: "#00CC6A",
          apricot: "#FFB800",
          amethyst: "#00FF88",
        },
        good: "#10B981",
        warn: "#F59E0B",
        bad: "#EF4444",
      },
      boxShadow: {
        luxe: "0 8px 32px -12px rgba(255, 255, 255,0.12), 0 1px 3px rgba(255, 255, 255,0.06)",
        glow: "0 0 24px -4px rgba(0, 255, 136, 0.30)",
        'glow-sm': "0 0 14px -2px rgba(0, 255, 136, 0.30)",
        'glow-ferrari': "0 0 0 1px rgba(0, 255, 136, 0.30), 0 8px 32px -12px rgba(255, 255, 255, 0.12)",
        'glow-champagne': "0 0 0 1px rgba(0, 255, 136, 0.30), 0 8px 32px -12px rgba(255, 255, 255, 0.12)",
        'glow-apricot': "0 0 0 1px rgba(255, 184, 0, 0.40), 0 8px 32px -12px rgba(255, 255, 255, 0.12)",
        'glow-sapphire': "0 0 24px -4px rgba(79, 195, 247, 0.28)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Cormorant Garamond", "Georgia", "serif"],
        mono: ["Fragment Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(circle at 50% -20%, rgba(0, 255, 136, 0.09) 0%, transparent 70%)",
        "blue-gradient": "linear-gradient(135deg, #FFB800 0%, #00FF88 50%, #00CC6A 100%)",
        "gold-gradient": "linear-gradient(135deg, #F0F9FF 0%, #00FF88 50%, #00CC6A 100%)",
        "red-gradient": "linear-gradient(135deg, #FFB800 0%, #F59E0B 50%, #FFB800 100%)",
        "accent-gradient": "linear-gradient(135deg, #000000 0%, #000000 50%, rgba(0, 255, 136, 0.08) 100%)",
      },
      letterSpacing: {
        luxe: "0.14em",
      },
    },
  },
  plugins: [],
};
