/**
 * The definition, lit one word at a time as you scroll past it.
 *
 * This is the section that answers "what IS olum.video" in a single sentence.
 * Words start at the muted tone and turn to ink as the sentence passes through
 * the viewport, which paces the reading instead of dropping a paragraph on
 * someone all at once.
 *
 * WHY NOT `animation-timeline: view()`
 * -----------------------------------
 * CSS scroll-driven animations would do this with no JavaScript at all, and
 * that is genuinely the better implementation — once we can rely on it. Until
 * then a word stuck at the un-lit tone is a legibility bug, not a missing
 * flourish, so this stays in JS where every browser behaves the same.
 *
 * The JS is written to be cheap: one rAF while the section is on screen, and
 * it only touches the words whose state actually changed since the last frame,
 * so a slow scroll writes to nothing and a fast one writes to a handful.
 */

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@olum-video/ui";

const SENTENCE =
  "olum.video is an AI daily video studio that runs on one recording of you — scripted from your prompt, cut by a human editor, published under your name.";

/** Fraction of the scroll spent lighting words; the rest is lead-in and hold. */
const LIT_SPAN = 0.62;
const LIT_START = 0.16;

export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const reduced = useReducedMotion();

  const words = SENTENCE.split(" ");

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const nodes = wordsRef.current.filter(Boolean);

    // Reduced motion gets the finished sentence, not a dimmed one: the effect
    // is the reading pace, and without scrolling to drive it the un-lit tone
    // is simply low-contrast body copy.
    if (reduced) {
      nodes.forEach((word) => word.classList.add("is-lit"));
      return;
    }

    let frame = 0;
    let running = false;
    // Starts at -1, not 0, so the very first word can be lit on the first
    // frame that crosses its threshold.
    let lit = -1;

    const tick = () => {
      frame = requestAnimationFrame(tick);

      const rect = node.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));

      const ratio = Math.min(1, Math.max(0, (p - LIT_START) / LIT_SPAN));
      const next = Math.round(ratio * nodes.length) - 1;
      if (next === lit) return;

      // Walk only the range that changed. Re-classing every word each frame
      // would be ~30 style invalidations per frame for no visible difference.
      if (next > lit) {
        for (let i = lit + 1; i <= next; i++) nodes[i]?.classList.add("is-lit");
      } else {
        for (let i = lit; i > next; i--) nodes[i]?.classList.remove("is-lit");
      }
      lit = next;
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !running) {
        running = true;
        frame = requestAnimationFrame(tick);
      } else if (!visible && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
    });
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);

  return (
    <section ref={sectionRef} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            What it is
          </p>
          <p className="mt-6 font-display text-[clamp(1.5rem,3.6vw,2.9rem)] font-normal leading-[1.32] tracking-tight">
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                ref={(el) => {
                  if (el) wordsRef.current[i] = el;
                }}
                // `is-lit` is added by the scroll loop; the base state is the
                // muted tone, so the sentence is fully readable before any
                // JavaScript has run.
                className="manifesto-word"
              >
                {word}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
