/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: [
   "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
 
  ],
  presets: [require('nativewind/preset')],
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator)-(0|50|100|200|300|400|500|600|700|800|900|950|white|gray|black|error|warning|muted|success|info|light|dark|primary)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          0: '#EB5A10',
          50: '#F7A05C',
          100: '#FFDBB2',
        },
        typography: {
          white: '#FFFFFF',
          gray: '#D4D4D4',
          black: '#181718',
        },
        background: {
          light: '#FBFBFB',
          dark: '#181719',
        },
      },
      fontFamily: {
        "sf-pro": ["SF-Pro"],
        "sf-pro-text-bold": ["SF-Pro-Text-Bold"],
        "sf-pro-text": ["SF-Pro-Text-Regular"],
        "sf-pro-display-black": ["SF-Pro-Display-Black"],
        "sf-pro-display-bold": ["SF-Pro-Display-Bold"],
        "sf-pro-display": ["SF-Pro-Display-Regular"],
        "sf-pro-bold": ["SF-Pro-Text-Bold"],
      },
      fontWeight: {
        extrablack: '950',
      },
      fontSize: {
        '2xs': '10px',
      },
      boxShadow: {
        'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)',
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
        'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)',
        'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)',
      },
    },
  },

};