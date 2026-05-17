/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0d1321",
        surface2: "#111827",
        border: "#1e2d45",
        accentCyan: "#00f5c4",
        accentPurple: "#7c6dfa",
        accentRed: "#ff6b6b",
        accentYellow: "#ffd93d",
        textMain: "#e8f0fe",
        mutedMain: "#4a6080",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["Inter", "sans-serif"],
        code: ["JetBrains Mono", "monospace"],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'orb-float-1': 'orbFloat1 20s infinite ease-in-out',
        'orb-float-2': 'orbFloat2 25s infinite ease-in-out',
        'orb-float-3': 'orbFloat3 30s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 10px rgba(0, 245, 196, 0.3))' },
          '50%': { opacity: '1.0', filter: 'drop-shadow(0 0 20px rgba(0, 245, 196, 0.6))' },
        },
        orbFloat1: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(80px, -100px) scale(1.2)' },
        },
        orbFloat2: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1.1)' },
          '50%': { transform: 'translate(-100px, 80px) scale(0.85)' },
        },
        orbFloat3: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(0.95)' },
          '50%': { transform: 'translate(100px, 60px) scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}
