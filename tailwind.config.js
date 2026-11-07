export default {
  content: [
    "./index.html",
    "./app.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shared Citrus Pop palette
        obsidian: "#FFFDF2",
        midnight: "#F4F6D7",
        graphite: "#FFFFFF",
        gold: {
          DEFAULT: "#F6C744",
          muted: "#4B7D21",
          deep: "#385D19",
        },
        ivory: "#24301B",
        platinum: "#72785D",
        "grey-mid": "#72785D",
        // Dashboard — Forest palette (keep existing)
        bg: "#FFFDF2",
        void: "#FFFDF2",
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F4F6D7",
          hover: "#EEF0DE",
        },
        line: {
          DEFAULT: "rgba(36, 48, 27, 0.10)",
          soft: "rgba(36, 48, 27, 0.06)",
          accent: "rgba(75, 125, 33, 0.35)",
          iris: "rgba(131, 169, 75, 0.35)",
        },
        ink: {
          DEFAULT: "#24301B",
          secondary: "#72785D",
          muted: "rgba(36, 48, 27, 0.68)",
          faint: "rgba(36, 48, 27, 0.44)",
        },
        accent: {
          DEFAULT: "#4B7D21",
          light: "#F6C744",
          deep: "#385D19",
          crimson: "#D95043",
          iris: "#83A94B",
          sapphire: "#83A94B",
          teal: "#83A94B",
          tealSoft: "#72785D",
          pearl: "#24301B",
          burnt: "#4B7D21",
          apricot: "#4B7D21",
          amethyst: "#83A94B",
        },
        good: "#83A94B",
        warn: "#4B7D21",
        bad: "#D95043",
      },
      boxShadow: {
        luxe: "0 8px 32px -12px rgba(51, 63, 25, 0.12), 0 1px 3px rgba(36, 48, 27, 0.04)",
        glow: "0 12px 28px -18px rgba(75, 125, 33, 0.38)",
        "glow-sm": "0 8px 18px -14px rgba(75, 125, 33, 0.32)",
        "glow-gold": "0 0 40px -10px rgba(246, 199, 68, 0.3)",
        "glow-iris": "0 12px 28px -18px rgba(131, 169, 75, 0.32)",
        "glow-apricot": "0 12px 28px -18px rgba(246, 199, 68, 0.32)",
        "glow-ferrari": "0 0 0 1px rgba(75, 125, 33, 0.28), 0 8px 32px -12px rgba(51, 63, 25, 0.12)",
        "glow-champagne": "0 0 0 1px rgba(131, 169, 75, 0.28), 0 8px 32px -12px rgba(51, 63, 25, 0.12)",
        "glow-sapphire": "0 12px 28px -18px rgba(131, 169, 75, 0.32)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Cormorant Garamond", "Georgia", "serif"],
        mono: ["Fragment Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(circle at 50% -20%, rgba(75, 125, 33, 0.10) 0%, transparent 70%)",
        "gold-gradient": "linear-gradient(135deg, #F6C744 0%, #4B7D21 100%)",
        "gold-shine": "linear-gradient(135deg, #E8D5A3 0%, #F6C744 40%, #4B7D21 100%)",
        "blue-gradient": "linear-gradient(135deg, #4B7D21 0%, #83A94B 100%)",
        "dna-gradient": "linear-gradient(135deg, #4B7D21 0%, #83A94B 100%)",
        "accent-gradient": "linear-gradient(135deg, #FFFDF2 0%, #FFFFFF 50%, rgba(75, 125, 33, 0.08) 100%)",
        "hero-radial": "radial-gradient(ellipse at 50% 60%, rgba(246,199,68,0.12) 0%, transparent 60%)",
        "section-fade": "linear-gradient(to bottom, transparent, #FFFDF2)",
      },
      letterSpacing: {
        luxe: "0.14em",
        wider: "0.08em",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(246,199,68,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(246,199,68,0.4)" },
        },
      },
      transitionTimingFunction: {
        "luxe": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
