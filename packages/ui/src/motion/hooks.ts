/**
 * Scroll and motion hooks shared by the marketing pages.
 *
 * Deliberately dependency-free. The obvious reach here is a scroll library
 * (Lenis, GSAP ScrollTrigger), and it would buy us momentum scrolling we do
 * not want: hijacking the wheel breaks keyboard paging, browser find-in-page
 * scrolling and every accessibility tool that drives the scroll position
 * itself. Everything below rides the NATIVE scroll and only reads it.
 */

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";

/**
 * Tracks the OS "reduce motion" setting, live.
 *
 * Read as a hook rather than once at module load because the setting can be
 * toggled while the tab is open — and because reading `matchMedia` at import
 * time would break any future server render.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * True once the element has entered the viewport. It never flips back.
 *
 * Reveal animations are a first-impression effect: re-playing them when you
 * scroll back up reads as a glitch, not as polish. So the observer
 * disconnects on the first intersection and the element stays revealed.
 */
export function useInView<T extends Element>(
  ref: RefObject<T>,
  { rootMargin = "0px 0px -12% 0px" }: { rootMargin?: string } = {},
): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    // No IntersectionObserver means we cannot tell when the element arrives.
    // Showing it immediately is the only safe answer — the alternative is
    // content that never becomes visible.
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, seen]);

  return seen;
}

/**
 * How far a tall element has travelled through the viewport, 0 to 1.
 *
 * 0 is "the element's top just reached the top of the viewport" and 1 is "its
 * bottom just reached the bottom". For a `400vh` section wrapping a sticky
 * `100vh` child, that is exactly the span over which the child stays pinned,
 * which is what drives the hero's stage sequence.
 *
 * The value is delivered through a ref, not through state. A pinned hero
 * updates this on every scroll event; putting it in state would re-render the
 * whole section 60 times a second. Consumers read `ref.current` inside their
 * own animation frame, and the hero separately derives the coarse stage index
 * — which changes four times, not sixty times a second — into real state.
 */
export function useScrollProgress<T extends Element>(
  ref: RefObject<T>,
): MutableRefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // Total distance the element's top travels while any part of it is
      // pinned. Guarded against zero so a collapsed element cannot divide by
      // it — that would put NaN into every downstream animation.
      const travel = Math.max(1, rect.height - window.innerHeight);
      progress.current = Math.min(1, Math.max(0, -rect.top / travel));
    };

    // Scroll fires far more often than the screen refreshes, so coalesce to
    // one measurement per frame. `getBoundingClientRect` forces layout; doing
    // it per event is how a smooth page starts stuttering.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);

  return progress;
}

/** True once the page has been scrolled past `offset` px. Drives the header. */
export function useScrolled(offset = 24): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return scrolled;
}
