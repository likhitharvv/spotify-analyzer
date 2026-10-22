/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#121212',   // Spotify's page black
        deep: '#000000',   // sidebar / player black
        card: '#181818',
        raise: '#282828',  // hover surface
        line: '#2e2e2e',
        green: { DEFAULT: '#1ed760', dim: '#1db954' },
        mute: '#b3b3b3',
        faint: '#7f7f7f',
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        eq: {
          '0%, 100%': { transform: 'scaleY(0.25)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
