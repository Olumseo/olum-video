/**
 * The near-black panel the real footage sits in.
 *
 * A warm paper page with video tiles dropped straight onto it makes the video
 * look like an illustration. Sunk into near-black, the same tiles read as a
 * screen: the frame stops competing with the footage and the eye goes to the
 * faces. One per page, no exceptions — a second dark surface costs the first
 * one its authority, which is the only reason this one works.
 *
 * The hairline is a 1px gradient edge built as a padded wrapper rather than a
 * `border-image`, which cannot follow a border-radius and would leave square
 * corners on a rounded panel. One pixel, and it is the difference between a
 * black rectangle and a rendered object.
 */

import type { ReactNode } from "react";

export function ProofPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto max-w-7xl rounded-[29px] bg-gradient-to-b from-paper/20 via-paper/5 to-transparent p-px ${className}`}
    >
      <div className="relative overflow-hidden rounded-panel bg-panel px-5 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        {/* Spectrum wash. Very low opacity — it is there to keep the near-black
            from going dead flat, not to be seen as a gradient. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              "radial-gradient(60% 55% at 14% 8%, rgb(var(--flare-rgb)/0.55), transparent 68%), radial-gradient(55% 50% at 88% 88%, rgb(var(--violet-rgb)/0.6), transparent 70%), radial-gradient(42% 42% at 60% 18%, rgb(var(--teal-rgb)/0.45), transparent 70%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}
