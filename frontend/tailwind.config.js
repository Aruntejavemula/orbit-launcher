/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: "#6B8F71",
          soft: "#D4E3D2",
          softer: "#E5EFE3",
          mid: "#A6C2A8",
          dark: "#4F6B54",
          ink: "#2E4332",
          night: "#1A2A1F",
        },
        cream: "#F7F4EE",
        creamDeep: "#EFE9DC",
        paper: "#FFFFFF",
        ink: {
          DEFAULT: "#1F2421",
          muted: "#6B7269",
        },
        line: "#E7E2D9",
        amberish: "#C99A4A",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif", "Inter"],
        display: ["Georgia", "serif", "Fraunces"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,36,33,.04), 0 8px 24px rgba(31,36,33,.06)",
        fab: "0 10px 28px rgba(79,107,84,.45)",
        pop: "0 18px 60px rgba(31,36,33,.18)",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};
