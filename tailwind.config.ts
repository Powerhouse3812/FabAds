import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			/* Genie 6.0 token-mapped colors (g6-* namespace, var() refs, never raw values) */
  			'g6-primary': 'var(--g6-color-primary)',
  			'g6-primary-hover': 'var(--g6-color-primary-hover)',
  			'g6-primary-active': 'var(--g6-color-primary-active)',
  			'g6-primary-bg': 'var(--g6-color-primary-bg)',
  			'g6-primary-bg-hover': 'var(--g6-color-primary-bg-hover)',
  			'g6-primary-border': 'var(--g6-color-primary-border)',
  			'g6-bg-base': 'var(--g6-color-bg-base)',
  			'g6-bg-container': 'var(--g6-color-bg-container)',
  			'g6-bg-elevated': 'var(--g6-color-bg-elevated)',
  			'g6-bg-spotlight': 'var(--g6-color-bg-spotlight)',
  			'g6-bg-muted': 'var(--g6-color-bg-muted)',
  			'g6-text': 'var(--g6-color-text)',
  			'g6-text-secondary': 'var(--g6-color-text-secondary)',
  			'g6-text-tertiary': 'var(--g6-color-text-tertiary)',
  			'g6-text-disabled': 'var(--g6-color-text-disabled)',
  			'g6-text-on-accent': 'var(--g6-color-text-on-accent)',
  			'g6-border': 'var(--g6-color-border)',
  			'g6-border-secondary': 'var(--g6-color-border-secondary)',
  			'g6-error': 'var(--g6-color-error)',
  			'g6-warning': 'var(--g6-color-warning)',
  			'g6-success': 'var(--g6-color-success)',

  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'g6-xs': 'var(--g6-radius-xs)',
  			'g6-sm': 'var(--g6-radius-sm)',
  			'g6-base': 'var(--g6-radius-base)',
  			'g6-lg': 'var(--g6-radius-lg)',
  			'g6-card': 'var(--g6-radius-card)',
  			'g6-xl': 'var(--g6-radius-xl)',
  			'g6-2xl': 'var(--g6-radius-2xl)',
  			'g6-pill': 'var(--g6-radius-pill)'
  		},
  		boxShadow: {
  			'g6-sm': 'var(--g6-shadow-sm)',
  			'g6-md': 'var(--g6-shadow-md)',
  			'g6-lg': 'var(--g6-shadow-lg)',
  			'g6-xl': 'var(--g6-shadow-xl)',
  			'g6-glow': 'var(--g6-shadow-glow)',
  			'g6-primary-btn': 'var(--g6-shadow-primary-btn)',
  			'g6-input-active': 'var(--g6-shadow-input-active)'
  		},
  		fontSize: {
  			'g6-xs': ['11px', '16px'],
  			'g6-sm': ['12px', '20px'],
  			'g6-base': ['14px', '22px'],
  			'g6-lg': ['16px', '24px'],
  			'g6-xl': ['20px', '28px'],
  			'g6-h5': ['16px', '24px'],
  			'g6-h4': ['20px', '28px'],
  			'g6-h3': ['24px', '32px'],
  			'g6-h2': ['30px', '38px'],
  			'g6-h1': ['38px', '46px'],
  			'g6-display': ['56px', '60px'],
  			'g6-display-lg': ['72px', '76px']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			// Studio v3 — glass/gradient/animation system (A-11.22 lab)
  			'v3-shimmer': {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			},
  			'v3-sheen': {
  				'0%': { transform: 'translateX(-120%) skewX(-20deg)' },
  				'60%, 100%': { transform: 'translateX(220%) skewX(-20deg)' }
  			},
  			'v3-float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-2px)' }
  			},
  			'v3-pop-in': {
  				'0%': { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
  				'100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
  			},
  			'v3-pulse-ring': {
  				'0%': { boxShadow: '0 0 0 0 rgba(195,235,66,0.55)' },
  				'70%': { boxShadow: '0 0 0 8px rgba(195,235,66,0)' },
  				'100%': { boxShadow: '0 0 0 0 rgba(195,235,66,0)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'v3-shimmer': 'v3-shimmer 2.4s linear infinite',
  			'v3-sheen': 'v3-sheen 1.4s ease-in-out',
  			'v3-float': 'v3-float 3s ease-in-out infinite',
  			'v3-pop-in': 'v3-pop-in 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  			'v3-pulse-ring': 'v3-pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  		},
  		fontFamily: {
  			sans: [
  				'Geist',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif',
  				'Apple Color Emoji',
  				'Segoe UI Emoji',
  				'Segoe UI Symbol',
  				'Noto Color Emoji'
  			],
  			'g6-sans': ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
  			'g6-mono': ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Geist Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
