/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forest-green': 'var(--forest-green)',
        'dark-green': 'var(--dark-green)',
        'cream': 'var(--cream)',
        'warm-white': 'var(--warm-white)',
        'beige': 'var(--beige)',
        'earth-brown': 'var(--earth-brown)',
        'text-dark': 'var(--text-dark)',
        'muted-text': 'var(--muted-text)',
        'border-light': 'var(--border-light)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
