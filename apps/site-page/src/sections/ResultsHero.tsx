/**
 * The opening of /results.
 *
 * The page's whole job is a distinction — this clip is raw, that one is
 * finished — so the hero teaches the distinction before showing a single
 * frame of it. The legend below the copy is not decoration: it is the key to
 * the ring language every tile on the page uses, and a visitor who scrolls
 * past it still meets the same two words on the tiles themselves.
 *
 * The drifting field behind it is the same material as every other hero on the
 * site. Atmosphere rather than information, so it costs the reader nothing to
 * ignore.
 */

import { Reveal, RevealLines } from "@olum-video/ui";

import { ParticleField } from "../motion/ParticleField";
import { Annotation } from "../components/Marks";

/**
 * The two kinds of tile, stated once.
 *
 * Each swatch is the actual treatment it describes — a plain hairline against
 * a spectrum ring — drawn at tile scale so the eye matches it to the real
 * thing further down without being told to.
 */
const KEY = [
  {
    // The raw tile's hairline is `bg-paper/20` — a LIGHT ring, because on the
    // wall it sits on near-black. Reproduced on paper it would be paper on
    // paper and vanish, which is why each swatch carries its own dark plate.
    ring: "bg-paper/25",
    term: "Raw take",
    body: "Straight off the camera. No captions, no cuts, no b-roll, no music.",
  },
  {
    ring: "bg-spectrum",
    term: "Finished video",
    body: "Scripted, cut, captioned and levelled — then checked by a human editor.",
  },
];

export function ResultsHero() {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-16 pt-28 sm:pb-20 lg:pt-36">
      <ParticleField ambientSpectrum className="absolute inset-0 -z-10" />

      {/* Two soft washes, warm on one side and cool on the other, so the paper
          has a direction to it. A single centred glow reads as a spotlight. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(46% 44% at 10% 4%, rgb(var(--violet-rgb)/0.12), transparent 68%), radial-gradient(52% 46% at 92% 18%, rgb(var(--flare-rgb)/0.12), transparent 70%), radial-gradient(64% 52% at 50% 104%, rgb(var(--teal-rgb)/0.1), transparent 72%)",
        }}
      />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-subtle bg-paper/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-sm">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-flare" />
                Raw takes and finished cuts
              </p>
            </Reveal>

            <RevealLines
              as="h1"
              className="mt-7 font-serif text-[clamp(2.4rem,5.4vw,4.2rem)] leading-[1.04] tracking-tight"
              lines={[
                "Nothing here went",
                "out the way it",
                <span className="text-spectrum">was recorded.</span>,
              ]}
            />

            <Reveal delay={160}>
              <p className="mt-8 max-w-readable text-[15px] leading-relaxed text-muted">
                Three people, and the videos their accounts actually published. Where we have the
                raw footage it sits on the left, untouched, next to what went out. Press any clip
                to turn the sound on.
              </p>
            </Reveal>
          </div>

          {/* ── The key ─────────────────────────────────────────────────── */}
          <Reveal delay={240}>
            {/* `bg-ink/10`, not `bg-subtle` — `subtle` is a BORDER colour in the
                preset and has no background utility. The hairline between the
                two rows is this background showing through a 1px grid gap. */}
            <dl className="grid gap-px overflow-hidden rounded-card border border-subtle bg-ink/10">
              {KEY.map((item) => (
                <div key={item.term} className="flex gap-4 bg-paper/80 px-5 py-5 backdrop-blur-sm">
                  {/* The swatch is the treatment itself: the same 1px ring the
                      tiles wear, around a 9:16 frame, on a plate of the same
                      near-black the tiles sit on. Without the plate the ring
                      has no context and the two rows look identical. */}
                  <span aria-hidden className="mt-0.5 shrink-0 rounded-[13px] bg-panel p-2.5">
                    <span className={`block rounded-[9px] p-px ${item.ring}`}>
                      <span className="block h-[38px] w-[22px] rounded-[8px] bg-paper/[0.07]" />
                    </span>
                  </span>
                  <div className="min-w-0">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                      {item.term}
                    </dt>
                    <dd className="mt-2 text-[13.5px] leading-relaxed text-ink">{item.body}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={320}>
          <div className="mt-10 flex justify-start">
            <Annotation arrow="down-right" wide>
              Every clip below is real footage. Nothing on this page is a mockup.
            </Annotation>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
