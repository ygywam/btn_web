import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFCF7',
          100: '#FAF8F0',
          200: '#F4EFE0',
          300: '#E9E1CC',
        },
        ink: {
          DEFAULT: '#1E232A',
          muted: '#636D79',
          faint: '#9BA3AF',
        },
        amberAccent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.04)',
        paper: '0 4px 20px -2px rgba(40, 30, 20, 0.07)',
        postit: '2px 3px 12px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
