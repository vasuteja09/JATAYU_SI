/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aerospace: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C4D7EB',
          300: '#9BBDE0',
          400: '#6AA0D1',
          500: '#3D7FC2',
          600: '#2A65A5',
          700: '#1D4D85',
          800: '#143663',
          900: '#0F2855', // Primary brand deep navy
          950: '#081735',
        },
        slate: {
          850: '#152033',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
