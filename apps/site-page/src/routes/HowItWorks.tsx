/**
 * How it works — the deep dive.
 *
 * This was the home page until the showcase existed. It is the better second
 * page: four screens of pinned scroll is a wonderful thing to walk through
 * once you already want the product, and a wall to climb before you do. So the
 * home page proves the claim with real footage and sends anyone who wants the
 * mechanism here.
 *
 * What is left is only what goes deep — the particle sequence, the one-sentence
 * definition, and the app itself. The marquee, the numbers and the
 * human-review argument moved to the home page rather than being repeated;
 * the same section on two pages teaches a visitor that the second page has
 * nothing new in it.
 */

import { Link } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";

import { Annotation } from "../components/Marks";

import { Hero } from "../sections/Hero";
import { Inside } from "../sections/Inside";
import { InsideTheEdit } from "../sections/InsideTheEdit";
import { Manifesto } from "../sections/Manifesto";

export default function HowItWorks() {
  return (
    <>
      <Hero />
      <Manifesto />
      <InsideTheEdit />
      <Inside />

      <section className="relative overflow-hidden border-t border-subtle">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 22% 0%, rgb(var(--teal-rgb)/0.1), transparent 70%), radial-gradient(55% 60% at 80% 100%, rgb(var(--accent-rgb)/0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center lg:py-36">
          <Reveal>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
              Ready when you are
            </p>
          </Reveal>
          <div className="mt-6" />
          <RevealLines
            as="h2"
            className="mx-auto font-serif text-[clamp(2.2rem,6vw,4.4rem)] leading-[1.04] tracking-tight"
            lines={[
              "That is the whole thing.",
              <span className="text-spectrum">Shall we start?</span>,
            ]}
          />
          <Reveal delay={220}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {/* Every "Open the app" goes to the sign-up form for now: the app
                  is not open for self-serve yet, so the next step for a visitor
                  is to leave verified details and be contacted. */}
                            <Link
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
              >
                Open the app
                <span aria-hidden>→</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-subtle px-7 py-3.5 text-sm transition-all duration-500 ease-luxe hover:border-ink/25 hover:bg-cream"
              >
                <span aria-hidden className="text-flare-ink">▸</span>
                Watch a real one
              </Link>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-12 flex justify-center">
              <Annotation arrow="up-left" wide className="items-center text-center">
                One sitting. Then it runs.
              </Annotation>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
