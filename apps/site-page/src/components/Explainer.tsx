/**
 * The explainer card, and the grid it lives in.
 *
 * A numbered badge, a small mock of the actual screen, a title and a
 * paragraph. It started life inline in the four-step section; it is extracted
 * here because the same shape now explains three different things on two
 * pages, and three copies of a card is three cards that quietly stop matching.
 *
 * THE MOCK IS THE POINT
 * ---------------------
 * An icon tells you a step exists. A picture of the screen tells you what the
 * step will feel like, which is the only question anyone is really asking at
 * this point on the page. Every mock is built in DOM rather than screenshotted:
 * a screenshot of a real account is customer data on a public page, it goes
 * stale the first time a badge is restyled, and it ships a few hundred
 * kilobytes to show something that is four boxes and a line of type.
 *
 * The mock sits in a fixed-height slot so every card in a row lines its title
 * up, however differently shaped the things inside them are.
 */

import type { ReactNode } from "react";

import { Reveal, RevealLines } from "@olum-video/ui";

import { Sparkle, StepBadge } from "./Marks";

export type ExplainerItem = {
  /** "01", "02"… Pass an empty string to drop the badge. */
  index: string;
  title: string;
  body: string;
  mock: ReactNode;
  /**
   * Marks the step the process actually turns on.
   *
   * A numbered list flattens everything it contains: five equal cards say five
   * equally ordinary things happen. The spectrum edge and the kicker put one
   * of them back in relief, which is the difference between mentioning the
   * human edit and claiming it.
   */
  highlight?: string;
};

export function ExplainerGrid({
  items,
  columns = 4,
  mockHeight = 190,
  className = "",
}: {
  items: ExplainerItem[];
  columns?: 2 | 3 | 4 | 5;
  /** Height of the illustration slot, in px. */
  mockHeight?: number;
  className?: string;
}) {
  // Written out in full rather than built as `lg:grid-cols-${columns}`.
  // Tailwind only sees class names that appear literally in the source, so an
  // interpolated one compiles to nothing and the grid silently stays single
  // column.
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : columns === 5
          ? "sm:grid-cols-2 lg:grid-cols-5"
          : "sm:grid-cols-2 lg:grid-cols-4";

  // An odd count leaves the last card alone on its own row in a two-column
  // layout. Letting it span both keeps the block rectangular instead of
  // trailing off, and it costs nothing once the row is five wide.
  const orphan = items.length % 2 === 1 ? "sm:col-span-2 lg:col-span-1" : "";

  return (
    <ol className={`grid gap-5 ${cols} ${className}`}>
      {items.map((item, i) => (
        <Reveal
          key={item.title}
          delay={i * 110}
          className={`h-full ${i === items.length - 1 ? orphan : ""}`}
        >
          <li
            className={`group relative flex h-full flex-col rounded-card border p-5 transition-all duration-500 ease-luxe hover:-translate-y-1 hover:shadow-[0_26px_60px_-40px_rgb(var(--ink-rgb)/0.45)] ${
              item.highlight
                ? "border-transparent bg-paper shadow-[0_18px_44px_-34px_rgb(var(--ink-rgb)/0.5)]"
                : "border-subtle bg-paper/70 hover:bg-paper"
            }`}
          >
            {/* A spectrum edge along the top of the highlighted card, matching
                the ring on the generated clips in the showcase. */}
            {item.highlight && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px] rounded-t-card bg-spectrum"
              />
            )}
            <Sparkle className="absolute -right-1.5 -top-2 opacity-0 transition-opacity duration-500 ease-luxe group-hover:opacity-100" />

            <div className="flex flex-wrap items-center gap-2">
              {item.index && <StepBadge index={item.index} />}
              {item.highlight && (
                <span className="rounded-full border border-accent-ink/35 bg-accent/10 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-accent-ink">
                  {item.highlight}
                </span>
              )}
            </div>

            <div
              className={`flex items-center justify-center ${item.index ? "mt-5" : ""}`}
              style={{ height: `${mockHeight}px` }}
            >
              {item.mock}
            </div>

            <p className="mt-5 font-display text-[17px] leading-snug tracking-tight">
              {item.title}
            </p>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

/**
 * The heading block that sits above a grid — pill, headline, one line of
 * supporting copy, all centred.
 *
 * Separated from the grid so a section can use one without the other, and so
 * the pill treatment is defined once rather than pasted onto every section
 * that wants it.
 */
export function ExplainerHeading({
  eyebrow,
  lines,
  body,
}: {
  eyebrow: string;
  /** The headline, pre-split. The last line usually carries `.text-spectrum`. */
  lines: ReactNode[];
  body?: string;
  children?: never;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Reveal>
        <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
          {eyebrow}
        </p>
      </Reveal>
      <RevealLines
        as="h2"
        className="mt-6 font-serif text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.05] tracking-tight"
        lines={lines}
      />
      {body && (
        <Reveal delay={200}>
          <p className="mx-auto mt-5 max-w-readable text-[15px] leading-relaxed text-muted">
            {body}
          </p>
        </Reveal>
      )}
    </div>
  );
}
