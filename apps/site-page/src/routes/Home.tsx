/**
 * The home page.
 *
 * The argument, in order: the promise (hero), proof in real footage
 * (showcase), how it works in five steps, everything that is handled, who it
 * is for, the one part a person always does, the questions people ask, and
 * the ask.
 *
 * Proof comes second, before any explanation. Every competitor's page explains
 * first and shows a demo near the bottom; by then the reader has spent their
 * attention on claims. Ours spends it on thirty seconds of the actual product.
 */

import { Link } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";

import { Marquee } from "../components/Marquee";
import { HomeHero } from "../sections/HomeHero";
import { Showcase } from "../sections/Showcase";
import { Steps } from "../sections/Steps";

/** Everything Olum does, as one checklist. */
const HANDLED = [
  "A personalized AI avatar",
  "Content ideas",
  "Topic research",
  "Scripts and hooks",
  "Captions",
  "Edited videos",
  "Daily content",
  "Social media posting",
  "Performance tracking",
  "Continuous improvement",
];

const WHO_TOP = ["Founders", "Coaches", "Consultants", "Creators"];
const WHO_BOTTOM = ["Educators", "Business owners", "Personal brands", "Experts"];

/**
 * The FAQ, in one place: the list on the page AND the structured data search
 * engines read are both built from this, so they cannot disagree.
 */
const FAQ = [
  {
    q: "Do I need to record every day?",
    a: "No. Olum uses your AI avatar to create new videos.",
  },
  {
    q: "Do I need to write the scripts?",
    a: "No. Olum researches the topics and writes the scripts, hooks, and captions.",
  },
  {
    q: "Do I need to edit or post the videos?",
    a: "No. Olum edits and publishes the videos for you.",
  },
  {
    q: "How does Olum improve my content?",
    a: "Olum tracks how your posts perform. It uses that information to improve future ideas, scripts, hooks, captions, and videos.",
  },
  {
    q: "What do I need to provide?",
    a: "Share a few videos of yourself and basic information about your business, audience, and goals. Olum handles the rest.",
  },
];

const FAQ_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

export default function Home() {
  return (
    <>
      <HomeHero />

      {/* The anchor the hero's second button targets. On the section rather
          than inside it so the sticky header does not cover the panel's top
          edge when you land. */}
      <div id="showcase" className="scroll-mt-24" />
      <Showcase />

      <Steps />

      {/* ── Everything is handled for you ─────────────────────────────── */}
      <section
        className="border-y border-subtle bg-cream/50"
        aria-label="Everything is handled for you"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
          <div className="lg:col-span-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              With Olum, you get
            </p>
            <RevealLines
              as="h2"
              className="mt-4 font-serif text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.1] tracking-tight"
              lines={["Everything is", <span className="text-spectrum">handled for you.</span>]}
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-readable text-[15px] leading-relaxed text-muted">
                You do not need to plan, write, record, edit, post, or analyze your content.
              </p>
              <p className="mt-2 text-[17px] text-ink">Olum does it for you.</p>
            </Reveal>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {HANDLED.map((item, i) => (
              <Reveal key={item} delay={i * 45}>
                <li className="flex items-center gap-3 rounded-card border border-subtle bg-paper px-5 py-4 text-[15px] text-ink">
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-ink text-paper"
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 5.2 3.9 7.6 8.5 2.6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Who is Olum for? ──────────────────────────────────────────── */}
      <section className="py-24 lg:py-32" aria-label="Who is Olum for?">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Who is Olum for?
          </p>
          <Reveal delay={80}>
            <p className="mt-6 font-display text-[clamp(1.35rem,3vw,2.2rem)] leading-[1.3] tracking-tight">
              Olum is for founders, coaches, consultants, creators, educators, business owners, and
              personal brands that want to{" "}
              <span className="text-teal-ink">post regularly without managing a content team.</span>
            </p>
          </Reveal>
        </div>
        <div className="mt-14 space-y-3">
          <Marquee items={WHO_TOP} durationSeconds={40} />
          <Marquee items={WHO_BOTTOM} durationSeconds={46} reverse />
        </div>
      </section>

      {/* ── The part a person always does ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl border-t border-subtle px-6 py-24 lg:py-32">
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
              lines={["A person watches", "every single cut", "before it goes out."]}
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-readable text-[15px] leading-relaxed text-muted">
                The agents do the work; an editor on our team checks it. Every video is reviewed,
                trimmed and signed off by a person before it is posted under your name.
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

      {/* ── Frequently asked questions ────────────────────────────────── */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-subtle"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
          <div className="lg:col-span-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">FAQ</p>
            <h2
              id="faq-heading"
              className="mt-4 font-serif text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.1] tracking-tight"
            >
              Frequently asked questions
            </h2>
          </div>

          {/* <details>, not a hand-built accordion: keyboard, screen readers
              and find-in-page all work with no script, and the answers are in
              the HTML for anyone who never clicks. */}
          <div className="divide-y divide-subtle border-y border-subtle lg:col-span-7">
            {FAQ.map(({ q, a }, i) => (
              <details key={q} className="group py-1" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-subtle transition-transform duration-300 ease-luxe group-open:rotate-45"
                  >
                    <span className="absolute h-px w-3 bg-ink" />
                    <span className="absolute h-3 w-px bg-ink" />
                  </span>
                </summary>
                <p className="max-w-readable pb-6 pr-12 text-[15px] leading-relaxed text-muted">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
        {/* The same five questions, for search engines. Built from FAQ above,
            so the page and the structured data cannot drift apart. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA }} />
      </section>

      {/* ── The ask ───────────────────────────────────────────────────── */}
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
              "Share your knowledge.",
              <span className="text-spectrum">Olum handles the content.</span>,
            ]}
          />
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-readable text-[16px] leading-relaxed text-muted">
              From idea to published video, Olum manages everything.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
              >
                Get Started With Olum
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
