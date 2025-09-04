/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: {
        '3xl': '1.5rem'
      }
    }
  },
  plugins: []
};
