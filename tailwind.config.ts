import type { Config } from "tailwindcss";

/**
 * "Temple Gold" palette.
 *
 * Semantic token names are kept (gold / cream / charcoal / emerald /
 * burgundy) so existing utility classes keep working. Values are inverted
 * for a deep burgundy surface: "cream" is the page surface, "charcoal" is
 * the ivory text colour, "gold" is the soft-gold accent.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A55A",
          light: "#E3C88A",
          dark: "#E3C88A",
        },
        cream: {
          DEFAULT: "#2A0809", // burgundy surface
          dark: "#1E0606", // deeper burgundy
        },
        burgundy: {
          DEFAULT: "#F0A090", // error / warning tint legible on dark
          light: "#F5B8AB",
          dark: "#E58B80",
        },
        emerald: {
          DEFAULT: "#C9A55A", // category labels share the gold accent
          light: "#E3C88A",
          dark: "#C9A55A",
        },
        charcoal: {
          DEFAULT: "#F3E7CF", // ivory text
          light: "#D8C6A4",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-sarabun)", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Cascadia Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      backgroundImage: {
        // Subtle newsprint tint only; the design avoids decorative gradients.
        "thai-pattern":
          "repeating-linear-gradient(45deg, transparent, transparent 11px, rgba(27,26,23,0.035) 11px, rgba(27,26,23,0.035) 12px)",
      },
    },
  },
  plugins: [],
};
export default config;
