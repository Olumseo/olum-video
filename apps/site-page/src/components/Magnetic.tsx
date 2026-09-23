/**
 * A control that leans toward the cursor as it approaches, and springs back
 * when it leaves.
 *
 * Applied to the hero's two calls to action. It is a small effect and it is
 * the reason a button feels responsive before it is even hovered.
 *
 * Only for coarse-pointer-free devices and only when motion is allowed: on a
 * touchscreen there is no cursor to lean toward, so the listeners are never
 * attached at all rather than attached and ignored.
 */

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@olum-video/ui";

/** How far outside its own box the control starts reacting, in px. */
const FIELD = 70;
/** Share of the cursor offset the control actually travels. */
const PULL = 0.32;

export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;

        const inside =
          Math.abs(dx) < rect.width / 2 + FIELD && Math.abs(dy) < rect.height / 2 + FIELD;

        // The transition is declared in CSS, so setting the transform back to
        // zero here is what produces the spring-back — there is no separate
        // "leave" animation to keep in sync.
        node.style.transform = inside
          ? `translate3d(${dx * PULL}px, ${dy * PULL}px, 0)`
          : "translate3d(0, 0, 0)";
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      node.style.transform = "";
    };
  }, [reduced]);

  return (
    <span ref={ref} className="magnetic inline-block">
      {children}
    </span>
  );
}
