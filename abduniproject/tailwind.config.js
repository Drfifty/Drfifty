// ABD UNI PROJECT — Centralized Design System (Arena Canonical)
// Obsidian Canvas Standard #09090b + Neo-White Liquid Pearl #FAFAFA
// Tailwind v4 CSS-first — this config bridges tokens.css vars to utilities for JS-level access + IDE autocomplete
// يربط رموز التصميم المركزية بفئات Tailwind لتوحيد الهوية عبر 5 تطبيقات
/** @type {import('tailwindcss').Config} */
export default {
  // فحص المحتوى عبر جميع التطبيقات الخمسة
  content: [
    './resources/js/**/*.{ts,tsx,js,jsx}',
    './resources/css/**/*.css',
    './resources/views/**/*.blade.php',
  ],
  theme: {
    extend: {
      colors: {
        // خلفية الكانفاس الكوني العميق — Obsidian Standard
        canvas: 'var(--canvas-background)',
        surface: 'var(--surface-primary)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-pearl': 'var(--surface-pearl)',
        'surface-pearl-strong': 'var(--surface-pearl-strong)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        accent: 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        crimson: 'var(--brand-crimson)',
        gold: 'var(--brand-gold)',
        dark: 'var(--canvas-dark)',
        // مجالات — Part 2
        'accent-cyan': 'var(--accent-cyan)',
        'accent-emerald': 'var(--accent-emerald)',
        'accent-amber': 'var(--accent-amber)',
      },
      fontFamily: {
        arabic: ['var(--font-arabic)'],
        latin: ['var(--font-latin)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        'elevation-sm': 'var(--shadow-elevation-sm)',
        'elevation-md': 'var(--shadow-elevation-md)',
        'elevation-lg': 'var(--shadow-elevation-lg)',
      },
      backdropBlur: {
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
