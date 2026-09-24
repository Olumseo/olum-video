/**
 * /results — the page that shows the value.
 *
 * The home page proves the product works with one person's footage. This page
 * is the argument at full length: three people, the raw takes we have, the
 * videos that actually went out, and a breakdown of what happened in between.
 *
 * The order is deliberate and it is the opposite of the usual one. Proof
 * first, explanation second, ask third. Every competitor explains for three
 * screens and shows a demo near the bottom, by which point the reader has
 * spent their attention on claims. Ours spends it on real footage, and only
 * then says what was done to it.
 */

import { Link } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";

import { ResultsHero } from "../sections/ResultsHero";
import { ResultsWall } from "../sections/ResultsWall";
import { EditBreakdown } from "../sections/EditBreakdown";

export default function Results() {
  return (
    <>
      <ResultsHero />
      <ResultsWall />

      {/* The one-line statement, on paper, between the two dark-to-light
          shifts. It is the sentence someone repeats to a colleague, so it gets
          a screen to itself rather than a place in a paragraph. */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
        <RevealLines
          as="p"
          className="font-display text-[clamp(1.4rem,3.4vw,2.7rem)] leading-[1.28] tracking-tight"
          lines={[
            "You sat down in front of a camera once.",
            <>
              Everything after that is{" "}
              <span className="text-teal-ink">somebody else’s afternoon</span>.
            </>,
          ]}
        />
      </section>

      <EditBreakdown />

      <section className="relative overflow-hidden border-t border-subtle">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 22% 0%, rgb(var(--flare-rgb)/0.12), transparent 70%), radial-gradient(55% 60% at 80% 100%, rgb(var(--violet-rgb)/0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center lg:py-36">
          <RevealLines
            as="h2"
            className="mx-auto font-serif text-[clamp(2.2rem,6vw,4.4rem)] leading-[1.04] tracking-tight"
            lines={["Bring one recording.", <span className="text-spectrum">Get all of this.</span>]}
          />
          <Reveal delay={220}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {/* Every "Get started" goes to the sign-up form: the app
                  is not open for self-serve yet, so the next step for a visitor
                  is to leave verified details and be contacted. */}
                            <Link
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
              >
                Get started
                <span aria-hidden>→</span>
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center rounded-full border border-subtle px-7 py-3.5 text-sm transition-all duration-500 ease-luxe hover:border-ink/25 hover:bg-cream"
              >
                How it works
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
