/**
 * Scroll reveals.
 *
 * Both components below are pure CSS transitions toggled by a class — no
 * per-frame JavaScript. The only JS involved is one IntersectionObserver that
 * disconnects after it fires. That keeps the scroll thread free for the hero,
 * which is the one thing on this page that genuinely needs every frame.
 */

import { useRef } from "react";
import type { ElementType, ReactNode } from "react";

import { useInView, useReducedMotion } from "./hooks";

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  /** Stagger, in ms. */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref);
  const reduced = useReducedMotion();

  return (
    <Tag
      ref={ref}
      className={`reveal ${seen || reduced ? "is-in" : ""} ${className}`}
      style={reduced ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * A headline whose lines rise out from behind a mask.
 *
 * Lines are passed in already split rather than measured at runtime. Measuring
 * where the browser wraps a line — and re-measuring on every resize and after
 * the webfont swaps in — is a lot of machinery for a headline whose wrap
 * points we are art-directing anyway.
 *
 * Each line is one clipped box with a sliding child. Screen readers get the
 * whole string uninterrupted because the split is `<span>`s inside a single
 * heading, not separate headings.
 */
export function RevealLines({
  lines,
  className = "",
  as: Tag = "h2",
  delay = 0,
}: {
  lines: ReactNode[];
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { rootMargin: "0px 0px -18% 0px" });
  const reduced = useReducedMotion();
  const shown = seen || reduced;

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        // `pb-[0.12em]` is not padding for looks: the mask is `overflow:
        // hidden`, and descenders (g, y, p) in Instrument Serif sit far enough
        // below the baseline that without it they get sliced off.
        <span key={i} className="block overflow-hidden pb-[0.12em]">
          <span
            className={`line-rise block ${shown ? "is-in" : ""}`}
            style={reduced ? undefined : { transitionDelay: `${delay + i * 90}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
