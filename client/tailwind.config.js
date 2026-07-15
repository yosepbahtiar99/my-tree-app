/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        classic: ['"Libre Baskerville"', 'serif'],
      },
      colors: {
        background: '#FAFAFA',
        foreground: '#18181B',
        primary: {
          DEFAULT: '#92400e', // warm golden brown / amber-700
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#e7e5e4', // stone-200
          foreground: '#44403c',
        },
        accent: {
          DEFAULT: '#f59e0b', // amber-500
          foreground: '#fffbeb',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#737373',
        },
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#92400e',
      }
    },
  },
  plugins: [],
}
