/**
 * The home page.
 *
 * The argument, in order: the promise (hero), four numbers, proof in real
 * footage (showcase), how it works in five steps, everything that is handled,
 * who it is for, the one part a person always does, what it costs, the
 * questions people ask, and the ask.
 *
 * Proof comes second, before any explanation. Every competitor's page explains
 * first and shows a demo near the bottom; by then the reader has spent their
 * attention on claims. Ours spends it on thirty seconds of the actual product.
 *
 * Every section ends in a way forward. A visitor convinced halfway down should
 * not have to scroll to the bottom, or back to the top, to act on it.
 */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal, RevealLines } from "@olum-video/ui";

import { Counter } from "../components/Counter";
import { Cta } from "../components/Cta";
import { Magnetic } from "../components/Magnetic";
import { Marquee } from "../components/Marquee";
import { HomeHero } from "../sections/HomeHero";
import { Showcase } from "../sections/Showcase";
import { Steps } from "../sections/Steps";

/** The four numbers under the hero. */
const PROOF = [
  { value: 1, suffix: "", label: "recording needed" },
  { value: 30, suffix: "", label: "videos a month" },
  { value: 4, suffix: "", label: "platforms posted to" },
  { value: 100, suffix: "%", label: "human-reviewed" },
];

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
 * What clients say, beside "a person watches every cut".
 *
 * EMPTY UNTIL THERE ARE REAL ONES. The design came with two placeholder quotes
 * marked "replace with real quote"; a made-up testimonial on a page whose
 * whole pitch is "nothing here is invented" would undo every section above
 * it. So the placeholders show in local development only — enough to see the
 * layout — and a production build renders the section without the column
 * until this array holds something a real client said.
 */
const TESTIMONIALS: { quote: string; who: string }[] = [];
const PLACEHOLDER_TESTIMONIALS = [
  {
    quote: "I recorded once. Three weeks later I'd posted more than in the whole year before.",
    who: "Founder, B2B SaaS · placeholder",
  },
  {
    quote: "It looks like me, sounds like me, and I didn't have to open an editor once.",
    who: "Coach · placeholder",
  },
];
const QUOTES =
  TESTIMONIALS.length > 0 ? TESTIMONIALS : import.meta.env.DEV ? PLACEHOLDER_TESTIMONIALS : [];

/**
 * The pricing teaser.
 *
 * No figure: /pricing deliberately has none, because the team sets the price
 * on a call. The design's "Plans start at $XX" is a slot for a number that
 * does not exist yet — when it does, it goes here.
 */
const PRICE_POINTS = [
  "Personal AI avatar from your recording",
  "Daily videos posted to your accounts",
  "Human review on every cut",
];

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
    a: "No. Our agents research topics and write scripts and hooks in your voice, based on your goals and audience.",
  },
  {
    q: "Do I need to edit or post the videos?",
    a: "No. Videos are edited, reviewed by a person on our team, and posted to your accounts for you.",
  },
  {
    q: "How does Olum improve my content?",
    a: "We track views, watch time and engagement, then feed what works back into future topics, hooks and captions.",
  },
  {
    q: "What do I need to provide?",
    a: "A few videos of yourself and a short brief about your business, audience and goals.",
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

const EYEBROW = "font-mono text-[11px] uppercase tracking-[0.2em] text-muted";

function Check({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-success-ink text-paper"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 10 10" fill="none">
        <path
          d="M1.5 5.2 3.9 7.6 8.5 2.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * The closing email box.
 *
 * It does not sign anyone up by itself: sign-up needs a verified phone as well
 * as an email, and that lives on /get-started. So the box carries the address
 * there in router state — never in the URL, where it would land in history and
 * server logs — and the form opens with it already filled in.
 */
function EmailStart() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate("/get-started", { state: { email: email.trim() } });
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-[480px] flex-col gap-2 rounded-[22px] border border-subtle bg-paper p-2.5 shadow-[0_24px_60px_-40px_rgb(var(--ink-rgb)/0.45)] sm:flex-row sm:rounded-full sm:p-1.5"
    >
      <label htmlFor="start-email" className="sr-only">
        Your work email
      </label>
      <input
        id="start-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your work email"
        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted sm:py-0"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-6 py-3 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
      >
        Get started with Olum
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}

export default function Home() {
  return (
    <>
      <HomeHero />

      {/* ── Four numbers ──────────────────────────────────────────────── */}
      <section className="border-y border-subtle bg-cream/50" aria-label="Olum in numbers">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-9 text-center lg:grid-cols-4">
          {PROOF.map((item, i) => (
            <Reveal key={item.label} delay={i * 70}>
              <div className="flex flex-col-reverse items-center gap-2">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                  {item.label}
                </dt>
                <dd className="font-serif text-[clamp(2.2rem,4vw,2.6rem)] leading-none tracking-tight text-ink">
                  <Counter to={item.value} suffix={item.suffix} />
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* The anchor every "Watch sample videos" targets. On the section rather
          than inside it so the sticky header does not cover the panel's top
          edge when you land. */}
      <div id="showcase" className="scroll-mt-24 pt-6" />
      <Showcase />

      <Steps />

      {/* ── Everything is handled for you ─────────────────────────────── */}
      <section
        className="border-y border-subtle bg-cream/50"
        aria-label="Everything is handled for you"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
          <div className="lg:col-span-5">
            <p className={EYEBROW}>With Olum, you get</p>
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
            <Reveal delay={280}>
              <div className="mt-8">
                <Magnetic>
                  <Cta to="/get-started" arrow>
                    Get started
                  </Cta>
                </Magnetic>
                <p className="mt-4 font-mono text-[11px] tracking-[0.04em] text-muted">
                  No daily recording. Ever.
                </p>
              </div>
            </Reveal>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {HANDLED.map((item, i) => (
              <Reveal key={item} delay={i * 45}>
                <li className="flex items-center gap-3 rounded-card border border-subtle bg-paper px-5 py-4 text-[15px] text-ink">
                  <Check />
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
          <p className={EYEBROW}>Who is Olum for?</p>
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
        <Reveal delay={120}>
          <div className="mt-12 flex justify-center px-6">
            <Magnetic>
              <Cta to="/get-started" arrow>
                Sound like you? Get started
              </Cta>
            </Magnetic>
          </div>
        </Reveal>
      </section>

      {/* ── The part a person always does ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl border-t border-subtle px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className={QUOTES.length > 0 ? "lg:col-span-6" : "lg:col-span-7 lg:col-start-6"}>
            <p className={EYEBROW}>The part that is not automated</p>
            <RevealLines
              as="h2"
              className="mt-4 font-serif text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.1] tracking-tight"
              lines={["A person watches", "every single cut", "before it goes out."]}
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-readable text-[15px] leading-relaxed text-muted">
                The agents do the work; an editor on our team checks it. Every video is reviewed,
                trimmed and signed off by a person before it is posted under your name.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Cta to="/get-started" small>
                  Get started
                </Cta>
                <Cta to="/how-it-works" look="ghost" small arrow>
                  See what happens inside the edit
                </Cta>
              </div>
            </Reveal>
          </div>

          {QUOTES.length > 0 && (
            <div className="grid content-start gap-4 lg:col-span-6">
              {QUOTES.map((t, i) => (
                <Reveal key={t.quote} delay={160 + i * 110}>
                  <figure className="rounded-card border border-subtle bg-cream/40 p-6">
                    <blockquote className="font-serif text-[clamp(1.25rem,2vw,1.45rem)] leading-[1.3] tracking-tight text-ink">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      — {t.who}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Pricing teaser ────────────────────────────────────────────── */}
      <section className="border-y border-subtle bg-cream/50" aria-label="Pricing">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <Reveal>
            <div className="relative grid items-center gap-10 overflow-hidden rounded-[28px] border border-subtle bg-paper p-7 sm:p-11 lg:grid-cols-[1.2fr_1fr]">
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-spectrum" />
              <div>
                <p className={EYEBROW}>Pricing</p>
                <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,2.75rem)] leading-[1.08] tracking-tight">
                  One plan. A full content team.
                </h2>
                <p className="mt-4 max-w-readable text-[15px] leading-relaxed text-muted">
                  Ideas, scripts, edits, posting and reporting — no agency retainer, no hiring.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {PRICE_POINTS.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-[15px] text-ink">
                      <Check size={18} />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Magnetic>
                    <Cta to="/get-started" arrow>
                      Start now
                    </Cta>
                  </Magnetic>
                  <Cta to="/pricing" look="ghost">
                    See full pricing
                  </Cta>
                </div>
              </div>
              <div className="text-center">
                <p className={EYEBROW}>Your price</p>
                <p className="mt-3 font-serif text-[clamp(2.4rem,5vw,3.6rem)] leading-none tracking-tight">
                  <span className="text-spectrum">Priced to your needs</span>
                </p>
                <p className="mt-4 text-[14px] text-muted">We set it with you on a call.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Frequently asked questions ────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24" aria-labelledby="faq-heading">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
          <div className="lg:col-span-5">
            <p className={EYEBROW}>FAQ</p>
            <h2
              id="faq-heading"
              className="mt-4 font-serif text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.1] tracking-tight"
            >
              Frequently asked questions
            </h2>
          </div>

          <div className="lg:col-span-7">
            {/* <details>, not a hand-built accordion: keyboard, screen readers
                and find-in-page all work with no script, and the answers are
                in the HTML for anyone who never clicks. */}
            <div className="divide-y divide-subtle border-y border-subtle">
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

            <Reveal delay={120}>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-card border border-subtle bg-cream/40 p-6">
                <div>
                  <p className="font-serif text-[1.6rem] leading-tight tracking-tight">Still unsure?</p>
                  <p className="mt-1 text-[14px] text-muted">See real output or talk to a human.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Cta to="#showcase" small>
                    Watch sample videos
                  </Cta>
                  <Cta to="mailto:hello@olum.video" look="ghost" small>
                    Talk to us
                  </Cta>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
        {/* The same five questions, for search engines. Built from FAQ above,
            so the page and the structured data cannot drift apart. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA }} />
      </section>

      {/* ── The ask ───────────────────────────────────────────────────────
          `id="start"` is what the floating prompt and the phone bar watch for:
          both step aside once this is on screen, since it IS the ask. */}
      <section id="start" className="relative overflow-hidden border-t border-subtle">
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
            <div className="mt-10">
              <EmailStart />
              <div className="mt-5 flex justify-center">
                <Cta to="/pricing" look="ghost" small>
                  See pricing
                </Cta>
              </div>
              <p className="mt-5 font-mono text-[11px] tracking-[0.04em] text-muted">
                A person reviews every video before it goes out.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
