import preset from "@olum-video/ui/tailwind-preset";

/**
 * The app extends the shared preset; it does not replace it.
 *
 * `display` (Fraunces) is added here for the same reason the marketing site
 * adds it: the font FILE is already loaded by index.html, and using the same
 * heading face is most of what makes signing in feel like staying on the same
 * site rather than arriving at a different product.
 *
 * It stays out of packages/ui because that preset is a one-way mirror of
 * olum.ai's token set — a family earns a place there once a second app needs
 * it, which is now true, but moving it is a change to the mirror and should be
 * a deliberate separate act rather than a side effect of building a screen.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      maxWidth: {
        // The same measure the marketing site uses, so paragraph widths do not
        // drift between the two halves of the product.
        readable: "58ch",
      },
    },
  },
};
