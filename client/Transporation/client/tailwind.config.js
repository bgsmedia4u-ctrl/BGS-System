/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf3',
          100: '#c5d0e0',
          200: '#9fb2cc',
          300: '#7994b8',
          400: '#5c7da8',
          500: '#3f6699',
          600: '#375d8f',
          700: '#2d5182',
          800: '#244576',
          900: '#1a3a5c',
          950: '#0f2238',
        },
        gold: {
          50: '#fdf6e8',
          100: '#fae8c0',
          200: '#f5d896',
          300: '#f0c86c',
          400: '#ecbc4c',
          500: '#c8922a',
          600: '#b5831f',
          700: '#9c7017',
          800: '#845d10',
          900: '#6b4a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
