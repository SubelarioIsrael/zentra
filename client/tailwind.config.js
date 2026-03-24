/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        shell: '#f5f5f4',
        panel: '#ffffff',
        text: '#1f2937',
        muted: '#6b7280',
        accent: '#5b6cff',
        darkBg: '#0f172a',
        darkPanel: '#1e293b',
      },
      boxShadow: {
        panel: '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
