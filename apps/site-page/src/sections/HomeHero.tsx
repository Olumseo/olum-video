/**
 * The home page's opening.
 *
 * Split layout: the claim and the calls to action on the left, three real
 * finished posts fanned out on the right, handwritten notes pointing at both.
 *
 * WHY A FAN AND NOT A GRID
 * ------------------------
 * Three cards in a neat row read as a feature list. Overlapped and tilted,
 * with the middle one lifted, they read as a stack of things that already
 * exist — which is the claim the page is making. The overlap is also what
 * lets three 9:16 cards fit beside a headline without either shrinking to
 * thumbnails or pushing the copy off the screen.
 *
 * The drifting particle field behind it is unchanged. It is atmosphere rather
 * than information, so it costs the reader nothing to ignore, and it is the
 * one thing tying this page to /how-it-works, where the same material carries
 * the four-stage sequence.
 */

import { Reveal, RevealLines } from "@olum-video/ui";

import { ParticleField } from "../motion/ParticleField";
import { Magnetic } from "../components/Magnetic";
import { PhoneCard, type PhoneClip } from "../components/PhoneCard";
import { PlatformRow } from "../components/PlatformMarks";
import { Annotation, Sparkle } from "../components/Marks";
import { Link } from "react-router-dom";

const base = import.meta.env.BASE_URL;

/**
 * The fan, back to front.
 *
 * All three are the real files. The first is the original recording and says
 * so — the design this came from showed three generated posts, but we have
 * two, and captioning the source as a third output would be inventing a claim
 * on the one panel whose whole job is that nothing here is invented. Shown
 * first, it also happens to tell the story in the right order: this became
 * those.
 */
const FAN: PhoneClip[] = [
  {
    id: "source",
    src: `${base}media/source-capture.mp4`,
    poster: `${base}media/source-capture.jpg`,
    caption: "The one recording everything else is built from.",
    label: "Your recording",
    duration: "0:33",
    origin: "Filmed once, on a phone",
    width: 624,
    height: 1110,
    kind: "recorded",
  },
  {
    id: "astra",
    src: `${base}media/generated-astra.mp4`,
    poster: `${base}media/generated-astra.jpg`,
    caption: "Here's what the new benchmark numbers actually mean.",
    label: "Industry insight",
    duration: "0:57",
    origin: "Made by his AI clone — never filmed",
    width: 480,
    height: 854,
    kind: "generated",
    preview: [0, 7],
  },
  {
    id: "agi",
    src: `${base}media/generated-agi.mp4`,
    poster: `${base}media/generated-agi.jpg`,
    caption: "Big update on what everyone in AI is reacting to today.",
    label: "News reaction",
    duration: "1:00",
    origin: "Made by his AI clone — never filmed",
    width: 480,
    height: 854,
    kind: "generated",
    preview: [20, 27],
  },
];

/**
 * "Ready to post", not "Posted for you".
 *
 * Publishing straight to the platforms is the one thing in this design the
 * product cannot do yet — the step-4 mock marks it "Soon" — and three words in
 * a hero are exactly where an overstatement does the most damage.
 */
const FACTS = ["One recording", "Daily videos", "Ready to post"];

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-20 pt-28 sm:pb-24 lg:pb-28 lg:pt-36">
      <ParticleField ambientSpectrum className="absolute inset-0 -z-10" />

      {/* Two soft washes, warm on one side and cool on the other, so the paper
          has a direction to it. A single centred glow reads as a spotlight and
          flattens everything around it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(48% 42% at 12% 6%, rgb(var(--flare-rgb)/0.13), transparent 68%), radial-gradient(52% 46% at 90% 22%, rgb(var(--indigo-rgb)/0.12), transparent 70%), radial-gradient(60% 50% at 55% 100%, rgb(var(--amber-rgb)/0.1), transparent 72%)",
        }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        {/* ── Left: the claim ─────────────────────────────────────────────── */}
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
              AI video autopilot
            </p>
          </Reveal>

          <RevealLines
            as="h1"
            className="mt-7 font-serif text-[clamp(2.5rem,5.6vw,4.4rem)] leading-[1.04] tracking-tight"
            lines={[
              "Turn one video",
              "of yourself into",
              <span className="text-spectrum">daily social posts.</span>,
            ]}
          />

          <Reveal delay={240}>
            <p className="mt-7 max-w-readable text-[15px] leading-relaxed text-muted">
              Upload a video of yourself once. Olum builds your AI clone, writes the scripts, edits
              the videos and gets them ready for your socials — with a human checking every cut
              before it goes out.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {/* To the sign-up form. The app is not open for self-serve yet,
                  so "create my clone" starts with verified contact details and
                  a call from the team. */}
              <Magnetic>
                <Link
                  to="/get-started"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
                >
                  Create my AI clone
                  <span aria-hidden>→</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <a
                  href="#showcase"
                  className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-7 py-3.5 text-sm backdrop-blur-sm transition-all duration-500 ease-luxe hover:border-ink/25 hover:bg-cream"
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper"
                  >
                    <svg width="7" height="8" viewBox="0 0 10 12" fill="currentColor">
                      <path d="M0 0.8v10.4a.8.8 0 0 0 1.2.7l9-5.2a.8.8 0 0 0 0-1.4l-9-5.2A.8.8 0 0 0 0 .8Z" />
                    </svg>
                  </span>
                  Watch sample videos
                </a>
              </Magnetic>
            </div>
          </Reveal>

          {/* Three facts, divided rather than bulleted. Dividers keep them
              reading as one line of specification; bullets would make them
              look like a feature list that got cut short. */}
          <Reveal delay={400}>
            <ul className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
              {FACTS.map((fact, i) => (
                <li key={fact} className="flex items-center gap-4">
                  {/* Hidden below `sm`: once the row wraps, a divider can end
                      up leading a new line with nothing to its left, which
                      reads as a stray mark rather than a separator. */}
                  {i > 0 && <span aria-hidden className="hidden h-3.5 w-px bg-ink/15 sm:block" />}
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="h-1 w-1 rounded-full bg-accent-ink" />
                    {fact}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={470}>
            <div className="mt-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Ready for your favourite platforms
              </p>
              <PlatformRow className="mt-4" />
            </div>
          </Reveal>
        </div>

        {/* ── Right: the fan ──────────────────────────────────────────────── */}
        <Reveal delay={140}>
          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none lg:pt-14">
            <Annotation
              arrow="down-right"
              className="absolute -top-3 left-0 z-20 hidden -rotate-6 lg:flex xl:left-6"
            >
              The only time he was filmed.
            </Annotation>

            <Sparkle className="absolute right-2 top-2 z-20 hidden lg:block" />

            {/* The fan itself.

                `items-end` with per-card margins rather than absolute
                positioning: the row still has a real height, so the section
                below it cannot be overlapped, and it collapses to three even
                cards on a phone without any of the offsets needing to be
                unwound. */}
            <div className="flex items-end justify-center gap-2 sm:gap-3 lg:gap-4">
              <div className="-mr-4 w-[31%] -rotate-[6deg] pb-10 transition-transform duration-[900ms] ease-luxe hover:-translate-y-2 hover:rotate-[-4deg] sm:-mr-5">
                <PhoneCard clip={FAN[0]!} />
              </div>
              <div className="z-10 w-[38%] transition-transform duration-[900ms] ease-luxe hover:-translate-y-2.5">
                <PhoneCard clip={FAN[1]!} />
              </div>
              <div className="-ml-4 w-[31%] rotate-[6deg] pb-10 transition-transform duration-[900ms] ease-luxe hover:-translate-y-2 hover:rotate-[4deg] sm:-ml-5">
                <PhoneCard clip={FAN[2]!} />
              </div>
            </div>

            <Annotation
              arrow="up-left"
              className="absolute -bottom-14 right-0 z-20 hidden rotate-3 items-end text-right lg:flex"
            >
              Both made by his AI clone.
            </Annotation>

            {/* The key, in words. The bands say it visually; this says it for
                anyone who reads before they look — and on a phone, where the
                handwritten notes are hidden, it is the only explanation. */}
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted lg:mt-16">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-2 rounded-full bg-flare" />
                1 real recording
              </span>
              <span aria-hidden className="text-ink/30">→</span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-4 rounded-full bg-spectrum" />
                2 videos generated from it
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
