/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/*.{html,ejs,js}'],
  theme: {
    extend: {
      animation: {
        'bg-pulse': 'bg-pulse 5s ease-in infinite'
      },
      keyframes: {
        'bg-pulse' : {
          '50%': { backgroundColor: 'rgb(51 65 85)'} 
        }
      }
    },
  },
  plugins: [],
}
