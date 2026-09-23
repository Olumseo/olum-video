/**
 * Shared Tailwind preset for every Olum Video app.
 *
 * Colours point at the CHANNEL variables from src/tokens.css and src/spectrum.css
 * and wrap them in `rgb(... / <alpha-value>)`. That placeholder is what lets
 * Tailwind generate opacity modifiers — `bg-ink/90` becomes
 * `rgb(var(--ink-rgb) / 0.9)`.
 *
 * Referencing `var(--ink)` directly here would look fine and work for solid
 * colours, but every `/opacity` variant would silently render transparent.
 *
 * Apps consume this via `presets: [preset]` in their tailwind.config.js.
 */
/**
 * Builds a colour from a channel variable, WITH A LITERAL FALLBACK.
 *
 * The fallback is the important half and it was missing at first. `rgb(var(--x)
 * / 1)` with `--x` undefined is an invalid declaration, so the browser drops it
 * silently and the element renders transparent. On a surface like the showcase
 * panel — near-black, carrying white text — that does not degrade, it
 * disappears: the panel goes see-through and every label on it becomes white
 * text on white paper.
 *
 * There are a dozen ordinary ways for a custom property to go missing: a
 * stylesheet that 404s, an `@import` that did not resolve, a stale build, a
 * consumer that imports the preset without importing the token files. None of
 * them should be able to make words vanish. With a fallback the worst case is
 * "the colour is not themed", which is a cosmetic problem rather than a
 * content one.
 */
const withAlpha = (channels, fallback) =>
  `rgb(var(${channels}, ${fallback}) / <alpha-value>)`;

export default {
  theme: {
    extend: {
      colors: {
        // From tokens.css — a one-way copy of olum.ai. Do not add to this group
        // unless olum.ai has the colour too.
        ink: withAlpha("--ink-rgb", "14 14 14"),
        paper: withAlpha("--paper-rgb", "245 242 236"),
        cream: withAlpha("--cream-rgb", "237 233 223"),
        warm: withAlpha("--warm-rgb", "232 226 213"),
        muted: withAlpha("--muted-rgb", "103 99 91"),
        accent: withAlpha("--accent-rgb", "193 123 63"),
        "accent-2": withAlpha("--accent-2-rgb", "26 58 46"),
        danger: withAlpha("--danger-rgb", "204 68 68"),
        success: withAlpha("--success-rgb", "45 122 79"),

        // From spectrum.css — ours, for the video product.
        //
        // TWO TIERS. The bare names are BRIGHT and are for graphics only:
        // particles, washes, rules, dots. The `-ink` names are the same hues
        // darkened until they clear 4.6:1 on paper, and they are the only ones
        // that may carry type. `text-flare` on a label is a contrast bug;
        // `text-flare-ink` is the same idea that people can actually read.
        flare: withAlpha("--flare-rgb", "255 93 59"),
        amber: withAlpha("--amber-rgb", "237 161 58"),
        teal: withAlpha("--teal-rgb", "20 147 140"),
        indigo: withAlpha("--indigo-rgb", "70 87 216"),
        violet: withAlpha("--violet-rgb", "124 77 214"),

        "flare-ink": withAlpha("--flare-ink-rgb", "173 63 40"),
        "amber-ink": withAlpha("--amber-ink-rgb", "133 90 32"),
        "teal-ink": withAlpha("--teal-ink-rgb", "15 110 105"),
        "indigo-ink": withAlpha("--indigo-ink-rgb", "69 85 212"),
        "violet-ink": withAlpha("--violet-ink-rgb", "117 72 201"),
        "accent-ink": withAlpha("--accent-ink-rgb", "137 87 45"),
        "success-ink": withAlpha("--success-ink-rgb", "41 112 73"),
        "danger-ink": withAlpha("--danger-ink-rgb", "175 58 58"),

        panel: withAlpha("--panel-rgb", "16 15 14"),
      },
      borderColor: {
        // Fallbacks for the same reason as the colours above. A missing
        // `--border` leaves `border-color` at `currentColor`, which paints a
        // hairline in the text colour — on a dark panel that is a white box
        // around everything.
        DEFAULT: "var(--border, rgb(14 14 14 / 0.12))",
        subtle: "var(--border, rgb(14 14 14 / 0.12))",
      },
      borderRadius: {
        // A missing `--radius` is not a subtle regression: every rounded corner
        // on the site squares off at once, which is one of the three symptoms
        // that made this whole class of bug worth closing.
        DEFAULT: "var(--radius, 10px)",
        lg: "var(--radius-lg, 16px)",
        // The showcase panel and the media cards. Big radii are a large part of
        // why the reference sites read as current rather than as 2016.
        panel: "28px",
        card: "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      transitionTimingFunction: {
        /**
         * The site's motion signature.
         *
         * A strong ease-out: it leaves immediately and arrives slowly. Almost
         * every "expensive" interface motion is this shape — the eye reads a
         * fast start as responsive and a slow settle as weighty, and the
         * combination is what separates a considered transition from the
         * browser's default `ease`, which is nearly linear by comparison.
         *
         * Used with LONG durations (500-900ms). The same curve at 150ms is
         * indistinguishable from any other curve.
         */
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
        /** Sharper still, for things that should feel snapped into place. */
        "luxe-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        // Gradients degrade to a flat brand colour rather than to `none`, so a
        // ring or a rule still reads as deliberate if the token is missing.
        spectrum: "var(--spectrum, linear-gradient(90deg, #ff5d3b, #7c4dd6))",
        "spectrum-v": "var(--spectrum-v, linear-gradient(180deg, #ff5d3b, #7c4dd6))",
        // The only one that may be clipped to text — and `.text-spectrum` in
        // index.css keeps an unconditional ink `color` underneath it regardless.
        "spectrum-text": "var(--spectrum-text, linear-gradient(100deg, #bd452c, #7c4dd6))",
      },
    },
  },
  plugins: [],
};
