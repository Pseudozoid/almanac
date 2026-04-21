/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
        },
        accent: {
          green: 'var(--color-accent-green)',
          red: 'var(--color-accent-red)',
          blue: 'var(--color-accent-blue)',
          aqua: 'var(--color-accent-aqua)',
          orange: 'var(--color-accent-orange)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        }
      },
      fontFamily: {
        ui: ['Inter', 'sans-serif'],
        code: ['JetBrains Mono', 'FiraCode', 'monospace'],
        imperial: ['PlayfairDisplay_400Regular', 'EBGaramond_400Regular', 'serif'],
        imperialBold: ['PlayfairDisplay_700Bold', 'EBGaramond_700Bold', 'serif'],
      }
    },
  },
  plugins: [],
}
