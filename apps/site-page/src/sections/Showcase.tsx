/**
 * The proof.
 *
 * One real recording on the left, two real finished videos made from it on the
 * right. No mockups, no stock footage, no "imagine if" — this is the whole
 * product argument in one panel, and nothing else on the page can make it as
 * well as thirty seconds of watching it happen.
 *
 * SAYING "ONE BECAME TWO" FOUR DIFFERENT WAYS
 * --------------------------------------------
 * A visitor who does not understand what they are looking at here has not been
 * sold anything, so the relationship is stated redundantly and on purpose:
 *
 *   by NUMBER — the columns are labelled 01 and 02;
 *   by WORD   — "recorded" against "generated from it";
 *   by RING   — the source has a plain hairline, the generated pair a spectrum
 *               one, and the connector between them is that same spectrum;
 *   by SHAPE  — one wide tile against two narrow ones, so "one → many" is
 *               visible from across the room with the text unread.
 *
 * WHY IT IS THE ONE DARK SURFACE ON THE SITE
 * -------------------------------------------
 * A warm paper page with video tiles dropped into it makes the video look like
 * an illustration. Sunk into near-black, the same tiles read as a screen — the
 * frame stops competing with the footage and the eye goes to the faces. Used
 * exactly once; a second dark panel would cost this one its authority.
 */

import { useEffect, useState } from "react";

import { Reveal, RevealLines } from "@olum-video/ui";

import { ParticleField } from "../motion/ParticleField";
import { ShowcaseVideo, type Clip } from "../components/ShowcaseVideo";

/**
 * Asset URLs go through `BASE_URL`, never a bare "/media/...".
 *
 * This app is served from /video/welcome/ in production and from the same
 * prefix in dev. A root-absolute path would ask olum.ai's main SPA for a file
 * it has never heard of, and the tiles would show posters that 404.
 */
const base = import.meta.env.BASE_URL;

const SOURCE: Clip = {
  id: "source",
  src: `${base}media/source-capture.mp4`,
  poster: `${base}media/source-capture.jpg`,
  caption: "The recording",
  label: "One sitting, one camera",
  duration: "0:33",
  alt: "The original consent recording: a man sitting on a sofa, talking to the camera in ordinary room light.",
  // Shot vertically on a phone. The stream probes as 1920x1080 because the
  // rotation is a metadata flag, not pixels — these are the ENCODED numbers,
  // which are what the browser lays out from. They MUST be updated whenever the
  // file is re-encoded; a stale pair here is what cropped the subject's head
  // off the first time.
  width: 624,
  height: 1110,
  kind: "source",
};

const GENERATED: Clip[] = [
  {
    id: "astra",
    src: `${base}media/generated-astra.mp4`,
    poster: `${base}media/generated-astra.jpg`,
    caption: "Generated",
    label: "Benchmark explainer",
    duration: "0:57",
    alt: "A finished vertical video: the digital twin presents AI benchmark results, cut together with charts, b-roll and burned-in captions.",
    width: 480,
    height: 854,
    kind: "generated",
  },
  {
    id: "agi",
    src: `${base}media/generated-agi.mp4`,
    poster: `${base}media/generated-agi.jpg`,
    caption: "Generated",
    label: "News reaction",
    duration: "1:00",
    alt: "A finished vertical video: the digital twin reacts to an industry announcement, cut together with screenshots, headlines and burned-in captions.",
    width: 480,
    height: 854,
    kind: "generated",
  },
];

/** The small numbered heading above each column. */
function ColumnLabel({
  index,
  title,
  note,
  spectrum = false,
}: {
  index: string;
  title: string;
  note: string;
  spectrum?: boolean;
}) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span
        className={`font-mono text-[11px] tracking-[0.2em] ${
          spectrum ? "text-spectrum" : "text-paper/60"
        }`}
      >
        {index}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/90">{title}</p>
        <p className="mt-1 text-[13px] leading-snug text-paper/70">{note}</p>
      </div>
    </div>
  );
}

export function Showcase() {
  /**
   * Which tile is playing with sound, if any.
   *
   * It lives here rather than in the tiles because "only one may be loud" is a
   * fact about the set, not about any member of it. Pressing a second tile
   * simply moves this id, which mutes the first on its next render.
   */
  const [loud, setLoud] = useState<string | null>(null);

  // Escape returns everything to silent wallpaper. There is no modal to close
  // any more, but Escape is still where people reach to back out of something.
  useEffect(() => {
    if (!loud) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoud(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loud]);

  return (
    <section
      className="px-4 pb-24 pt-4 sm:px-6 lg:pb-32"
      aria-label="One recording, two generated videos"
    >
      {/* Hairline gradient edge on the panel itself. One pixel, and it is the
          difference between a black rectangle and a rendered object. */}
      <div className="mx-auto max-w-7xl rounded-[29px] bg-gradient-to-b from-paper/20 via-paper/5 to-transparent p-px">
        <div className="relative overflow-hidden rounded-panel bg-panel px-5 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          {/* The same ambient field as the rest of the site, inverted. Sharing
              the material across a light and a dark surface is what stops the
              panel reading as a foreign object pasted onto the page. */}
          <ParticleField tone="dark" className="absolute inset-0" />

          {/* Spectrum wash. Very low opacity — it is there to keep the
              near-black from going dead flat, not to be seen as a gradient. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              background:
                "radial-gradient(60% 55% at 14% 8%, rgb(var(--flare-rgb)/0.55), transparent 68%), radial-gradient(55% 50% at 88% 88%, rgb(var(--violet-rgb)/0.6), transparent 70%), radial-gradient(42% 42% at 60% 18%, rgb(var(--teal-rgb)/0.45), transparent 70%)",
            }}
          />

          <div className="relative">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2.5 rounded-full border border-paper/20 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/85">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-spectrum" />
                Real output, not a mockup
              </p>
              <RevealLines
                as="h2"
                className="mt-6 font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] tracking-tight text-paper"
                lines={["He recorded once.", "Everything else was generated."]}
              />
              <Reveal delay={140}>
                <p className="mt-6 max-w-readable text-[15px] leading-relaxed text-paper/75">
                  The clip on the left is the only time this person sat in front of a camera. Both
                  videos on the right were generated from it — same face, same voice — then
                  scripted, cut and captioned by our editors. Press any of them to turn the sound on.
                </p>
              </Reveal>
            </div>

            <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[0.82fr_auto_1.18fr] lg:items-start lg:gap-10">
              <Reveal delay={80}>
                <ColumnLabel
                  index="01"
                  title="Recorded"
                  note="Filmed once, with consent, on a phone."
                />
                {/* Held to a readable width. The column is wide enough to
                    stretch a 9:16 clip to nearly 800px tall, which would tower
                    over the pair beside it and break the "one became two"
                    reading the panel is built on. */}
                <div className="mx-auto max-w-[300px] lg:mx-0">
                  <ShowcaseVideo
                    clip={SOURCE}
                    active={loud === SOURCE.id}
                    onActivate={(id) => setLoud((current) => (current === id ? null : id))}
                  />
                </div>

                {/* Three facts under the source tile.

                    They balance the column — a 16:9 tile is much shorter than
                    two stacked 9:16 ones, and without this the left side is a
                    small picture floating in a lot of black. They also carry
                    their weight: "no retakes" and "no studio" are the two
                    objections this panel exists to answer. */}
                <dl className="mx-auto mt-6 grid max-w-[300px] grid-cols-3 lg:mx-0 gap-px overflow-hidden rounded-card border border-paper/12 bg-paper/12">
                  {[
                    ["Length", "33 sec"],
                    ["Kit", "One phone"],
                    ["Retakes", "None"],
                  ].map(([term, value]) => (
                    <div key={term} className="bg-panel px-4 py-4">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">
                        {term}
                      </dt>
                      <dd className="mt-1.5 font-display text-[15px] tracking-tight text-paper">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>

              {/* The connector, pointing whichever way the grid runs.

                  Below `lg` the columns stack, so it is a VERTICAL rule; from
                  `lg` up they sit in a row, so it turns HORIZONTAL. Getting
                  this the wrong way round is not cosmetic — an arrow across a
                  column break tells the reader two things are side by side when
                  they are one above the other. */}
              <Reveal delay={200}>
                <div
                  aria-hidden
                  className="flex flex-col items-center justify-center gap-3 lg:h-full lg:flex-row lg:pt-40"
                >
                  <span className="h-12 w-px bg-spectrum-v lg:h-px lg:w-10 lg:bg-spectrum" />
                  <span className="whitespace-nowrap rounded-full border border-paper/25 bg-panel/60 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/90 backdrop-blur-md">
                    generates
                  </span>
                  <span className="h-12 w-px bg-spectrum-v lg:h-px lg:w-10 lg:bg-spectrum" />
                </div>
              </Reveal>

              <Reveal delay={140}>
                <ColumnLabel
                  index="02"
                  title="Generated from it"
                  note="Two of the videos his twin has made since."
                  spectrum
                />
                <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-4 sm:gap-5 lg:mx-0 lg:max-w-none">
                  {GENERATED.map((clip) => (
                    <ShowcaseVideo
                      key={clip.id}
                      clip={clip}
                      active={loud === clip.id}
                      onActivate={(id) => setLoud((current) => (current === id ? null : id))}
                    />
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
