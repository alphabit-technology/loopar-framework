/** @type {import('tailwindcss').Config} */

export default {
  mode: 'jit',
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './.loopar/src/**/*.{ts,tsx,js,jsx}',
    './apps/**/*.{tsx,jsx,json}',
    './.loopar/apps/**/*.{tsx,jsx,json}',
    './public/src/*.{ts,tsx,js,jsx}'
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        primeblue: {
          DEFAULT: "hsl(var(--primeblue))",
          foreground: "hsl(var(--primblue-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flipUp: {
          '0%': { transform: 'rotateX(90deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        flipDown: {
          '0%': { transform: 'rotateX(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeInUp: 'fadeInUp 1s ease-in-out',
        flipUp: 'flipUp 1s ease-in-out forwards',
        flipDown: 'flipDown 1s ease-in-out forwards',
      },
      strokeWidth: {
        '2': '2px',
      },
      spacing: {
        sidebarWidth: "250px",
        webSidebarWidth: "270px",
        collapseSidebarWidth: "70px",
        headerHeight: "4rem",
        webHeaderHeight: "5rem",
        footerHeight: "4rem",
        webFooterHeight: "5rem",
      },
      screens: {
        "2xl": "1400px",
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      translate: {
        '20': '5rem', // translate-x-20 = 5rem (80px)
        '30': '7.5rem', // translate-x-30 = 7.5rem (120px)
      },
      scale: {
        '95': '0.95',
        '105': '1.05',
      },
      gridTemplateColumns: {
        // One column, full width
        '[100]': '100%',
        // Two equal columns
        '[50,50]': '50% 50%',
        // Three equal columns
        '[33,33,33]': '33.33% 33.33% 33.33%',
        // Four equal columns
        '[25,25,25,25]': '25% 25% 25% 25%',
        // Five equal columns
        '[20,20,20,20,20]': '20% 20% 20% 20% 20%',
        // Two columns with different widths
        '[66,33]': '66% 33%',
        '[33,66]': '33% 66%',
        '[75,25]': '75% 25%',
        '[25,75]': '25% 75%',
        '[40,60]': '40% 60%',
        '[60,40]': '60% 40%',
        // Three columns with different layouts
        '[20,40,40]': '20% 40% 40%',
        '[40,20,40]': '40% 20% 40%',
        '[50,25,25]': '50% 25% 25%',
        '[25,50,25]': '25% 50% 25%',
        // Six equal columns
        '[16,16,16,16,16,16]': '16.66% 16.66% 16.66% 16.66% 16.66% 16.66%',
        // Two columns with large differences
        '[80,20]': '80% 20%',
        '[20,80]': '20% 80%',
        // Three columns with varied sizes
        '[50,30,20]': '50% 30% 20%',
        '[70,15,15]': '70% 15% 15%',
      },
    },
  }
}