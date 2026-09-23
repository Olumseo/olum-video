/**
 * A number that counts up the first time it is scrolled into view.
 *
 * The easing is `1 - (1 - t)^3`, which sprints and then settles. A linear
 * count reads as a loading spinner; this reads as a number arriving.
 */

import { useEffect, useRef, useState } from "react";

import { useInView, useReducedMotion } from "@olum-video/ui";

const DURATION_MS = 1400;

export function Counter({
  to,
  suffix = "",
  prefix = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref);
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, to, reduced]);

  // Rounded on the way out rather than stored rounded, so a target like 4.5
  // still animates smoothly through its fractional values.
  const shown = Number.isInteger(to) ? Math.round(value) : value.toFixed(1);

  return (
    // `tabular-nums` stops the number jittering horizontally while it counts:
    // proportional digits are different widths, so "111" and "999" do not
    // occupy the same space.
    <span ref={ref} className="tabular-nums">
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
