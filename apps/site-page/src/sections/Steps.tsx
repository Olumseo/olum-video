/**
 * How Olum works, in five cards: share, create, post, track, improve.
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

/** ── 02 ─ the output ─────────────────────────────────────────────────────── */
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

/** ── 03 ─ posting ────────────────────────────────────────────────────────── */
const POSTED = [
  { name: "Instagram", when: "9:00" },
  { name: "LinkedIn", when: "9:05" },
  { name: "TikTok", when: "9:10" },
];

function PostMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-3.5 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">Today</p>
      <ul className="mt-2 space-y-1.5">
        {POSTED.map((post) => {
          const platform = PLATFORMS.find((p) => p.name === post.name);
          return (
            <li key={post.name} className="flex items-center gap-2 text-[11.5px] text-ink">
              <Tick />
              {platform && <PlatformMark platform={platform} size={12} />}
              {post.name}
              <span className="ml-auto font-mono text-[10px] text-muted">{post.when}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** ── 04 ─ tracking ───────────────────────────────────────────────────────── */
const BARS = [22, 30, 26, 38, 34, 48, 44, 58, 54, 70];

function TrackMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Views", "12.4k"],
          ["Watch", "71%"],
          ["Saves", "318"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="mt-0.5 font-display text-[15px] text-ink">{value}</p>
          </div>
        ))}
      </div>
      {/* Bars rather than a path: ten divs survive every restyle, and the
          only thing this needs to say is "the line goes up". */}
      <span aria-hidden className="mt-3 flex h-14 items-end gap-[3px]">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-[3px] ${i === BARS.length - 1 ? "bg-spectrum-v" : "bg-teal-ink/30"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </span>
    </div>
  );
}

/** ── 05 ─ improving ──────────────────────────────────────────────────────── */
function ImproveMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">Next week</p>
      <ul className="mt-2.5 space-y-1.5 text-[11.5px]">
        <li className="flex items-center gap-2 text-ink">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-success-ink" />
          More of: question hooks
        </li>
        <li className="flex items-center gap-2 text-ink">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-success-ink" />
          Topic: AI tools for clinics
        </li>
        <li className="flex items-center gap-2 text-muted line-through decoration-ink/30">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink/25" />
          Long intros
        </li>
      </ul>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-spectrum px-2.5 py-1 text-[10.5px] text-paper">
        Learned from 30 posts
      </p>
    </div>
  );
}

function Tick() {
  return (
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
  );
}

/**
 * The five steps, in the words the home page uses everywhere: you share your
 * videos once, and Olum does the other four — creating, posting, tracking and
 * improving. Step 2 wears the spectrum edge because it is where all the work
 * happens.
 */
const STEPS = [
  {
    index: "01",
    title: "Share your videos",
    body: "Send us a few videos of yourself and tell us about your business, audience, and goals.",
    mock: <UploadMock />,
  },
  {
    index: "02",
    highlight: "Where the work happens",
    title: "Olum creates everything",
    body: "Olum's AI agents find content ideas, research each topic, write scripts and hooks, create captions, generate your AI avatar videos and edit each one.",
    mock: <OutputMock />,
  },
  {
    index: "03",
    title: "Olum posts your content",
    body: "Olum publishes the finished videos to your social media accounts.",
    mock: <PostMock />,
  },
  {
    index: "04",
    title: "Olum tracks performance",
    body: "Olum tracks views, watch time, engagement, and other performance data.",
    mock: <TrackMock />,
  },
  {
    index: "05",
    title: "Olum improves future content",
    body: "The agents use the performance data to improve the next topics, scripts, hooks, captions, and videos.",
    mock: <ImproveMock />,
  },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:pb-32" aria-label="How Olum works">
      <ExplainerHeading
        eyebrow="How Olum works"
        lines={["You share your videos.", <span className="text-spectrum">Olum does the rest.</span>]}
        body="From the first idea to the performance report, every step after the first one is Olum's."
      />

      <ExplainerGrid items={STEPS} columns={5} mockHeight={172} className="mt-14" />

      <Reveal delay={200}>
        <div className="mt-12 flex justify-center">
          <Annotation arrow="up-left" wide className="items-center text-center">
            Four of these five are not your job.
          </Annotation>
        </div>
      </Reveal>
    </section>
  );
}
