/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F14',
        panel: '#111827',
        card: '#1F2937', // Slightly lighter than panel for contrast, or stick to #111827 as requested
        border: '#374151', // Subtle slate
        accent: '#3B82F6',
        accentHover: '#2563EB',
      }
    },
  },
  plugins: [],
}
