import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        foreground: '#f9fafb',
        muted: '#1f2937',
        'muted-foreground': '#9ca3af',
        primary: '#f59e0b',
        'primary-foreground': '#111827',
        accent: '#22c55e',
        'accent-foreground': '#022c22',
      },
      boxShadow: {
        'glass-soft': '0 18px 45px rgba(15,23,42,0.75)',
      },
    },
  },
} satisfies Config;

