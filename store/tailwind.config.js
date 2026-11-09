/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./frontend/src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#2b2524',
        cream: '#f7f0eb',
        rose: '#cf9695',
        'rose-deep': '#a9656f'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'Arial', 'sans-serif']
      },
      boxShadow: {
        bottle: '-13px 15px 12px rgba(75, 47, 41, .16)'
      }
    }
  },
  plugins: []
};
