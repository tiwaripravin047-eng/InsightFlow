import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Semantic Tokens per DESIGN_SYSTEM.md
        sentiment: {
          positive: {
            DEFAULT: "hsl(var(--sentiment-positive))",
            foreground: "hsl(var(--sentiment-positive-foreground))",
            bg: "hsl(var(--sentiment-positive-bg))",
            border: "hsl(var(--sentiment-positive-border))",
          },
          negative: {
            DEFAULT: "hsl(var(--sentiment-negative))",
            foreground: "hsl(var(--sentiment-negative-foreground))",
            bg: "hsl(var(--sentiment-negative-bg))",
            border: "hsl(var(--sentiment-negative-border))",
          },
          neutral: {
            DEFAULT: "hsl(var(--sentiment-neutral))",
            foreground: "hsl(var(--sentiment-neutral-foreground))",
            bg: "hsl(var(--sentiment-neutral-bg))",
            border: "hsl(var(--sentiment-neutral-border))",
          },
          mixed: {
            DEFAULT: "hsl(var(--sentiment-mixed))",
            foreground: "hsl(var(--sentiment-mixed-foreground))",
            bg: "hsl(var(--sentiment-mixed-bg))",
            border: "hsl(var(--sentiment-mixed-border))",
          },
        },
        severity: {
          low: {
            DEFAULT: "hsl(var(--severity-low))",
            foreground: "hsl(var(--severity-low-foreground))",
            bg: "hsl(var(--severity-low-bg))",
            border: "hsl(var(--severity-low-border))",
          },
          medium: {
            DEFAULT: "hsl(var(--severity-medium))",
            foreground: "hsl(var(--severity-medium-foreground))",
            bg: "hsl(var(--severity-medium-bg))",
            border: "hsl(var(--severity-medium-border))",
          },
          high: {
            DEFAULT: "hsl(var(--severity-high))",
            foreground: "hsl(var(--severity-high-foreground))",
            bg: "hsl(var(--severity-high-bg))",
            border: "hsl(var(--severity-high-border))",
          },
          critical: {
            DEFAULT: "hsl(var(--severity-critical))",
            foreground: "hsl(var(--severity-critical-foreground))",
            bg: "hsl(var(--severity-critical-bg))",
            border: "hsl(var(--severity-critical-border))",
          },
        },
        status: {
          open: {
            DEFAULT: "hsl(var(--status-open))",
            foreground: "hsl(var(--status-open-foreground))",
            bg: "hsl(var(--status-open-bg))",
            border: "hsl(var(--status-open-border))",
          },
          "in-progress": {
            DEFAULT: "hsl(var(--status-in-progress))",
            foreground: "hsl(var(--status-in-progress-foreground))",
            bg: "hsl(var(--status-in-progress-bg))",
            border: "hsl(var(--status-in-progress-border))",
          },
          resolved: {
            DEFAULT: "hsl(var(--status-resolved))",
            foreground: "hsl(var(--status-resolved-foreground))",
            bg: "hsl(var(--status-resolved-bg))",
            border: "hsl(var(--status-resolved-border))",
          },
          verified: {
            DEFAULT: "hsl(var(--status-verified))",
            foreground: "hsl(var(--status-verified-foreground))",
            bg: "hsl(var(--status-verified-bg))",
            border: "hsl(var(--status-verified-border))",
          },
        },
        trend: {
          rising: {
            DEFAULT: "hsl(var(--trend-rising))",
            foreground: "hsl(var(--trend-rising-foreground))",
            bg: "hsl(var(--trend-rising-bg))",
          },
          declining: {
            DEFAULT: "hsl(var(--trend-declining))",
            foreground: "hsl(var(--trend-declining-foreground))",
            bg: "hsl(var(--trend-declining-bg))",
          },
          stable: {
            DEFAULT: "hsl(var(--trend-stable))",
            foreground: "hsl(var(--trend-stable-foreground))",
            bg: "hsl(var(--trend-stable-bg))",
          },
          emerging: {
            DEFAULT: "hsl(var(--trend-emerging))",
            foreground: "hsl(var(--trend-emerging-foreground))",
            bg: "hsl(var(--trend-emerging-bg))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
