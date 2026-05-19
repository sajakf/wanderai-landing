import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-norway)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        gold:       '#C8A36B',
        sand:       '#EBDFD1',
        ivory:      '#F7F4EF',
        terracotta: '#C56A4E',
        teal:       '#517D86',
        slate:      '#2E3538',
      },
    },
  },
  plugins: [],
}

export default config
