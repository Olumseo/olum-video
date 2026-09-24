import preset from "@olum-video/ui/tailwind-preset";

/**
 * The marketing site extends the shared preset; it does not replace it.
 *
 * `display` is added HERE rather than in packages/ui because the preset is a
 * one-way mirror of olum.ai's token set and the app screens do not use a
 * second display face. A family only earns a place in the preset once a second
 * app needs it — same rule as the component library.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Fraunces carries the section headings, matching olum.ai's
        // --mk-font-head. Instrument Serif (`font-serif`) stays on the big
        // display lines.
        display: ['"Fraunces"', "Georgia", "serif"],
        // The handwritten marginalia. Decorative by definition — it is never
        // used for anything a reader must be able to parse, so its lower
        // legibility at small sizes costs nothing.
        hand: ['"Caveat"', "ui-rounded", "cursive"],
      },
      maxWidth: {
        // One measure used by every prose block on the site, so paragraph
        // widths cannot drift apart section to section.
        readable: "58ch",
      },
    },
  },
};
