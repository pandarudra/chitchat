/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Canvas & Surfaces */
        canvas: "var(--canvas)",
        "surface-soft": "var(--surface-soft)",
        "surface-card": "var(--surface-card)",
        "surface-dark": "var(--surface-dark)",
        "surface-dark-elevated": "var(--surface-dark-elevated)",
        "surface-dark-soft": "var(--surface-dark-soft)",

        /* Text Colors */
        ink: "var(--ink)",
        "body-strong": "var(--body-strong)",
        body: "var(--body)",
        muted: "var(--muted)",
        "muted-soft": "var(--muted-soft)",

        /* Primary & States */
        primary: "var(--primary)",
        "primary-active": "var(--primary-active)",
        "primary-disabled": "var(--primary-disabled)",

        /* Dark Mode Text */
        "on-dark": "var(--on-dark)",
        "on-dark-soft": "var(--on-dark-soft)",

        /* Semantic */
        "accent-teal": "var(--accent-teal)",
        "accent-amber": "var(--accent-amber)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",

        /* Borders */
        hairline: "var(--hairline)",
        "hairline-soft": "var(--hairline-soft)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
        serif: "var(--font-display)",
      },
      fontSize: {
        /* Display Hierarchy */
        "display-xl": ["64px", { lineHeight: "1.05", letterSpacing: "-1.5px" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-1px" }],
        "display-md": ["36px", { lineHeight: "1.15", letterSpacing: "-0.5px" }],
        "display-sm": ["28px", { lineHeight: "1.2", letterSpacing: "-0.3px" }],

        /* Title Hierarchy */
        "title-lg": ["22px", { lineHeight: "1.3", letterSpacing: "0" }],
        "title-md": ["18px", { lineHeight: "1.4", letterSpacing: "0" }],
        "title-sm": ["16px", { lineHeight: "1.4", letterSpacing: "0" }],

        /* Body & Caption */
        "body-md": ["16px", { lineHeight: "1.55", letterSpacing: "0" }],
        "body-sm": ["14px", { lineHeight: "1.55", letterSpacing: "0" }],
        caption: ["13px", { lineHeight: "1.4", letterSpacing: "0" }],
        "caption-uppercase": [
          "12px",
          { lineHeight: "1.4", letterSpacing: "1.5px" },
        ],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
