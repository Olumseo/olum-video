/**
 * Two pieces shared by every finished-video tile on the site.
 *
 * 1. THE PREVIEW LOOP. Idle, a finished video repeats only its split-screen
 *    stretch — b-roll above, the person below, captions on the seam. That is
 *    the part that shows the edit; the full minute, looping silently, mostly
 *    showed a talking head. Asked for the full video, it starts again from
 *    0:00 and plays through.
 *
 * 2. THE "SEE FULL VIDEO" CURSOR. Hovering a finished video swaps the pointer
 *    for a small pill that follows it, saying what a click does. Mouse only —
 *    a finger has no hover — and only on finished videos: a raw take has no
 *    "full version" to see.
 */

import { useCallback, useEffect, useState } from "react";
import type { PointerEvent, RefObject } from "react";

/** [start, end] in seconds of the split-screen stretch to repeat. */
export type Segment = readonly [number, number];

/**
 * Repeats `segment` while `full` is false; from 0:00 once it turns true.
 *
 * Driven by `timeupdate` (about four times a second), so a loop can overrun
 * its end by a fraction of a second. That is invisible in a muted preview and
 * far simpler than frame callbacks.
 */
export function usePreviewLoop(
  ref: RefObject<HTMLVideoElement>,
  segment: Segment | undefined,
  full: boolean,
) {
  const start = segment?.[0];
  const end = segment?.[1];

  useEffect(() => {
    const video = ref.current;
    if (!video || start === undefined || end === undefined) return;

    if (full) {
      // The whole video, from the beginning — not from wherever the preview
      // happened to be.
      video.currentTime = 0;
      return;
    }

    // Back into the stretch. Setting this before the file has loaded is fine:
    // the browser keeps it as the start position for when it does.
    if (video.currentTime < start || video.currentTime >= end) video.currentTime = start;

    const onTime = () => {
      if (video.currentTime >= end || video.currentTime < start) video.currentTime = start;
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [ref, start, end, full]);
}

/**
 * A label that follows the mouse over an element, replacing the cursor.
 *
 * Spread `bind` on the element (which also needs `cursor-none` while
 * `enabled`), and render `label` inside a `relative` ancestor of it.
 */
export function useCursorLabel(enabled: boolean, text: string) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType !== "mouse") return;
      const box = event.currentTarget.getBoundingClientRect();
      setAt({ x: event.clientX - box.left, y: event.clientY - box.top });
    },
    [enabled],
  );
  const onPointerLeave = useCallback(() => setAt(null), []);

  useEffect(() => {
    if (!enabled) setAt(null);
  }, [enabled]);

  const label =
    enabled && at ? (
      <span
        aria-hidden
        className="pointer-events-none absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-paper px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-ink shadow-[0_14px_34px_-12px_rgb(0,0,0,0.75)]"
        style={{ left: at.x, top: at.y }}
      >
        <svg width="8" height="9" viewBox="0 0 10 12" aria-hidden className="shrink-0">
          <path
            d="M0 0.8v10.4a.8.8 0 0 0 1.2.7l9-5.2a.8.8 0 0 0 0-1.4l-9-5.2A.8.8 0 0 0 0 .8Z"
            fill="currentColor"
          />
        </svg>
        {text}
      </span>
    ) : null;

  return {
    bind: { onPointerMove, onPointerLeave },
    label,
    /** True while the pill is showing — hide the real cursor then. */
    showing: at !== null,
  };
}
