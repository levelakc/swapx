/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          focus: 'hsl(var(--primary-focus))',
          content: 'hsl(var(--primary-content))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          focus: 'hsl(var(--secondary-focus))',
          content: 'hsl(var(--secondary-content))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          focus: 'hsl(var(--accent-focus))',
          content: 'hsl(var(--accent-content))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          focus: 'hsl(var(--destructive-focus))',
          content: 'hsl(var(--destructive-content))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
    },
  },
  plugins: [],
}
