/** Palette sampled from the Aarsi logo + visiting card. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Sampled directly from the Aarsi logo + visiting card ──
        cream: "#FEF9F0",                                                   // logo background
        blush: { DEFAULT: "#FEDDC5", deep: "#F2BFA3" },                     // "A" letterform
        rose: { DEFAULT: "#AF6C47", dark: "#8C4A2D", light: "#D9A084" },    // rose-gold outline
        pink: { DEFAULT: "#B66570", dark: "#8E4552", light: "#E9B8B6" },    // heart + leaves
        cocoa: { DEFAULT: "#331609", light: "#4E2A1A", dark: "#240F06" },   // visiting-card field
        ink: "#3B2219",
      },
      fontFamily: {
        display: ['"Cormorant Garamond Variable"', '"Noto Serif Devanagari Variable"', "Georgia", "serif"],
        body: ['"Jost Variable"', '"Noto Sans Devanagari Variable"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 14px 34px -16px rgba(62,34,24,.35)",
        card: "0 2px 14px rgba(62,34,24,.07)",
      },
      keyframes: {
        slideIn: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        rise: { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "none" } },
      },
      animation: {
        slideIn: "slideIn .3s cubic-bezier(.22,1,.36,1) both",
        fadeIn: "fadeIn .25s ease both",
        shimmer: "shimmer 1.8s linear infinite",
        marquee: "marquee 38s linear infinite",
        rise: "rise .35s cubic-bezier(.22,1,.36,1) both",
      },
    },
  },
  plugins: [],
};
