/**
 * What happens between "we made it" and "you saw it".
 *
 * This is the part of the product nobody can see from the outside and the part
 * the whole pitch rests on, so it gets the same explainer treatment as the
 * four steps on the home page — a badge, a mock of the real screen, a title
 * and a paragraph. Using the identical card here is the point: it says this is
 * a step of the process, not a marketing claim bolted onto the end of it.
 *
 * Three cards rather than four, because there are three things to say. Padding
 * it out to a fourth to match the home page's grid would be designing for the
 * layout instead of for the reader.
 */

import { Reveal } from "@olum-video/ui";

import { ExplainerGrid, ExplainerHeading, type ExplainerItem } from "../components/Explainer";
import { Annotation } from "../components/Marks";

/** ── The script that comes back ─────────────────────────────────────────── */
function ScriptMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">Your prompt</p>
      <p className="mt-1.5 text-[12px] leading-snug text-ink">
        “Something about why most AI demos never ship.”
      </p>
      <p className="mt-3.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
        What we wrote
      </p>
      {/* Ruled lines rather than real sentences. A paragraph of filler here
          invites you to read it and find out it says nothing; lines read as
          "a script exists" at a glance and cost no attention. */}
      <span className="mt-2 block space-y-1.5" aria-hidden>
        <span className="block h-1.5 w-full rounded-full bg-ink/12" />
        <span className="block h-1.5 w-[92%] rounded-full bg-ink/12" />
        <span className="block h-1.5 w-[78%] rounded-full bg-ink/12" />
        <span className="block h-1.5 w-[86%] rounded-full bg-ink/12" />
      </span>
    </div>
  );
}

/** ── The editor's pass ──────────────────────────────────────────────────── */
function ReviewMock() {
  const checks = ["Cut trimmed", "Captions timed", "Audio levelled"];
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="flex items-center gap-2 text-[12px] text-ink">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
        An editor has this
      </p>
      <ul className="mt-3 space-y-2">
        {checks.map((check) => (
          <li key={check} className="flex items-center gap-2 text-[11.5px] text-muted">
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
            {check}
          </li>
        ))}
      </ul>
      <p className="mt-3.5 border-t border-subtle pt-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted">
        Then it comes to you
      </p>
    </div>
  );
}

/** ── The revision counter ───────────────────────────────────────────────── */
function RevisionMock() {
  return (
    <div className="w-full rounded-[14px] border border-subtle bg-paper p-4 shadow-[0_14px_34px_-26px_rgb(var(--ink-rgb)/0.5)]">
      <p className="text-[12px] text-ink">Ready for your review</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-serif text-[30px] leading-none text-accent-ink">2</span>
        <span className="text-[11.5px] text-muted">of 2 revisions left</span>
      </p>
      <span aria-hidden className="mt-3 block h-1 w-full overflow-hidden rounded-full bg-ink/10">
        <span className="block h-full w-full rounded-full bg-accent-ink" />
      </span>
      <div className="mt-4 flex gap-2">
        <span className="rounded-full bg-ink px-3 py-1.5 text-[11px] text-paper">Approve</span>
        <span className="rounded-full border border-subtle px-3 py-1.5 text-[11px] text-muted">
          Request changes
        </span>
      </div>
    </div>
  );
}

const ITEMS: ExplainerItem[] = [
  {
    index: "01",
    title: "We write it from your prompt",
    body: "Send a line about what you want to say. We turn it into a script in your voice — or record the one you already wrote.",
    mock: <ScriptMock />,
  },
  {
    index: "02",
    title: "A person cuts it",
    body: "Nothing generated reaches you untouched. An editor trims the take, times the captions and fixes what the model got wrong.",
    mock: <ReviewMock />,
  },
  {
    index: "03",
    title: "You have the last word",
    body: "It lands with you before it lands anywhere else. Two revisions are included, and our own mistakes never count against them.",
    mock: <RevisionMock />,
  },
];

export function InsideTheEdit() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32" aria-label="Inside the edit">
      <ExplainerHeading
        eyebrow="The part that is not automated"
        lines={["Generated by a model.", <span className="text-spectrum">Finished by a person.</span>]}
        body="Every video passes through a human before it passes to you. This is what happens in between."
      />

      <ExplainerGrid items={ITEMS} columns={3} mockHeight={210} className="mx-auto mt-14 max-w-5xl" />

      <Reveal delay={200}>
        <div className="mt-12 flex justify-center">
          <Annotation arrow="up-left" wide className="items-center text-center">
            This is the bit the cheap tools skip.
          </Annotation>
        </div>
      </Reveal>
    </section>
  );
}
