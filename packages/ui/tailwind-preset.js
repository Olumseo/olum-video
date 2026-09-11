/**
 * Shared Tailwind preset for every Olum Video app.
 *
 * Colours point at the CHANNEL variables from src/tokens.css and wrap them in
 * `rgb(... / <alpha-value>)`. That placeholder is what lets Tailwind generate
 * opacity modifiers — `bg-ink/90` becomes `rgb(var(--ink-rgb) / 0.9)`.
 *
 * Referencing `var(--ink)` directly here would look fine and work for solid
 * colours, but every `/opacity` variant would silently render transparent.
 *
 * Apps consume this via `presets: [preset]` in their tailwind.config.js.
 */
const withAlpha = (channels) => `rgb(var(${channels}) / <alpha-value>)`;

export default {
  theme: {
    extend: {
      colors: {
        ink: withAlpha("--ink-rgb"),
        paper: withAlpha("--paper-rgb"),
        cream: withAlpha("--cream-rgb"),
        warm: withAlpha("--warm-rgb"),
        muted: withAlpha("--muted-rgb"),
        accent: withAlpha("--accent-rgb"),
        "accent-2": withAlpha("--accent-2-rgb"),
        danger: withAlpha("--danger-rgb"),
        success: withAlpha("--success-rgb"),
      },
      borderColor: {
        DEFAULT: "var(--border)",
        subtle: "var(--border)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
