import type { Config } from "tailwindcss";

// Every color is a CSS variable (see globals.css) holding space-separated RGB, so one
// class like `bg-ink-900` is paper-white in light mode and warm charcoal in dark mode.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name: string, steps: (number | string)[]) =>
  Object.fromEntries(steps.map((step) => [step, token(`${name}-${step}`)]));

const config: Config = {
  darkMode: "media",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Role-based: ink-50 is the strongest text, ink-950 the page background.
        ink: scale("ink", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        accent: scale("accent", [200, 300, 400, 500, 600]),
        coral: scale("coral", [200, 300, 400, 500]),
        success: scale("success", [300, 400, 500]),
        tint: scale("tint", ["sand", "mist", "sage", "rose", "lilac", "butter"]),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter2: "-0.025em",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.06)",
        "soft-lg":
          "0 20px 50px -18px rgb(var(--shadow) / 0.3), 0 2px 8px rgb(var(--shadow) / 0.06)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.32, 0.72, 0, 1)",
        paper: "cubic-bezier(0.2, 0.7, 0.1, 1)",
      },
      // Keyframes live in globals.css.
      animation: {
        "fade-in": "fadeIn 0.45s cubic-bezier(0.2,0.7,0.1,1) both",
        "slide-up": "slideUp 0.6s cubic-bezier(0.2,0.7,0.1,1) both",
        "slide-down": "slideDown 0.5s cubic-bezier(0.2,0.7,0.1,1) both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.2,0.7,0.1,1) both",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        bar: "bar 1.3s cubic-bezier(0.4,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
