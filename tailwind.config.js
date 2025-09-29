/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          bg: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        border: 'var(--border-color)',
        accent: {
          DEFAULT: 'var(--accent-color)',
          hover: 'var(--accent-hover)',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: {
        '3xl': '1.5rem'
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fadeInScale': 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slideInLeft': 'slideInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'slideInRight': 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'bounceIn': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both'
      },
      keyframes: {
        fadeInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        fadeInScale: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        slideInLeft: {
          'from': {
            opacity: '0',
            transform: 'translateX(-20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        slideInRight: {
          'from': {
            opacity: '0',
            transform: 'translateX(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        bounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)'
          },
          '50%': {
            transform: 'scale(1.05)'
          },
          '70%': {
            transform: 'scale(0.9)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200px 0'
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0'
          }
        },
        shake: {
          '0%, 100%': {
            transform: 'translateX(0)'
          },
          '25%': {
            transform: 'translateX(-2px)'
          },
          '75%': {
            transform: 'translateX(2px)'
          }
        }
      },
      scale: {
        '102': '1.02'
      }
    }
  },
  plugins: []
};
