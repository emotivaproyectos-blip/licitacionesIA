/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0B5FFF',
          hover: '#084BD6',
        },
        licitia: {
          blue: '#0B5FFF',
          'blue-hover': '#084BD6',
          'blue-light': '#EDF4FF',
          bg: '#F5F8FC',
          surface: '#FFFFFF',
          text: '#0B1739',
          muted: '#64748B',
          border: '#E4EAF3',
        },
        card: {
          DEFAULT: '#FFFFFF',
          border: '#E4EAF3',
        },
        brand: {
          50: '#EDF4FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#0B5FFF',
          600: '#084BD6',
          700: '#1D4ED8',
          900: '#0B1739',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
