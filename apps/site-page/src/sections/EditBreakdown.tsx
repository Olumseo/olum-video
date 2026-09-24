/**
 * What actually happens between the raw take and the finished video.
 *
 * The wall above proves that something changed. This says what. Without it the
 * page is a before-and-after with a magic arrow in the middle, and the reader
 * is left to assume the difference is a filter.
 *
 * Same card vocabulary as /how-it-works and the home steps — badge, DOM mock,
 * title, paragraph — because these four are a zoom into step 04 there, not a
 * different subject. The mocks are built in DOM rather than screenshotted: a
 * screenshot goes stale the first time a badge is restyled and ships a few
 * hundred kilobytes to show four boxes and a line of type.
 */

import { Reveal } from "@olum-video/ui";

import { ExplainerGrid, ExplainerHeading } from "../components/Explainer";
import { Annotation } from "../components/Marks";

/** ── 01 ─ the hook ───────────────────────────────────────────────────────── */
function HookMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Timeline</p>

      {/* The first slice, in spectrum; the rest of the clip in flat grey. The
          whole point is the proportion — the part that decides whether anyone
          watches is a sliver of the runtime. */}
      <span aria-hidden className="mt-3 flex h-8 items-stretch gap-1">
        <span className="w-[14%] rounded-[5px] bg-spectrum-v" />
        <span className="flex-1 rounded-[5px] bg-ink/10" />
      </span>

      <div className="mt-2.5 flex items-baseline justify-between">
        <span className="font-mono text-[10px] text-accent-ink">0:00 – 0:02</span>
        <span className="font-mono text-[10px] text-muted">0:57</span>
      </div>

      <p className="mt-4 rounded-[9px] border border-subtle bg-cream/50 px-2.5 py-2 text-[11.5px] leading-snug text-ink">
        “Here’s what the new numbers actually mean.”
      </p>
    </div>
  );
}

/** ── 02 ─ the captions ───────────────────────────────────────────────────── */
const CAPTION_LINES = [
  { text: "and trained specifically", width: "w-[86%]", live: true },
  { text: "on AI job loss fears", width: "w-[70%]", live: false },
  { text: "which is the part nobody", width: "w-[92%]", live: false },
];

function CaptionMock() {
  return (
    // Drawn on the dark panel colour, because that is where burned-in captions
    // actually live — on the footage. On paper they would read as form fields.
    <div className="flex h-full w-full flex-col justify-end gap-2 rounded-[14px] bg-panel p-4 ring-1 ring-inset ring-ink/10">
      {CAPTION_LINES.map((line) => (
        <span
          key={line.text}
          className={`block truncate rounded-[6px] px-2 py-1.5 text-center text-[11px] leading-none ${line.width} ${
            line.live ? "bg-paper text-ink" : "bg-paper/15 text-paper/55"
          }`}
        >
          {line.text}
        </span>
      ))}
      <span className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-paper/55">
        timed to the word
      </span>
    </div>
  );
}

/** ── 03 ─ the b-roll ─────────────────────────────────────────────────────── */
const STRIPS: { kind: string; width: string; tone: string }[] = [
  { kind: "you", width: "w-[26%]", tone: "bg-accent-ink/30" },
  { kind: "b-roll", width: "w-[18%]", tone: "bg-teal-ink/30" },
  { kind: "you", width: "w-[14%]", tone: "bg-accent-ink/30" },
  { kind: "b-roll", width: "w-[24%]", tone: "bg-violet-ink/30" },
  { kind: "you", width: "w-[18%]", tone: "bg-accent-ink/30" },
];

function BRollMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Cut</p>
        <p className="font-mono text-[10px] text-muted">9 cuts</p>
      </div>

      <span aria-hidden className="mt-3 flex h-9 items-stretch gap-1">
        {STRIPS.map((strip, i) => (
          <span key={i} className={`rounded-[5px] ${strip.width} ${strip.tone}`} />
        ))}
      </span>
      <span aria-hidden className="mt-1.5 block h-px w-full bg-ink/10" />

      <ul className="mt-3.5 flex flex-wrap gap-1.5">
        {["You", "B-roll"].map((term, i) => (
          <li
            key={term}
            className="flex items-center gap-1.5 rounded-full border border-subtle px-2.5 py-1 text-[11px] text-muted"
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-accent-ink" : "bg-teal-ink"}`}
            />
            {term}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ── 04 ─ the pass a person makes ────────────────────────────────────────── */
const BARS = [12, 26, 18, 34, 22, 40, 28, 44, 30, 36, 20, 30, 16, 26, 14];

function LevelMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Audio</p>

      {/* A waveform, drawn as bars rather than a path. It is fifteen divs and
          it survives a font change, a colour change and a dark mode that does
          not exist yet — which an SVG squiggle exported from somewhere does
          not. */}
      <span aria-hidden className="mt-3 flex h-12 items-center justify-between gap-[3px]">
        {BARS.map((height, i) => (
          <span
            key={i}
            className="w-full rounded-full bg-teal-ink/45"
            style={{ height: `${height}px` }}
          />
        ))}
      </span>

      <p className="mt-4 flex items-center gap-2 text-[11.5px] text-ink">
        <span
          aria-hidden
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-ink text-paper"
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5.2 3.9 7.6 8.5 2.6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Signed off by an editor
      </p>
    </div>
  );
}

const STAGES = [
  {
    index: "01",
    title: "The first two seconds",
    body: "The take gets trimmed to the line that earns the scroll. Everything before it goes, however good it was.",
    mock: <HookMock />,
  },
  {
    index: "02",
    title: "Captions, timed by hand",
    body: "Burned in, word by word, sitting where the platform will not cover them with its own interface.",
    mock: <CaptionMock />,
  },
  {
    index: "03",
    title: "B-roll cut to the words",
    body: "Footage, headlines and screenshots land on the point they illustrate — not on a fixed interval.",
    mock: <BRollMock />,
  },
  {
    index: "04",
    highlight: "Nothing skips this",
    title: "Levelled, then watched",
    body: "Audio matched end to end, then an editor on our team plays the whole thing back before you ever see it.",
    mock: <LevelMock />,
  },
];

export function EditBreakdown() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:pb-32" aria-label="Inside the edit">
      <ExplainerHeading
        eyebrow="Between the two columns"
        lines={["Four things happen", <span className="text-spectrum">to every single clip.</span>]}
        body="This is the difference between the left-hand tile and the right-hand one — and the part of the job that never became software."
      />

      <ExplainerGrid items={STAGES} columns={4} mockHeight={186} className="mt-14" />

      <Reveal delay={200}>
        <div className="mt-12 flex justify-center">
          <Annotation arrow="up-left" wide className="items-center text-center">
            None of these four are your job either.
          </Annotation>
        </div>
      </Reveal>
    </section>
  );
}
