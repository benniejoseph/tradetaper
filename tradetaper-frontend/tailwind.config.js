import formsPlugin from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
// Forcing a re-read by adding this comment
export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#0D0F10',
        'dark-secondary': '#1A1D1F',
        'accent-green': '#05F2AF',
        'accent-red': '#FF4D4D',
        'text-light-primary': '#E0E0E0',
        'text-light-secondary': '#A0A4A8',
        'accent-green-darker': '#04D99B',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-green-sm': '0 0 8px 0px rgba(5, 242, 175, 0.5)',
        'glow-green-md': '0 0 15px 2px rgba(5, 242, 175, 0.5)',
        'card-modern': '0px 5px 15px rgba(0, 0, 0, 0.2), 0px 2px 5px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [
    formsPlugin,
  ],
}; 