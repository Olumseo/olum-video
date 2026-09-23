/**
 * An endless horizontal strip.
 *
 * The track holds the items TWICE and slides exactly -50% before looping, so
 * the second copy is sitting where the first one started at the moment the
 * animation restarts — the seam is invisible. Animating to -100% with a single
 * copy would leave a gap the width of the viewport at the end of every cycle.
 *
 * The duplicate is `aria-hidden`: it is the same list read a second time, and
 * a screen reader announcing everything twice is worse than no marquee at all.
 */

import type { ReactNode } from "react";

export function Marquee({
  items,
  durationSeconds = 42,
  reverse = false,
}: {
  items: ReactNode[];
  durationSeconds?: number;
  reverse?: boolean;
}) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li
          key={i}
          className="whitespace-nowrap rounded-full border border-subtle bg-paper/70 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted backdrop-blur-sm"
        >
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    // The mask fades both ends into the page background so the strip reads as
    // continuous rather than as a list that got cut off by a container.
    <div className="marquee-mask overflow-hidden">
      <div
        className="marquee-track flex w-max"
        style={{
          animationDuration: `${durationSeconds}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
