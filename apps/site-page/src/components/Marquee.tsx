/**
 * An endless horizontal strip.
 *
 * The track holds the items TWICE and slides exactly -50% before looping, so
 * the second copy is sitting where the first one started at the moment the
 * animation restarts — the seam is invisible. Animating to -100% with a single
 * copy would leave a gap the width of the viewport at the end of every cycle.
 *
 * EACH COPY MUST BE WIDER THAN THE SCREEN
 * ---------------------------------------
 * That trick only holds while one copy is at least as wide as the viewport.
 * Twelve items were; four short ones ("Founders", "Coaches"…) came to about
 * 700px, so on a wide monitor the strip visibly ran out and left an empty
 * stretch before the loop came round. So the items are repeated inside each
 * copy until it holds at least MIN_PER_COPY of them — comfortably past the
 * widest screen — and the duration scales with the repeats, so the speed a
 * visitor sees does not change with the number of items.
 *
 * Only the very first run of items is read to a screen reader. Everything
 * else is the same list again, and hearing it eight times is worse than no
 * marquee at all.
 */

import type { ReactNode } from "react";

/** Items per copy. ~16 pills is wider than a 2560px screen at any length. */
const MIN_PER_COPY = 16;

export function Marquee({
  items,
  durationSeconds = 42,
  reverse = false,
}: {
  items: ReactNode[];
  /** Seconds for ONE pass of the item list as given. */
  durationSeconds?: number;
  reverse?: boolean;
}) {
  const repeats = Math.max(1, Math.ceil(MIN_PER_COPY / Math.max(1, items.length)));

  const row = (copy: number) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={copy > 0 || undefined}>
      {Array.from({ length: repeats }, (_, r) =>
        items.map((item, i) => (
          <li
            key={`${r}-${i}`}
            aria-hidden={(copy === 0 && r > 0) || undefined}
            className="whitespace-nowrap rounded-full border border-subtle bg-paper/70 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted backdrop-blur-sm"
          >
            {item}
          </li>
        )),
      )}
    </ul>
  );

  return (
    // The mask fades both ends into the page background so the strip reads as
    // continuous rather than as a list that got cut off by a container.
    <div className="marquee-mask overflow-hidden">
      <div
        className="marquee-track flex w-max"
        style={{
          animationDuration: `${durationSeconds * repeats}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
