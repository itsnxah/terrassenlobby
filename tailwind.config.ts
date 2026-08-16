import type { Config } from "tailwindcss";

/**
 * Farbwelt: ausschließlich das Spektrum Pink → Blau
 * (Pink, Magenta/Fuchsia, Violett, Purpur, Indigo, Blau).
 * Keine Rot-, Orange-, Gelb- oder Grüntöne als Design-Akzente.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07060d",
          900: "#0c0a16",
          800: "#12101f",
          700: "#191627",
        },
        lobby: {
          pink: "#ff4d97",
          fuchsia: "#e879f9",
          violet: "#a78bfa",
          indigo: "#818cf8",
          blue: "#5b9dff",
          // Haupt-Akzente für Verläufe: von Pink nach Blau
          accent: "#ff4d97",
          accent2: "#7aa8ff",
        },
        age18: "#5b9dff",
        age16: "#ff4d97",
      },
      borderRadius: {
        card: "1.75rem",
        xl2: "1.25rem",
      },
      fontSize: {
        "2xs": "0.6875rem",
      },
      boxShadow: {
        glass:
          "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09)",
        glow: "0 10px 40px -12px rgba(255,77,151,0.6)",
        glowBlue: "0 10px 40px -12px rgba(91,157,255,0.6)",
        tile: "0 4px 24px rgba(0,0,0,0.35)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(4%, -6%, 0) scale(1.12)" },
          "66%": { transform: "translate3d(-5%, 4%, 0) scale(0.94)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.85)", opacity: "0.9" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        aurora: "aurora 22s ease-in-out infinite",
        floaty: "floaty 6s ease-in-out infinite",
        pulseRing: "pulseRing 2s cubic-bezier(0.3,0,0.2,1) infinite",
        shimmer: "shimmer 2.2s infinite",
        riseIn: "riseIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
