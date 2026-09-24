/**
 * The two marginal marks that run through the whole design: a handwritten note
 * with a curved arrow, and a small burst of spectrum ticks.
 *
 * They are the reason the layout reads as "someone drew on this" rather than
 * as a template. Both are purely decorative and both are `aria-hidden` — a
 * screen reader that announced "Real videos, not actors" pointing at nothing
 * would be describing a drawing, not the page.
 *
 * The arrow is drawn rather than typed. An emoji or a ↗ glyph renders in the
 * system font at a different weight to everything else on the page and looks
 * pasted on; a stroked path inherits `currentColor` and sits at the same
 * optical weight as the handwriting it belongs to.
 */

type ArrowDirection = "down-right" | "down-left" | "up-right" | "up-left";

/** Path data per direction, all drawn inside the same 60x44 box. */
const ARROWS: Record<ArrowDirection, { d: string; tip: string }> = {
  "down-right": { d: "M2 4C18 6 34 14 46 32", tip: "M38 32l9 2 -2-9" },
  "down-left": { d: "M58 4C42 6 26 14 14 32", tip: "M22 32l-9 2 2-9" },
  "up-right": { d: "M2 40C18 38 34 30 46 12", tip: "M38 12l9-2 -2 9" },
  "up-left": { d: "M58 40C42 38 26 30 14 12", tip: "M22 12l-9-2 2 9" },
};

export function Annotation({
  children,
  arrow = "down-right",
  /** Narrow notes wrap beside a card; a remark under a section stays on one line. */
  wide = false,
  className = "",
}: {
  children: React.ReactNode;
  arrow?: ArrowDirection;
  wide?: boolean;
  className?: string;
}) {
  const path = ARROWS[arrow];
  const arrowFirst = arrow === "up-right" || arrow === "up-left";

  return (
    <span
      aria-hidden
      className={`pointer-events-none select-none flex flex-col items-start gap-1 font-hand text-[19px] leading-tight text-muted sm:text-[21px] ${className}`}
    >
      {arrowFirst && <Arrow path={path} />}
      <span className={`block ${wide ? "max-w-none" : "max-w-[15ch]"}`}>{children}</span>
      {!arrowFirst && <Arrow path={path} />}
    </span>
  );
}

function Arrow({ path }: { path: { d: string; tip: string } }) {
  return (
    <svg width="54" height="40" viewBox="0 0 60 44" fill="none" className="shrink-0">
      <path
        d={path.d}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d={path.tip}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.75"
      />
    </svg>
  );
}

/**
 * The little burst of ticks that sits beside a card corner.
 *
 * Three strokes of different lengths at uneven angles — even spacing reads as
 * an icon, unevenness reads as a mark someone made. Each tick takes its own
 * hue from the spectrum so the mark ties back to the palette rather than being
 * a generic flourish.
 */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M4 13h6"
        stroke="rgb(var(--flare-rgb, 255 93 59))"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 5.5l4 4"
        stroke="rgb(var(--amber-rgb, 237 161 58))"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 3.5l-1.5 5.5"
        stroke="rgb(var(--violet-rgb, 124 77 214))"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The numbered badge on a step card.
 *
 * A rounded square rather than a circle: the cards it sits on have a 20px
 * radius, and a circle beside them reads as a different family of shape.
 *
 * `w-fit self-start` is doing real work. `inline-flex` still stretches to the
 * full width of a `flex-col` parent, because the default `align-items` is
 * `stretch` — which turned this badge into a full-width bar across the top of
 * every card. Pinning it here rather than at the call site means it cannot
 * come back the next time the badge is used somewhere else.
 */
export function StepBadge({ index }: { index: string }) {
  return (
    <span className="inline-flex h-8 w-fit min-w-8 shrink-0 items-center justify-center self-start rounded-[10px] border border-subtle bg-paper px-2 font-mono text-[11px] tracking-widest text-muted">
      {index}
    </span>
  );
}
