/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#fff9ed',
          100: '#fef3d6',
          200: '#fde2ac',
          300: '#fcc878',
          400: '#faa83f',
          500: '#f88f1b',
          600: '#e97211',
          700: '#c25410',
          800: '#9a4114',
          900: '#7d3614',
        },
        gov: {
          green:  '#138808',
          navy:   '#0a2d6b',
          orange: '#FF9933',
          white:  '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
