/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'correct': '#10b981',
        'error': '#ef4444',
        'cursor': '#3b82f6',
        'ipa': '#6366f1',
        // Cyber theme colors
        'cyber-bg': '#050505',
        'cyber-grid': '#0a192f',
        'cyber-primary': '#00f3ff',
        'cyber-secondary': '#bc13fe',
        'cyber-accent': '#ff00ff',
        'cyber-text': '#e0faff',
        'cyber-muted': '#1e3a5f',
        'cyber-success': '#00ff9f',
        'cyber-error': '#ff0055',
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'blink': 'blink 1s step-end infinite',
        'shake': 'shake 0.2s cubic-bezier(.36,.07,.19,.97) both',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        // Cyber theme animations - USED
        'glitch': 'glitch 0.3s cubic-bezier(.25,.46,.45,.94) both',
        'cyber-pulse': 'cyber-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'cyber-glow': 'cyber-glow 2s ease-in-out infinite',
        // Cyber theme animations - EXPERIMENTAL (available for future use)
        'scanline': 'scanline 8s linear infinite',
        'neon-flicker': 'neon-flicker 0.15s ease-in-out infinite alternate',
        'matrix-fall': 'matrix-fall 2s linear infinite',
        'cyber-cursor': 'cyber-cursor 1.2s ease-in-out infinite',
        'energy-pulse': 'energy-pulse 0.4s ease-out',
        'cyber-success': 'cyber-success 0.6s ease-out forwards',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        // Cyber theme keyframes - USED
        'glitch': {
          '0%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
          '10%': { transform: 'translate(-2px, 2px)', filter: 'hue-rotate(90deg)' },
          '20%': { transform: 'translate(-2px, -2px)', filter: 'hue-rotate(180deg)' },
          '30%': { transform: 'translate(2px, 2px)', filter: 'hue-rotate(270deg)' },
          '40%': { transform: 'translate(2px, -2px)', filter: 'hue-rotate(360deg)' },
          '50%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
          '100%': { transform: 'translate(0)', filter: 'hue-rotate(0deg)' },
        },
        'cyber-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
            opacity: '1'
          },
          '50%': {
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor',
            opacity: '0.8'
          },
        },
        // Cyber theme keyframes - EXPERIMENTAL (available for future use)
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'neon-flicker': {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            textShadow: '0 0 4px #fff, 0 0 11px #fff, 0 0 19px #fff, 0 0 40px currentColor, 0 0 80px currentColor',
            opacity: '1',
          },
          '20%, 24%, 55%': {
            textShadow: 'none',
            opacity: '0.8',
          },
        },
        'cyber-glow': {
          '0%, 100%': {
            textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff',
          },
          '50%': {
            textShadow: '0 0 20px #00f3ff, 0 0 30px #00f3ff, 0 0 40px #00f3ff, 0 0 50px #bc13fe',
          },
        },
        'matrix-fall': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'cyber-cursor': {
          '0%, 100%': {
            boxShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, inset 0 0 10px rgba(0, 243, 255, 0.3)',
            borderColor: '#00f3ff',
          },
          '50%': {
            boxShadow: '0 0 20px #bc13fe, 0 0 40px #bc13fe, inset 0 0 15px rgba(188, 19, 254, 0.3)',
            borderColor: '#bc13fe',
          },
        },
        'energy-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'cyber-success': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'cyber': '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff',
        'cyber-lg': '0 0 20px #00f3ff, 0 0 40px #00f3ff, 0 0 60px #00f3ff',
        'cyber-purple': '0 0 10px #bc13fe, 0 0 20px #bc13fe, 0 0 30px #bc13fe',
        'cyber-error': '0 0 10px #ff0055, 0 0 20px #ff0055',
      },
    },
  },
  plugins: [],
}
