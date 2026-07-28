import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Forest-green LGU identity — full biophilic ramp
        brand: {
          50: "#F1F8F2",
          100: "#DDEEDF",
          200: "#BBDDBE",
          300: "#8FC895",
          400: "#5CA863",
          500: "#2E7D32",
          600: "#256A2A",
          700: "#1B5E20",
          800: "#134417",
          900: "#0C330F",
        },
        // Warm marigold accent / call-to-action
        cta: {
          400: "#FFC845",
          500: "#FBAF17",
          600: "#E19608",
          700: "#C67C00",
          ink: "#3D2C00",
        },
        // River / water accent for falls & bridges
        river: {
          700: "#0F6285",
          500: "#177FA4",
          300: "#63AECB",
          100: "#DBEDF4",
        },
        // True neutral grays — professional dashboard/e-commerce base, not green-tinted
        ink: {
          900: "#191B1D",
          700: "#40454B",
          600: "#5B6169",
          400: "#8B9199",
          100: "#EEF0F2",
        },
        line: "#E5E7EA",
        bg: "#F8F9FB",
        surface: "#FFFFFF",
        ok: "#1B7D2C",
        warn: "#B45309",
        danger: "#B3261E",
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "Segoe UI", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        btn: "12px",
        xl2: "28px",
        blob: "42% 58% 60% 40% / 42% 45% 55% 58%",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,20,.05), 0 10px 26px -8px rgba(15,17,20,.10)",
        pop: "0 6px 16px rgba(15,17,20,.08), 0 24px 48px -14px rgba(15,17,20,.18)",
        focus: "0 0 0 3px rgba(46,125,50,.35)",
      },
      maxWidth: {
        wrap: "1180px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.16,1,.3,1) both",
        float: "float 6s ease-in-out infinite",
        "ken-burns": "ken-burns 12s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
