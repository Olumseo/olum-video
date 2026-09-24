/**
 * Momentum scrolling for the marketing site.
 *
 * The wheel stops being a position and becomes a velocity: a notch nudges a
 * target, and the real scroll position eases toward it every frame. That lag —
 * about a fifth of a second of catch-up — is the whole effect. It is what makes
 * the reference site feel heavy and expensive rather than twitchy, and it is
 * what every award-site smooth-scroll library (Lenis, Locomotive) is doing
 * underneath.
 *
 * I ARGUED AGAINST THIS EARLIER AND WAS PARTLY WRONG
 * ---------------------------------------------------
 * Scroll hijacking has a bad name because most implementations take over
 * EVERYTHING — keyboard, touch, scrollbar, find-in-page — and break all of it.
 * That is a property of those implementations, not of momentum scrolling. This
 * one intercepts exactly one input:
 *
 *   wheel            → smoothed (the only thing we touch)
 *   touch            → untouched; phones already do this in hardware, and
 *                      re-implementing it is how you get a janky phone
 *   keyboard         → untouched; Page Down, Home, End, space and arrows all
 *                      scroll natively and we resync to wherever they land
 *   scrollbar drag   → untouched, same resync
 *   find-in-page     → untouched, same resync
 *   anchor links     → eased by this same loop (see `onClick`), because the
 *                      native `scroll-behavior: smooth` had to go: two
 *                      animations writing `scrollY` on alternate frames looks
 *                      exactly as bad as it sounds
 *   reduced motion   → not installed at all
 *
 * The resync is the part that makes the rest safe: any scroll we did not cause
 * snaps the target to the browser's position, so we never fight another input.
 */

import { useEffect } from "react";

import { useReducedMotion } from "@olum-video/ui";

/**
 * Share of the remaining distance covered each frame.
 *
 * 0.093 lands at roughly 200ms to close 90% of a gap at 60fps. Below ~0.07 the
 * page feels like it is dragging something heavy; above ~0.15 the smoothing
 * stops being perceptible and you have taken over the wheel for nothing.
 */
const EASE = 0.093;

/** Wheel delta multiplier. Above 1 the page outruns the pointer. */
const STRENGTH = 1;

/** Pixels per line, for mice that report `deltaMode: 1` instead of pixels. */
const LINE_HEIGHT = 16;

/** Below this many pixels the animation snaps and stops. */
const EPSILON = 0.4;

/**
 * How long we will wait for an animation frame before deciding the loop is not
 * running and applying the scroll ourselves.
 *
 * This is the safety net for the worst failure this hook can have. We call
 * `preventDefault()` on the wheel, so if the rAF loop never ticks — a
 * backgrounded tab, a long task hogging the main thread, a throttled renderer —
 * the page stops scrolling entirely. Silently. The watchdog turns that from a
 * dead page into a page that scrolls without the smoothing.
 *
 * 140ms is long enough that a couple of dropped frames do not trip it and short
 * enough that a person does not get as far as clicking the scrollbar.
 */
const WATCHDOG_MS = 140;

/** True if this element (or an ancestor) scrolls vertically on its own. */
function insideScrollable(node: EventTarget | null): boolean {
  let el = node instanceof Element ? node : null;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = getComputedStyle(el);
    const overflow = `${style.overflowY} ${style.overflow}`;
    if (/(auto|scroll|overlay)/.test(overflow) && el.scrollHeight > el.clientHeight + 1) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function useSmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // Coarse pointers scroll with a finger, and the OS already gives that
    // momentum. Intercepting it would replace hardware smoothing with ours.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let frame = 0;
    let watchdog = 0;
    let lastTick = performance.now();
    // The last position WE wrote. Anything else means another input moved the
    // page and we should follow it rather than fight it.
    let lastWritten = window.scrollY;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const tick = () => {
      lastTick = performance.now();
      const distance = target - current;
      if (Math.abs(distance) < EPSILON) {
        current = target;
        window.scrollTo(0, Math.round(current));
        lastWritten = window.scrollY;
        frame = 0;
        return;
      }
      current += distance * EASE;
      // Only touch the scroll position when the ROUNDED value has actually
      // moved. As the easing tails off it spends a dozen frames covering less
      // than a pixel, and each of those writes still costs a scroll event and a
      // style recalculation for every listener on the page.
      const next = Math.round(current);
      if (next !== lastWritten) {
        window.scrollTo(0, next);
        lastWritten = window.scrollY;
      }
      frame = requestAnimationFrame(tick);
    };

    /** Jumps straight to the target and abandons the animation for this burst. */
    const bail = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      current = target;
      window.scrollTo(0, Math.round(current));
      lastWritten = window.scrollY;
    };

    const start = () => {
      if (!frame) {
        lastTick = performance.now();
        frame = requestAnimationFrame(tick);
      }
      if (!watchdog) {
        watchdog = window.setInterval(() => {
          if (!frame) {
            window.clearInterval(watchdog);
            watchdog = 0;
            return;
          }
          if (performance.now() - lastTick > WATCHDOG_MS) bail();
        }, WATCHDOG_MS);
      }
    };

    const onWheel = (event: WheelEvent) => {
      // Ctrl+wheel is pinch-zoom on every platform. Hijacking it would stop
      // people zooming the page, which is an accessibility feature.
      if (event.ctrlKey || event.metaKey) return;
      // Let a scrollable child (a modal, a code block) handle its own wheel.
      if (insideScrollable(event.target)) return;
      // A hidden tab gets no animation frames at all, so taking the wheel would
      // mean taking it and never giving it back.
      if (document.hidden) return;

      event.preventDefault();

      const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaY;
      target = Math.min(maxScroll(), Math.max(0, target + delta * STRENGTH));
      start();
    };

    /**
     * Same-page anchors, eased through the same loop.
     *
     * With `scroll-behavior: smooth` removed from the document — it fights the
     * momentum loop for the scroll position — an in-page link would otherwise
     * hard-cut to its target, which is jarring on a page where everything else
     * glides.
     *
     * `scroll-margin-top` has to be read and subtracted by hand: the browser
     * honours it for native anchor navigation and `scrollIntoView`, but not for
     * a `scrollTo` we perform ourselves, so without this the fixed header lands
     * on top of whatever you jumped to.
     */
    const onClick = (event: MouseEvent) => {
      // Let the browser handle modified clicks — new tab, new window, download.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor =
        event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!anchor) return;

      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;
      const destination = document.getElementById(id);
      if (!destination) return;

      event.preventDefault();

      const margin = parseFloat(getComputedStyle(destination).scrollMarginTop) || 0;
      const top = destination.getBoundingClientRect().top + window.scrollY - margin;
      target = Math.min(maxScroll(), Math.max(0, top));
      start();

      // Keep the URL honest without letting the browser jump: `pushState` moves
      // the address bar, a real hash change would move the page.
      window.history.pushState(null, "", `#${id}`);
    };

    /**
     * Resync after any scroll we did not perform.
     *
     * This is what keeps the keyboard, the scrollbar, find-in-page and anchor
     * links working normally. Without it, pressing End would scroll to the
     * bottom and then our animation would immediately drag the page back to
     * wherever `target` still pointed.
     */
    const onScroll = () => {
      if (Math.abs(window.scrollY - lastWritten) > 2) {
        target = window.scrollY;
        current = window.scrollY;
        lastWritten = window.scrollY;
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      }
    };

    // The document can get shorter while we are mid-flight — a section
    // collapsing, an image finally laying out — which would leave `target`
    // past the end and the page stuck against the bottom.
    const onResize = () => {
      target = Math.min(target, maxScroll());
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (watchdog) window.clearInterval(watchdog);
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);
}
