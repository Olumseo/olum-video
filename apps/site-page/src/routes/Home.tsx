/**
 * The home page.
 *
 * The argument, in order: make one claim (hero), prove it immediately with real
 * footage (showcase), say plainly what the thing is (statement), sketch how it
 * works and hand off to the page that goes deep (steps), show the range
 * (marquee), back it with numbers, name the part that cannot be automated, ask.
 *
 * Proof comes second, before any explanation. Every competitor's page explains
 * first and shows a demo near the bottom; by then the reader has spent their
 * attention on claims. Ours spends it on thirty seconds of the actual product.
 */

import { Link } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";

import { Counter } from "../components/Counter";
import { Marquee } from "../components/Marquee";
import { HomeHero } from "../sections/HomeHero";
import { Showcase } from "../sections/Showcase";
import { Steps } from "../sections/Steps";

const USES_TOP = [
  "Product updates",
  "Founder notes",
  "Weekly recaps",
  "Customer answers",
  "Launch announcements",
  "Hiring posts",
];

const USES_BOTTOM = [
  "Feature explainers",
  "Conference follow-ups",
  "Changelog videos",
  "Partner intros",
  "Sales follow-ups",
  "Company news",
];

/**
 * Every figure here is backed by copy that already exists elsewhere on the
 * site. No turnaround times, no volume claims — a marketing page is the worst
 * possible place to invent an SLA we have not committed to.
 */
const STATS = [
  { value: 1, suffix: "", label: "recording session. Ever.", hue: "text-flare-ink" },
  // Terracotta here, not amber, even though amber is the next hue along the
  // spectrum. Amber measures 2:1 against paper — fine behind a gradient, far
  // too weak for a figure that is the whole point of the tile. The rule is
  // written down in spectrum.css; this is the first place it bit.
  { value: 0, suffix: "", label: "cameras to set up after that", hue: "text-accent-ink" },
  { value: 2, suffix: "", label: "revisions per video, included", hue: "text-teal-ink" },
  { value: 100, suffix: "%", label: "of cuts reviewed by a person", hue: "text-violet-ink" },
];


export default function Home() {
  return (
    <>
      <HomeHero />

      {/* The anchor the hero's second button targets. On the section rather
          than inside it so the sticky header does not cover the panel's top
          edge when you land. */}
      <div id="showcase" className="scroll-mt-24" />
      <Showcase />

      <section className="mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
        <RevealLines
          as="p"
          className="font-display text-[clamp(1.4rem,3.4vw,2.7rem)] leading-[1.28] tracking-tight"
          lines={[
            "olum.video is an AI daily video studio",
            "that runs on one recording of you —",
            <>
              scripted from your prompt,{" "}
              <span className="text-teal-ink">cut by a human editor</span>,
            </>,
            "published under your name.",
          ]}
        />
      </section>

      <Steps />

      <section className="py-4 lg:py-8" aria-label="What people make with olum.video">
        <Reveal>
          <p className="mx-auto mb-10 max-w-7xl px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            One twin, every format
          </p>
        </Reveal>
        <div className="space-y-3">
          <Marquee items={USES_TOP} durationSeconds={46} />
          <Marquee items={USES_BOTTOM} durationSeconds={52} reverse />
        </div>
      </section>

      <section className="mt-20 border-y border-subtle bg-cream/50 lg:mt-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4 lg:py-24">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 110}>
              <p
                className={`font-serif text-[clamp(2.6rem,6vw,4.2rem)] leading-none tracking-tight ${stat.hue}`}
              >
                <Counter to={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-4 max-w-[22ch] text-sm leading-relaxed text-muted">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              The part that is not automated
            </p>
          </div>
          <div className="lg:col-span-7">
            <RevealLines
              as="h2"
              className="font-serif text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.1] tracking-tight"
              lines={["A person watches", "every single cut", "before you do."]}
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-readable text-[15px] leading-relaxed text-muted">
                Nothing generated goes straight to your inbox. An editor on our team reviews the
                take, trims it, fixes what the model got wrong and signs it off. That is the
                difference between a video you publish and a video you delete.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <Link
                to="/how-it-works"
                className="link-underline mt-7 inline-flex items-center gap-2 text-sm text-ink"
              >
                See what happens inside the edit
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

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
            lines={[
              "Sit down once.",
              <span className="text-spectrum">
                We will handle the rest.
              </span>,
            ]}
          />
          <Reveal delay={220}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
              >
                Open the app
                <span aria-hidden>→</span>
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center rounded-full border border-subtle px-7 py-3.5 text-sm transition-all duration-500 ease-luxe hover:border-ink/25 hover:bg-cream"
              >
                See pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
