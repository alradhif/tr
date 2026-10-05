
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  
  
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      
      colors: {
        background: 'oklch(0.985 0.004 150)',
        foreground: 'oklch(0.18 0.015 160)',
        card: 'oklch(1 0 0)',
        'card-foreground': 'oklch(0.18 0.015 160)',
        popover: 'oklch(1 0 0)',
        'popover-foreground': 'oklch(0.18 0.015 160)',
        primary: 'oklch(0.2 0.01 160)',
        'primary-foreground': 'oklch(0.99 0 0)',
        secondary: 'oklch(0.965 0.006 150)',
        'secondary-foreground': 'oklch(0.25 0.015 160)',
        muted: 'oklch(0.97 0.005 150)',
        'muted-foreground': 'oklch(0.55 0.015 160)',
        accent: 'oklch(0.955 0.02 155)',
        'accent-foreground': 'oklch(0.28 0.05 160)',
        destructive: 'oklch(0.6 0.2 25)',
        'destructive-foreground': 'oklch(0.99 0 0)',
        border: 'oklch(0.925 0.008 150)',
        input: 'oklch(0.92 0.008 150)',
        ring: 'oklch(0.68 0.15 158)',
        success: 'oklch(0.66 0.15 158)',
        'success-foreground': 'oklch(0.99 0 0)',
        'success-soft': 'oklch(0.955 0.04 155)',
        warning: 'oklch(0.72 0.15 65)',
        'warning-foreground': 'oklch(0.42 0.12 60)',
        'warning-soft': 'oklch(0.95 0.05 80)',
        info: 'oklch(0.63 0.16 250)',
        'info-foreground': 'oklch(0.48 0.16 255)',
        'info-soft': 'oklch(0.95 0.03 250)',
        'danger-soft': 'oklch(0.96 0.03 25)',
        sidebar: 'oklch(1 0 0)',
        'sidebar-foreground': 'oklch(0.28 0.015 160)',
        'sidebar-accent': 'oklch(0.965 0.02 155)',
        'sidebar-border': 'oklch(0.93 0.008 150)',
        brand: 'oklch(0.72 0.16 158)',
        
        
        'brand-strong': 'oklch(0.6 0.15 160)',
        'brand-soft': 'oklch(0.94 0.05 158)',
        'brand-foreground': 'oklch(0.99 0 0)',
        'level-high': 'oklch(0.55 0.2 22)',
        'level-high-bg': 'oklch(0.95 0.03 22)',
        'level-medium': 'oklch(0.6 0.14 65)',
        'level-medium-bg': 'oklch(0.94 0.06 80)',
        'level-low': 'oklch(0.55 0.14 250)',
        'level-low-bg': 'oklch(0.94 0.03 250)',
      },
      boxShadow: {
        panel: '0 1px 2px oklch(0.2 0.03 160 / 0.05)',
        row: '0 6px 18px oklch(0.2 0.03 160 / 0.08)',
        card: '0 1px 2px oklch(0 0 0 / 0.04), 0 8px 24px oklch(0 0 0 / 0.05)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(100deg, oklch(0.72 0.16 158) 0%, oklch(0.6 0.15 160) 100%)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
