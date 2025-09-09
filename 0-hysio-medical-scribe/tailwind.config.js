/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Hysio Brand Colors (from Brand Style Guide v2)
        'hysio-off-white': '#F8F8F5',
        'hysio-mint': '#A5E1C5',
        'hysio-deep-green': '#004B3A',
        'hysio-deep-green-900': '#003728',
        'hysio-mint-dark': '#5BC49E',
        'hysio-emerald': '#10B981',
        
        // Module-specific accent colors
        'hysio-pro': '#003728',
        'hysio-go': '#5BC49E',
        'hysio-scribe': '#003728',
        'hysio-assistant': '#0EA5E9',
        'hysio-red-flag': '#DC2626',
        'hysio-edu': '#65A30D',
        'hysio-reflect': '#FFC043',
        'hysio-education': '#4ADBCD',
        'hysio-smartmail': '#3B82F6',
        'hysio-research': '#9A5BF5',
        'hysio-article': '#D946EF',
        'hysio-community': '#008E7E',
        'hysio-refer': '#F97316',
        'hysio-support': '#64748B',
        'hysio-triage': '#5BC49E',
        'hysio-service': '#34D399',
        'hysio-finder': '#5560FF',
        'hysio-advice': '#F472B6',
        'hysio-athlete': '#FF8A3D',
        'hysio-portal': '#22D3EE',
        'hysio-forum': '#A78BFA',
        
        // CORRECTED SEMANTIC COLORS: Mint-Basis, Donker-Accent Hierarchy
        'background-primary': '#A5E1C5',                 // Mint green - Primary page background
        'background-surface': '#F8F8F5',                 // Off-white - Cards/panels on mint
        'text-primary': '#003728',                       // Deep green 900 - Primary text
        'text-secondary': '#004B3A',                     // Deep green - Secondary text
        'text-muted': 'rgba(0, 55, 40, 0.7)',          // Muted deep green
        'border-primary': '#004B3A',                     // Deep green borders
        'border-muted': 'rgba(0, 75, 58, 0.2)',        // Subtle borders
        'accent-primary': '#003728',                     // Darkest green for emphasis
        'accent-secondary': '#004B3A',                   // Dark green accents
        
        // Tailwind semantic mapping for compatibility
        'background': '#A5E1C5',                         // Default background = mint
        'foreground': '#003728',                         // Default text = deep green
        'primary': '#004B3A',                            // Primary = dark green
        'primary-foreground': '#F8F8F5',                // Text on primary = off-white
        'secondary': '#F8F8F5',                         // Secondary = off-white surfaces
        'secondary-foreground': '#003728',              // Text on secondary = deep green
        'muted': '#A5E1C5',                            // Muted = mint variations
        'muted-foreground': '#003728',                  // Text on muted = deep green
        'card': '#F8F8F5',                             // Cards = off-white
        'card-foreground': '#003728',                   // Card text = deep green
        'border': 'rgba(0, 75, 58, 0.2)',             // Default borders = subtle green
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Brand-compliant typography scale
        'h1': ['3rem', { lineHeight: '1.2', fontWeight: '700' }], // 48px
        'h2': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }], // 36px
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }], // 24px
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }], // 20px
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }], // 16px
        'caption': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }], // 14px
        'button': ['1rem', { lineHeight: '1.2', fontWeight: '600' }], // 16px semi-bold
      },
      borderRadius: {
        // Brand-compliant border radius
        'button': '20px', // Primary CTA buttons
        'input': '8px',   // Input fields and cards
        'card': '8px',    // Cards and panels
        'modal': '8px',   // Modals
      },
      spacing: {
        // 8px baseline grid system
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '30': '7.5rem',   // 120px
      },
      transitionDuration: {
        // Brand-compliant timing
        'brand': '200ms',
        'brand-slow': '300ms',
        'brand-fast': '150ms',
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'brand-in': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'brand-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      boxShadow: {
        'brand-sm': '0 1px 3px rgba(0, 55, 40, 0.1)',
        'brand': '0 2px 4px rgba(0, 55, 40, 0.08)',
        'brand-lg': '0 8px 25px rgba(0, 55, 40, 0.1)',
        'brand-xl': '0 25px 50px rgba(0, 55, 40, 0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hysio-gradient': 'linear-gradient(135deg, #A5E1C5 0%, #C8F1E2 100%)',
      },
      animation: {
        'brand-pulse': 'pulse 1s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
        'brand-fadeIn': 'fadeIn 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'brand-slideUp': 'slideUp 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
      },
    },
  },
  plugins: [],
}