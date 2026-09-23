/**
 * How it works, in four cards.
 *
 * Each card carries a small mock of the thing it describes rather than an
 * icon. An icon says "this step exists"; a picture of the actual screen says
 * what the step will feel like, which is the only question a visitor is really
 * asking at this point on the page.
 *
 * The mocks are built in DOM, not screenshotted. A screenshot of a real
 * account is customer data on a public page, it goes stale the first time a
 * badge is restyled, and it ships a few hundred kilobytes to show something
 * that is four boxes and a line of type.
 */

import { Reveal } from "@olum-video/ui";

import { ExplainerGrid, ExplainerHeading } from "../components/Explainer";

import { PlatformMark } from "../components/PlatformMarks";
import { PLATFORMS } from "../components/platforms";
import { Annotation } from "../components/Marks";

const base = import.meta.env.BASE_URL;

/** ── 01 ─ the upload ─────────────────────────────────────────────────────── */
function UploadMock() {
  return (
    <div className="relative mx-auto h-full max-h-[178px] overflow-hidden rounded-[14px] bg-panel shadow-[0_18px_40px_-24px_rgb(var(--ink-rgb)/0.55)] ring-1 ring-inset ring-ink/10">
      <img
        src={`${base}media/source-capture.jpg`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="h-full w-auto object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-panel to-transparent pb-2.5 pt-6">
        <span aria-hidden className="h-2 w-2 rounded-full bg-danger-ink" />
        <span className="font-mono text-[10px] text-paper/90">0:33</span>
      </span>
    </div>
  );
}

/** ── 02 ─ what you do ────────────────────────────────────────────────────── */
const TOPICS = ["AI tools", "Small business", "Productivity", "Education"];

function TopicsMock() {
  return (
    <div className="rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="text-[12px] text-muted">What do you do?</p>
      <p className="mt-2 truncate rounded-[9px] border border-subtle bg-cream/50 px-2.5 py-2 text-[12px] text-ink">
        I help small businesses use AI…
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {TOPICS.map((topic, i) => (
          <li
            key={topic}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              i === 0
                ? "border-accent-ink/40 bg-accent/10 text-accent-ink"
                : "border-subtle text-muted"
            }`}
          >
            {topic}
          </li>
        ))}
        <li className="rounded-full border border-dashed border-subtle px-2.5 py-1 text-[11px] text-muted">
          +
        </li>
      </ul>
    </div>
  );
}

/** ── 03 ─ the output ─────────────────────────────────────────────────────── */
function OutputMock() {
  const shots = [
    { src: `${base}media/generated-astra.jpg`, time: "0:57" },
    { src: `${base}media/generated-agi.jpg`, time: "1:00" },
    { src: `${base}media/source-capture.jpg`, time: "0:33" },
  ];
  return (
    <div className="flex items-end justify-center gap-2">
      {shots.map((shot, i) => (
        <div
          key={shot.src + i}
          className={`relative overflow-hidden rounded-[11px] bg-panel shadow-[0_14px_30px_-20px_rgb(var(--ink-rgb)/0.55)] ring-1 ring-inset ring-ink/10 ${
            i === 1 ? "w-[38%]" : "w-[29%] mb-3"
          }`}
        >
          <img
            src={shot.src}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="aspect-[9/16] w-full object-cover"
          />
          <span className="absolute left-1.5 top-1.5 rounded-full bg-panel/70 px-1.5 py-0.5 font-mono text-[9px] text-paper/85 backdrop-blur-sm">
            {shot.time}
          </span>
        </div>
      ))}
    </div>
  );
}

/** ── 04 ─ the human edit ─────────────────────────────────────────────────── */
function EditMock() {
  const checks = ["Take trimmed", "Captions timed", "Audio levelled"];
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="flex items-center gap-2 text-[11.5px] text-ink">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
        An editor has this
      </p>

      {/* A cut timeline. Three clips and a playhead is the least drawing that
          still reads unmistakably as "someone is editing this", and it is the
          one picture on the page that shows work being done BY A PERSON
          rather than by the product. */}
      <span aria-hidden className="mt-3 flex h-7 items-stretch gap-1">
        <span className="w-[42%] rounded-[5px] bg-accent-ink/25" />
        <span className="w-[26%] rounded-[5px] bg-teal-ink/25" />
        <span className="w-[32%] rounded-[5px] bg-violet-ink/25" />
      </span>
      <span aria-hidden className="mt-1.5 block h-px w-full bg-ink/10" />

      <ul className="mt-3 space-y-1.5">
        {checks.map((check) => (
          <li key={check} className="flex items-center gap-2 text-[11px] text-muted">
            <span
              aria-hidden
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-success-ink text-paper"
            >
              <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1.5 5.2 3.9 7.6 8.5 2.6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {check}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ── 05 ─ approval ───────────────────────────────────────────────────────── */
function ApproveMock() {
  return (
    <div className="rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <ul className="flex items-center gap-3 text-ink">
        {PLATFORMS.map((platform) => (
          <li key={platform.name}>
            <PlatformMark platform={platform} size={17} />
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2">
        <p className="flex items-center gap-2 rounded-[9px] border border-accent-ink/35 bg-accent/10 px-2.5 py-2 text-[11.5px] text-ink">
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
          Approve before posting
        </p>
        {/* Labelled as upcoming rather than as a switch you can flip today.
            Drawing an option the product does not have is the difference
            between a mock and a promise. */}
        <p className="flex items-center gap-2 rounded-[9px] border border-subtle px-2.5 py-2 text-[11.5px] text-muted">
          <span aria-hidden className="h-4 w-4 shrink-0 rounded-full border border-subtle" />
          Auto-publish
          <span className="ml-auto shrink-0 rounded-full border border-subtle px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
            Soon
          </span>
        </p>
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11.5px] text-paper">
        Start posting
        <span aria-hidden>→</span>
      </p>
    </div>
  );
}

/**
 * Five steps, not four.
 *
 * The edit used to be half a clause inside "Olum makes the content" — the word
 * "edits" in a list of six things the software does. That is the opposite of
 * what this product is: the human pass is the reason a cut is publishable, and
 * burying it in a sentence about automation gave it away to every competitor
 * who does not have one. It is now its own numbered step, with its own picture,
 * and it is the only card on the page wearing the spectrum edge.
 */
const STEPS = [
  {
    index: "01",
    title: "Upload one talking video",
    body: "Record a short video of yourself once, with consent. That is what your clone is built from — and the last time you set up a camera.",
    mock: <UploadMock />,
  },
  {
    index: "02",
    title: "Tell Olum what you do",
    body: "Choose your topics, audience and brand voice, or just describe your business in a sentence.",
    mock: <TopicsMock />,
  },
  {
    index: "03",
    title: "Olum generates the videos",
    body: "It finds the ideas, writes the scripts in your voice and generates each video from your clone.",
    mock: <OutputMock />,
  },
  {
    index: "04",
    highlight: "The part that matters",
    title: "A human editor cuts every one",
    body: "Nothing generated goes out raw. An editor on our team trims the take, times the captions, levels the audio and fixes what the model got wrong.",
    mock: <EditMock />,
  },
  {
    index: "05",
    title: "Approve, then publish",
    body: "It reaches you only after that pass. Approve it and it is ready for your channels — two revisions included.",
    mock: <ApproveMock />,
  },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:pb-32" aria-label="How it works">
      <ExplainerHeading
        eyebrow="How it works"
        lines={["From one upload to", <span className="text-spectrum">daily posting.</span>]}
        body="Olum turns a single recording into a repeatable content system for your socials."
      />

      <ExplainerGrid items={STEPS} columns={5} mockHeight={172} className="mt-14" />

      <Reveal delay={200}>
        <div className="mt-12 flex justify-center">
          <Annotation arrow="up-left" wide className="items-center text-center">
            And not one of these five is your job.
          </Annotation>
        </div>
      </Reveal>
    </section>
  );
}
