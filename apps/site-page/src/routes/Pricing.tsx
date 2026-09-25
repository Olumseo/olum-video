import { Link } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";

import { Annotation, Sparkle, StepBadge } from "../components/Marks";

/**
 * No prices on this page, on purpose: what a client needs varies (how many
 * videos, how much editing, which channels), so the team sets the price on a
 * call. Each plan is the starting point for that conversation, and its button
 * carries the choice into the sign-up form.
 */
const PLANS = [
  {
    id: "premium_video",
    name: "Premium Video",
    tagline: "The video product on its own.",
    points: [
      "One video per day",
      "Two revisions per video",
      "Human editing on every video",
      "Publish to your connected channels",
    ],
    featured: false,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    tagline: "Everything olum.ai does, plus video.",
    points: [
      "Everything in Premium Video",
      "Full olum.ai search-visibility suite",
      "One account, one login",
      "Priority support",
    ],
    featured: true,
  },
];

/** How buying works, since there is no checkout. */
const HOW = [
  ["Select a plan", "Pick the one closest to what you need."],
  ["Fill in the form", "Your name, email and phone — verified with two quick codes."],
  ["We contact you", "Our team calls and fixes the price according to your needs."],
];

/**
 * Owns its own container: Shell no longer wraps `<main>` in one, because the
 * landing page is full-bleed. `pt-40` clears the fixed header.
 */
export default function Pricing() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-32 pt-36">
      <Reveal>
        <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
          Pricing
        </p>
      </Reveal>
      <RevealLines
        as="h1"
        className="mt-6 font-serif text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.04] tracking-tight"
        lines={["A price that fits", <span className="text-spectrum">what you need.</span>]}
      />
      <Reveal delay={160}>
        <p className="mt-6 max-w-readable text-[15px] leading-relaxed text-muted">
          Select a plan and fill in the form. We&rsquo;ll contact you and fix the price according to
          your needs. Already on olum.ai? Video is an addition to your plan, not a migration.
        </p>
      </Reveal>

      <Reveal delay={220}>
        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {HOW.map(([title, body], i) => (
            <li
              key={title}
              className="flex gap-4 rounded-card border border-subtle bg-paper/70 px-5 py-4"
            >
              <StepBadge index={String(i + 1).padStart(2, "0")} />
              <div>
                <p className="text-[15px] text-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <div className="mt-16 grid gap-5 lg:grid-cols-2">
        {PLANS.map((plan, i) => (
          // `h-full` has to be on the Reveal wrapper as well as the card:
          // Reveal introduces a div between the grid and the card, and without
          // it that wrapper shrink-wraps and the grid's stretch never reaches
          // through to the card.
          <Reveal key={plan.name} delay={i * 130} className="h-full">
            <div
              className={`relative flex h-full flex-col overflow-hidden rounded-card border bg-paper p-8 transition-all duration-500 ease-luxe hover:-translate-y-1 hover:shadow-[0_28px_60px_-40px_rgb(var(--ink-rgb)/0.4)] ${
                plan.featured ? "border-accent/40 bg-cream/40" : "border-subtle"
              }`}
            >
              {/* A spectrum rule across the top of the recommended plan. It is
                  the same device as the stage cards on the home page, which is
                  what makes "this is the one" read as part of the system rather
                  than as a highlight bolted onto a card. */}
              {plan.featured && (
                <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-spectrum" />
              )}
              {plan.featured && <Sparkle className="absolute right-3 top-3" />}
              <div className="flex items-start gap-4">
                <StepBadge index={String(i + 1).padStart(2, "0")} />
                <h2 className="mt-0.5 flex-1 font-display text-xl tracking-tight">{plan.name}</h2>
                {plan.featured && (
                  <span className="shrink-0 rounded-full border border-accent/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent-ink">
                    Most complete
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted">{plan.tagline}</p>
              <p className="mt-5 font-display text-[22px] tracking-tight text-ink">
                Priced to your needs
                <span className="mt-1 block font-sans text-[13px] tracking-normal text-muted">
                  We set it with you on a call.
                </span>
              </p>

              <ul className="mt-8 space-y-3 border-t border-subtle pt-8">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm">
                    <span
                      aria-hidden
                      className={`mt-[0.45em] h-1 w-1 shrink-0 rounded-full ${
                        plan.featured ? "bg-teal" : "bg-accent"
                      }`}
                    />
                    {point}
                  </li>
                ))}
              </ul>

              {/* `mt-auto` pins the button to the bottom of the taller card, so
                  the two calls to action line up across the grid. The spacing
                  above it comes from the wrapper's padding, not a margin —
                  a margin here would fight `mt-auto`. */}
              <div className="mt-auto pt-10">
                <Link
                  to={`/get-started?plan=${plan.id}`}
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm transition-colors ${
                    plan.featured
                      ? "bg-ink text-paper hover:bg-accent-2"
                      : "border border-subtle hover:bg-cream"
                  }`}
                >
                  Choose {plan.name}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-12 flex flex-wrap items-start justify-between gap-8">
          <p className="max-w-readable text-xs leading-relaxed text-muted">
            A revision is a change you ask for after seeing the cut. Fixes we make on our own —
            quality problems, mistakes on our side — never count against your two.
          </p>
          <Annotation arrow="up-left" className="hidden items-end text-right lg:flex">
            Not sure which? Pick either — we&rsquo;ll sort it out on the call.
          </Annotation>
        </div>
      </Reveal>
    </div>
  );
}
