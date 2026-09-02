export default {
  content: ["./index.html", "./app.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0f16",
        void: "#06090e",
        surface: {
          DEFAULT: "#101722",
          raised: "#16202e",
          hover: "#1e2b3d",
        },
        line: {
          DEFAULT: "rgba(218, 185, 134, 0.18)",
          soft: "rgba(226, 232, 240, 0.07)",
          accent: "rgba(218, 185, 134, 0.32)",
        },
        ink: {
          DEFAULT: "#f8fafc",
          secondary: "#cbd5e1",
          muted: "#8494a5",
          faint: "#506173",
        },
        accent: {
          DEFAULT: "#dfbe86",
          light: "#f3e4cb",
          deep: "#b8955c",
          sapphire: "#4f7a9a",
          teal: "#5ea89b",
          tealSoft: "#8fc9bf",
          pearl: "#f8fafc",
          burnt: "#647e92",
          apricot: "#e2a370",
        },
        good: "#5ea89b",
        warn: "#dfbe86",
        bad: "#b85858",
      },
      boxShadow: {
        luxe: "0 28px 72px -36px rgba(0,0,0,0.95)",
        glow: "0 18px 40px -15px rgba(223,190,134,0.45)",
        'glow-champagne': "0 0 0 1px rgba(223,190,134,0.3), 0 8px 24px rgba(223,190,134,0.15)",
        'glow-apricot': "0 0 0 1px rgba(226,163,112,0.3), 0 8px 24px rgba(226,163,112,0.2)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(72rem 40rem at 18% -12%, rgba(223,190,134,0.10), transparent 55%), radial-gradient(62rem 36rem at 82% 10%, rgba(79,122,154,0.10), transparent 55%)",
        "gold-gradient": "linear-gradient(135deg, #f3e4cb 0%, #dfbe86 45%, #b8955c 100%)",
        "accent-gradient": "linear-gradient(135deg, #f7efe1 0%, #dfbe86 40%, #4f7a9a 100%)",
      },
      letterSpacing: {
        luxe: "0.14em",
      },
    },
  },
  plugins: [],
};
