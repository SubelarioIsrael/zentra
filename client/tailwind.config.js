/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        shell: '#f3f6ff',
        panel: '#ffffff',
        text: '#0f172a',
        muted: '#64748b',
        accent: '#4f46e5',
        accentSoft: '#e0e7ff',
        darkBg: '#0b1220',
        darkPanel: '#121a2b',
      },
      boxShadow: {
        panel: '0 8px 20px rgba(15, 23, 42, 0.06)',
        soft: '0 4px 12px rgba(79, 70, 229, 0.12)',
      },
    },
  },
  plugins: [],
};
