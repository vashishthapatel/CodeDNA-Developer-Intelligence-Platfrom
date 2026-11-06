export default {
  content: [
    "./index.html",
    "./app.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Landing page — Obsidian palette
        obsidian: "#08090B",
        midnight: "#0D0F12",
        graphite: "#17191E",
        gold: {
          DEFAULT: "#C6A56B",
          muted: "#A88952",
          deep: "#8A6E3C",
        },
        ivory: "#F1EDE5",
        platinum: "#C4C8CE",
        "grey-mid": "#858B95",
        // Dashboard — Forest palette (keep existing)
        bg: "#0B100D",
        void: "#0B100D",
        surface: {
          DEFAULT: "#1B2820",
          raised: "#121A15",
          hover: "#29372D",
        },
        line: {
          DEFAULT: "rgba(241, 238, 229, 0.10)",
          soft: "rgba(241, 238, 229, 0.06)",
          accent: "rgba(185, 154, 93, 0.35)",
          iris: "rgba(128, 145, 123, 0.35)",
        },
        ink: {
          DEFAULT: "#F1EEE5",
          secondary: "#A0AA9D",
          muted: "rgba(241, 238, 229, 0.68)",
          faint: "rgba(241, 238, 229, 0.44)",
        },
        accent: {
          DEFAULT: "#B99A5D",
          light: "#D1B678",
          deep: "#8F7545",
          crimson: "#A66A57",
          iris: "#80917B",
          sapphire: "#80917B",
          teal: "#80917B",
          tealSoft: "#A0AA9D",
          pearl: "#F1EEE5",
          burnt: "#B99A5D",
          apricot: "#B99A5D",
          amethyst: "#80917B",
        },
        good: "#80917B",
        warn: "#B99A5D",
        bad: "#A66A57",
      },
      boxShadow: {
        luxe: "0 8px 32px -12px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(255, 255, 255, 0.04)",
        glow: "0 12px 28px -18px rgba(185, 154, 93, 0.38)",
        "glow-sm": "0 8px 18px -14px rgba(185, 154, 93, 0.32)",
        "glow-gold": "0 0 40px -10px rgba(198, 165, 107, 0.3)",
        "glow-iris": "0 12px 28px -18px rgba(128, 145, 123, 0.32)",
        "glow-apricot": "0 12px 28px -18px rgba(197, 138, 85, 0.32)",
        "glow-ferrari": "0 0 0 1px rgba(185, 154, 93, 0.28), 0 8px 32px -12px rgba(0, 0, 0, 0.5)",
        "glow-champagne": "0 0 0 1px rgba(128, 145, 123, 0.28), 0 8px 32px -12px rgba(0, 0, 0, 0.5)",
        "glow-sapphire": "0 12px 28px -18px rgba(128, 145, 123, 0.32)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Instrument Serif", "Cormorant Garamond", "Georgia", "serif"],
        mono: ["Fragment Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(circle at 50% -20%, rgba(185, 154, 93, 0.10) 0%, transparent 70%)",
        "gold-gradient": "linear-gradient(135deg, #C6A56B 0%, #A88952 100%)",
        "gold-shine": "linear-gradient(135deg, #E8D5A3 0%, #C6A56B 40%, #A88952 100%)",
        "blue-gradient": "linear-gradient(135deg, #B99A5D 0%, #80917B 100%)",
        "dna-gradient": "linear-gradient(135deg, #B99A5D 0%, #80917B 100%)",
        "accent-gradient": "linear-gradient(135deg, #0B100D 0%, #1B2820 50%, rgba(185, 154, 93, 0.08) 100%)",
        "hero-radial": "radial-gradient(ellipse at 50% 60%, rgba(198,165,107,0.08) 0%, transparent 60%)",
        "section-fade": "linear-gradient(to bottom, transparent, #08090B)",
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
          "0%, 100%": { boxShadow: "0 0 20px rgba(198,165,107,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(198,165,107,0.4)" },
        },
      },
      transitionTimingFunction: {
        "luxe": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
