import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}',
    './app/**/*.css',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Poppins',
  				'sans-serif'
  			]
  		},
  		colors: {
  			shell: '#F5F3FF',
  			surface: {
  				DEFAULT: '#ffffff',
  				border: '#EDE9FE'
  			},
  			canvas: {
  				DEFAULT: '#ffffff',
  				subtle: '#FDFCFF',
  				border: '#EDE9FE'
  			},
  			purple: {
  				DEFAULT: '#7C3AED',
  				mid: '#6D28D9',
  				bright: '#8B5CF6',
  				light: '#EDE9FE',
  				lighter: '#F5F3FF',
  				foreground: '#ffffff'
  			},
  			foreground: {
  				DEFAULT: 'hsl(var(--foreground))',
  				muted: '#6B7280',
  				subtle: '#9CA3AF',
  				inverse: '#ffffff'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  				muted: '#FEE2E2'
  			},
  			success: {
  				DEFAULT: '#16A34A',
  				muted: '#DCFCE7'
  			},
  			warning: {
  				DEFAULT: '#D97706',
  				muted: '#FEF3C7'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))'
  			}
  		},
  		borderRadius: {
  			sm: '4px',
  			DEFAULT: '6px',
  			md: '8px',
  			lg: '10px',
  			xl: '12px',
  			'2xl': '16px',
  			full: '9999px'
  		},
  		fontSize: {
  			'2xs': [
  				'10px',
  				{
  					lineHeight: '14px',
  					letterSpacing: '0.04em'
  				}
  			],
  			xs: [
  				'11px',
  				{
  					lineHeight: '16px'
  				}
  			],
  			sm: [
  				'12px',
  				{
  					lineHeight: '18px'
  				}
  			],
  			base: [
  				'13px',
  				{
  					lineHeight: '20px'
  				}
  			],
  			md: [
  				'14px',
  				{
  					lineHeight: '22px'
  				}
  			],
  			lg: [
  				'16px',
  				{
  					lineHeight: '24px'
  				}
  			],
  			xl: [
  				'18px',
  				{
  					lineHeight: '28px',
  					letterSpacing: '-0.01em'
  				}
  			],
  			'2xl': [
  				'22px',
  				{
  					lineHeight: '30px',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'3xl': [
  				'28px',
  				{
  					lineHeight: '36px',
  					letterSpacing: '-0.025em'
  				}
  			]
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.2s ease-out',
  			'slide-up': 'slideUp 0.25s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			}
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
