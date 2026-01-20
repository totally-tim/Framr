/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          light: '#FFFFFF',
          dark: '#1A1A1A',
        },
        background: {
          light: '#FAFAFA',
          dark: '#0F0F0F',
        },
        border: {
          light: '#E5E7EB',
          dark: '#2D2D2D',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
