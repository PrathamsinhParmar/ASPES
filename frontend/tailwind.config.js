/** @type {import('tailwindcss').Config} */
module.exports = {
  // Content paths - Tailwind will scan these for class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],

  // Enable dark mode via class strategy
  darkMode: "class",

  theme: {
    extend: {
      // ------------------------------------------------------------------
      // Brand Colors
      // Primary: #2E75B6 (Academic Blue)
      // Secondary: #44546A (Steel Gray-Blue)
      // ------------------------------------------------------------------
      colors: {
        primary: {
          50:  "#EBF3FA",
          100: "#D7E7F5",
          200: "#AFCFEB",
          300: "#87B7E1",
          400: "#5F9FD7",
          500: "#2E75B6",   // Brand primary
          600: "#255E92",
          700: "#1C476D",
          800: "#123049",
          900: "#091824",
        },
        secondary: {
          50:  "#EEF0F3",
          100: "#DCE1E6",
          200: "#B9C3CD",
          300: "#96A5B4",
          400: "#73879B",
          500: "#44546A",   // Brand secondary
          600: "#364355",
          700: "#293240",
          800: "#1B222A",
          900: "#0E1115",
        },
        accent: {
          50:  "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",   // Accent orange (alerts, CTAs)
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        success: {
          50:  "#F0FDF4",
          100: "#DCFCE7",
          500: "#22C55E",
          700: "#15803D",
        },
        warning: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          700: "#B45309",
        },
        danger: {
          50:  "#FFF1F2",
          100: "#FFE4E6",
          500: "#EF4444",
          700: "#B91C1C",
        },
        // Score color bands for AI evaluation results
        score: {
          excellent: "#22C55E",   // 90-100: Excellent
          good:      "#84CC16",   // 75-89:  Good
          average:   "#F59E0B",   // 60-74:  Average
          poor:      "#EF4444",   // 0-59:   Poor
        },
      },

      // ------------------------------------------------------------------
      // Typography
      // ------------------------------------------------------------------
      fontFamily: {
        sans:  ["Figtree", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
        serif: ["Figtree", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      // ------------------------------------------------------------------
      // Spacing & Sizing
      // ------------------------------------------------------------------
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ------------------------------------------------------------------
      // Borders & Radius
      // ------------------------------------------------------------------
      borderRadius: {
        "4xl": "2rem",
      },

      // ------------------------------------------------------------------
      // Shadows
      // ------------------------------------------------------------------
      boxShadow: {
        card:  "0 2px 8px rgba(46, 117, 182, 0.08), 0 0 1px rgba(46, 117, 182, 0.16)",
        "card-hover": "0 8px 24px rgba(46, 117, 182, 0.16), 0 0 1px rgba(46, 117, 182, 0.24)",
        glow:  "0 0 20px rgba(46, 117, 182, 0.4)",
      },
      dropShadow: {
        glow: "0 0 8px rgba(99, 102, 241, 0.5)",
      },

      // ------------------------------------------------------------------
      // Animation
      // ------------------------------------------------------------------
      animation: {
        "fade-in":    "fadeIn 0.3s ease-in-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":  "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      // ------------------------------------------------------------------
      // Background patterns / gradients
      // ------------------------------------------------------------------
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2E75B6 0%, #44546A 100%)",
        "gradient-card":    "linear-gradient(135deg, rgba(46,117,182,0.05) 0%, rgba(68,84,106,0.05) 100%)",
        "hero-pattern":     "url('/src/assets/hero-pattern.svg')",
      },

      // ------------------------------------------------------------------
      // Screens (responsive breakpoints)
      // ------------------------------------------------------------------
      screens: {
        "xs": "475px",
        "3xl": "1920px",
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class",  // Opt-in form resets via class
    }),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),
  ],
};
