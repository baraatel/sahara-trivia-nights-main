
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
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
				},
				// Additional eye-friendly colors
				sage: {
					50: 'hsl(150, 25%, 95%)',
					100: 'hsl(150, 25%, 88%)',
					200: 'hsl(150, 25%, 75%)',
					300: 'hsl(150, 25%, 65%)',
					400: 'hsl(150, 25%, 55%)',
					500: 'hsl(150, 25%, 50%)',
					600: 'hsl(150, 25%, 45%)',
					700: 'hsl(150, 25%, 35%)',
					800: 'hsl(150, 25%, 25%)',
					900: 'hsl(150, 25%, 15%)',
				},
				terracotta: {
					50: 'hsl(25, 35%, 95%)',
					100: 'hsl(25, 35%, 88%)',
					200: 'hsl(25, 35%, 78%)',
					300: 'hsl(25, 35%, 68%)',
					400: 'hsl(25, 35%, 58%)',
					500: 'hsl(25, 35%, 50%)',
					600: 'hsl(25, 35%, 42%)',
					700: 'hsl(25, 35%, 34%)',
					800: 'hsl(25, 35%, 26%)',
					900: 'hsl(25, 35%, 18%)',
				},
				warm: {
					50: 'hsl(30, 40%, 98%)',
					100: 'hsl(30, 35%, 95%)',
					200: 'hsl(30, 30%, 90%)',
					300: 'hsl(30, 25%, 85%)',
					400: 'hsl(30, 20%, 75%)',
					500: 'hsl(30, 15%, 65%)',
					600: 'hsl(30, 12%, 55%)',
					700: 'hsl(30, 10%, 45%)',
					800: 'hsl(30, 8%, 35%)',
					900: 'hsl(215, 25%, 27%)',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				'fade-in': {
					from: {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out'
			},
			backdropBlur: {
				xs: '2px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
