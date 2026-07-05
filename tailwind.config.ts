import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#f3efff",
          100: "#e7dffe",
          200: "#cfc0fd",
          300: "#b7a0fc",
          400: "#9b7dfa",
          500: "#7C5CFF", // primary violet
          600: "#6341f5",
          700: "#4f2fdb",
          800: "#3c24ab",
          900: "#281a78",
        },
        coral: {
          50: "#fff1ec",
          100: "#ffdfd3",
          200: "#ffbea8",
          300: "#ff9d7c",
          400: "#ff8a66",
          500: "#FF7A59", // secondary coral
          600: "#e95b3a",
          700: "#b94224",
          800: "#892e17",
          900: "#591c0c",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399", // primary success green
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        ink: {
          50: "#f7f7fa",
          100: "#ececf2",
          200: "#d6d6e0",
          300: "#a9a9bd",
          400: "#7c7c95",
          500: "#5a5a72",
          600: "#3f3f55",
          700: "#2a2a3d",
          800: "#181826",
          900: "#0F0F17",
          950: "#0A0A0F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter2: "-0.025em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "soft": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)",
        "soft-lg":
          "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 10px 30px -10px rgba(0,0,0,0.6)",
        "glow-accent":
          "0 10px 30px -8px rgba(124,92,255,0.45), 0 0 0 1px rgba(124,92,255,0.25)",
        "glow-coral":
          "0 10px 30px -8px rgba(255,122,89,0.45), 0 0 0 1px rgba(255,122,89,0.25)",
        "ring-aurora":
          "0 0 0 1px rgba(255,255,255,0.06), 0 0 40px -10px rgba(124,92,255,0.35)",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "32px",
        "3xl": "48px",
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.32, 0.72, 0, 1)",
        "apple-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "apple-in": "cubic-bezier(0.7, 0, 0.84, 0)",
      },
      animation: {
        "fade-in": "fadeIn 0.35s cubic-bezier(0.32,0.72,0,1) both",
        "slide-up": "slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "slide-down": "slideDown 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "blur-in": "blurIn 0.45s cubic-bezier(0.32,0.72,0,1) both",
        "aurora-shift": "auroraShift 14s ease-in-out infinite",
        "shimmer": "shimmer 2.2s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        blurIn: {
          "0%": { filter: "blur(12px)", opacity: "0" },
          "100%": { filter: "blur(0)", opacity: "1" },
        },
        auroraShift: {
          "0%,100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
