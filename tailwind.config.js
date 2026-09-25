/** Luvhere design tokens (see kive/CLAUDE.md): dark luxury, one pink, one violet. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B070D',
        surface: '#151019',
        elevated: '#1D1621',
        pink: '#FF3F8E',
        violet: '#8747FF',
        ink: '#F7F4F8',
        soft: '#CFC8D6',
        muted: '#AAA3B0',
        quiet: '#8E879A',
        ok: '#32D89B',
        // CRM-only semantic colours (the app has no destructive/warning state)
        warn: '#F5B544',
        danger: '#FF5A6E',
      },
      borderColor: { DEFAULT: 'rgba(255,255,255,0.08)' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      backgroundImage: { brand: 'linear-gradient(135deg, #FF3F8E, #8747FF)' },
      boxShadow: { glow: '0 0 24px rgba(255,63,142,0.22)' },
    },
  },
  plugins: [],
};
