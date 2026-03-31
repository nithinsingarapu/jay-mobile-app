import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'jay-black': '#000000',
        'jay-dark': '#333333',
        'jay-mid': '#666666',
        'jay-grey': '#999999',
        'jay-light': '#CCCCCC',
        'jay-border': '#E5E5E5',
        'jay-surface': '#F5F5F5',
        'jay-bg': '#FFFFFF',
      },
      fontFamily: {
        'outfit': ['Outfit'],
        'outfit-medium': ['Outfit-Medium'],
        'outfit-semibold': ['Outfit-SemiBold'],
        'outfit-bold': ['Outfit-Bold'],
        'theater': ['Theater-BoldCondensed'],
      },
      fontSize: {
        'page-title': ['24px', { lineHeight: '29px', letterSpacing: '-0.3px', fontWeight: '600' }],
        'section-title': ['18px', { lineHeight: '22px', letterSpacing: '-0.2px', fontWeight: '600' }],
        'card-title': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'secondary': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'small': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'micro': ['10px', { lineHeight: '12px', letterSpacing: '2.5px', fontWeight: '600' }],
        'score-lg': ['24px', { lineHeight: '28px', letterSpacing: '-0.5px', fontWeight: '700' }],
        'score-xl': ['40px', { lineHeight: '44px', letterSpacing: '-1.5px', fontWeight: '700' }],
      },
      borderRadius: {
        'card': '14px',
        'button': '12px',
        'pill': '100px',
        'phone': '48px',
      },
      spacing: {
        'screen': '24px',
        'section': '28px',
        'card-pad': '14px',
      },
      borderWidth: {
        'hairline': '0.5px',
      },
    },
  },
  plugins: [],
} satisfies Config;
