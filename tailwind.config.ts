import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: '#18151D',
        foreground: '#F8F7F9',
        card: {
          DEFAULT: '#221F28',
          foreground: '#F8F7F9',
        },
        popover: {
          DEFAULT: '#221F28',
          foreground: '#F8F7F9',
        },
        primary: {
          DEFAULT: '#8C2CFB',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#2D2933',
          foreground: '#F8F7F9',
        },
        muted: {
          DEFAULT: '#2D2933',
          foreground: '#A19EAB',
        },
        accent: {
          DEFAULT: '#36CDFF',
          foreground: '#18151D',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: '#2D2933',
        input: '#2D2933',
        ring: '#8C2CFB',
        chart: {
          '1': '#8C2CFB',
          '2': '#36CDFF',
          '3': '#F8F7F9',
          '4': '#A19EAB',
          '5': '#2D2933',
        },
        sidebar: {
          DEFAULT: '#18151D',
          foreground: '#A19EAB',
          primary: '#8C2CFB',
          'primary-foreground': '#FFFFFF',
          accent: '#2D2933',
          'accent-foreground': '#F8F7F9',
          border: '#2D2933',
          ring: '#8C2CFB',
        },
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(140, 44, 251, 0.4)',
        'neon-teal': '0 0 20px rgba(54, 205, 255, 0.4)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s infinite ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
