export default {
  content: ["./index.html", "./app.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FDFCF9",
        void: "#F2EFE9",
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#FFFFFF",
          hover: "#FDFCF9",
        },
        line: {
          DEFAULT: "rgba(15, 26, 32, 0.08)",
          soft: "rgba(15, 26, 32, 0.05)",
          accent: "rgba(194, 164, 122, 0.32)",
        },
        ink: {
          DEFAULT: "#0F1A20",
          secondary: "#33414F",
          muted: "#6B7A89",
          faint: "#9AA8B6",
        },
        accent: {
          DEFAULT: "#C2A47A",
          light: "#E8DCC8",
          deep: "#8C704F",
          sapphire: "#4F6B8A",
          teal: "#6A9A8F",
          tealSoft: "#9ABFB6",
          pearl: "#FDFCF9",
          burnt: "#8C704F",
          apricot: "#C2A47A",
        },
        good: "#6A9A8F",
        warn: "#C2A47A",
        bad: "#B85C4A",
      },
      boxShadow: {
        luxe: "0 12px 32px -16px rgba(15,26,32,0.08), 0 1px 3px rgba(15,26,32,0.04)",
        glow: "0 8px 24px -8px rgba(194,164,122,0.22)",
        'glow-champagne': "0 0 0 1px rgba(194,164,122,0.22), 0 12px 32px -12px rgba(15,26,32,0.10)",
        'glow-apricot': "0 0 0 1px rgba(194,164,122,0.18), 0 12px 32px -12px rgba(15,26,32,0.10)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Cormorant Garamond", "Georgia", "serif"],
        mono: ["Fragment Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "luxury-radial": "none",
        "gold-gradient": "linear-gradient(135deg, #0F1A20 0%, #1E2F3D 100%)",
        "accent-gradient": "linear-gradient(135deg, #0F1A20 0%, #C2A47A 100%)",
      },
      letterSpacing: {
        luxe: "0.14em",
      },
    },
  },
  plugins: [],
};
