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
        // Photographic editorial palette — warm paper light, true-black darkroom.
        paper: {
          50: '#FBF8F2',
          100: '#F7F4EE',
          200: '#EFEADF',
          300: '#E8E2D6',
          400: '#C9C2B3',
          500: '#A39C8B',
        },
        ink: {
          50: '#F5F2EC',
          100: '#A39C8B',
          400: '#4A4844',
          600: '#2A2823',
          900: '#1B1A18',
          950: '#0F0E0D',
        },
        darkroom: {
          0: '#000000',
          50: '#0B0B0C',
          100: '#131315',
          200: '#1A1A1C',
          300: '#26262A',
          400: '#3A3A3F',
          500: '#5B5B61',
          600: '#8E8E96',
        },
        safelight: {
          DEFAULT: '#C97B3A',
          50: '#F8EEE3',
          100: '#F2DCC2',
          400: '#D49260',
          500: '#C97B3A',
          600: '#A35F25',
          700: '#7F4A1C',
        },
        // Backwards-compat aliases used by existing markup (gradually phased out).
        surface: {
          light: '#FBF8F2',
          dark: '#131315',
        },
        background: {
          light: '#F7F4EE',
          dark: '#0B0B0C',
        },
        border: {
          light: '#E8E2D6',
          dark: '#26262A',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'ui-serif', 'serif'],
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        // 1.200 modular scale (minor third).
        '2xs': ['0.694rem', { lineHeight: '1.1rem' }],
        xs:   ['0.833rem', { lineHeight: '1.2rem' }],
        sm:   ['0.95rem', { lineHeight: '1.4rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg:   ['1.2rem', { lineHeight: '1.55rem' }],
        xl:   ['1.44rem', { lineHeight: '1.7rem' }],
        '2xl': ['1.728rem', { lineHeight: '1.9rem' }],
        '3xl': ['2.074rem', { lineHeight: '2.2rem' }],
        '4xl': ['2.488rem', { lineHeight: '2.5rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
      },
      borderRadius: {
        none: '0',
        xs: '1px',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '12px',
        full: '9999px',
      },
      boxShadow: {
        // Soft, warm shadow for the print-on-table feel.
        print: '0 24px 60px -16px rgba(40, 30, 18, 0.18), 0 12px 24px -8px rgba(40, 30, 18, 0.12)',
        'print-dark': '0 24px 60px -16px rgba(0, 0, 0, 0.6), 0 12px 24px -8px rgba(0, 0, 0, 0.45)',
        hairline: '0 0 0 1px rgba(40, 30, 18, 0.08)',
        'hairline-dark': '0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
}
