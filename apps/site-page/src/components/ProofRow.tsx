/**
 * One person's before and after: what went in on the left, what came out on
 * the right, and a connector saying which way to read it.
 *
 * SAYING "ONE BECAME TWO" FOUR DIFFERENT WAYS
 * --------------------------------------------
 * A visitor who does not understand what they are looking at here has not been
 * sold anything, so the relationship is stated redundantly and on purpose:
 *
 *   by NUMBER — the columns are labelled 01 and 02;
 *   by WORD   — "raw" against "what went out";
 *   by RING   — the raw take has a plain hairline, the finished pair a
 *               spectrum one, and the connector between them is that same
 *               spectrum;
 *   by SHAPE  — one tile against two, so "one → many" is visible from across
 *               the room with the text unread.
 *
 * THE SHORTER SIDE CENTRES ON THE TALLER ONE
 * ------------------------------------------
 * The two sides of a row are rarely the same height: one raw take against two
 * finished cuts, a checklist card against a pair of videos. Top-aligned, the
 * shorter side left a block of empty black under it and the connector floated
 * at an arbitrary height. So each column is vertically centred in the row and
 * the connector sits on the row's midline: whichever side is shorter sits
 * level with the other instead of hanging off the top.
 *
 * WHY THE LEFT COLUMN IS OPTIONAL
 * -------------------------------
 * Not every set comes with its raw footage. Rather than invent a "before" —
 * or quietly imply one by drawing an empty frame — a set without a source
 * renders `sourceFallback` in that column and the connector goes away with it.
 * The row then makes a smaller claim, which is the only honest thing it can do.
 */

import type { ReactNode } from "react";

import { Reveal } from "@olum-video/ui";

import { ShowcaseVideo, type Clip } from "./ShowcaseVideo";

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

export function ProofRow({
  source,
  // Unused when there is no source, so they carry defaults rather than making
  // every sourceless call site pass three empty strings.
  sourceTitle = "",
  sourceNote = "",
  sourceAside,
  sourceFallback,
  connector = "",
  outputs,
  outputTitle,
  outputNote,
  loud,
  onActivate,
}: {
  /** The raw footage, or null when there is none to show. */
  source: Clip | null;
  sourceTitle?: string;
  sourceNote?: string;
  /** Sits under the source tile — facts, usually. */
  sourceAside?: ReactNode;
  /** Fills the left column when `source` is null. */
  sourceFallback?: ReactNode;
  /** The word on the connector. Hidden along with it when there is no source. */
  connector?: string;
  outputs: Clip[];
  outputTitle: string;
  outputNote: string;
  /** Id of the clip currently playing with sound, site-wide. */
  loud: string | null;
  onActivate: (id: string) => void;
}) {
  // A 16:9 take and a 9:16 one cannot share a width. Held narrow either way:
  // the column is wide enough to stretch a vertical clip to nearly 800px tall,
  // which would tower over the pair beside it and break the "one became two"
  // reading the whole row is built on.
  const sourceWidth = source && source.width > source.height ? "max-w-[420px]" : "max-w-[300px]";

  return (
    <div className="grid gap-10 lg:grid-cols-[0.82fr_auto_1.18fr] lg:items-center lg:gap-10">
      <Reveal delay={80}>
        {source ? (
          <>
            <ColumnLabel index="01" title={sourceTitle} note={sourceNote} />
            <div className={`mx-auto lg:mx-0 ${sourceWidth}`}>
              <ShowcaseVideo clip={source} active={loud === source.id} onActivate={onActivate} />
            </div>
            {sourceAside}
          </>
        ) : (
          sourceFallback
        )}
      </Reveal>

      {/* The connector, pointing whichever way the grid runs.

          Below `lg` the columns stack, so it is a VERTICAL rule; from `lg` up
          they sit in a row, so it turns HORIZONTAL. Getting this the wrong way
          round is not cosmetic — an arrow across a column break tells the
          reader two things are side by side when they are one above the
          other. */}
      {source ? (
        <Reveal delay={200}>
          <div
            aria-hidden
            className="flex flex-col items-center justify-center gap-3 lg:flex-row"
          >
            <span className="h-12 w-px bg-spectrum-v lg:h-px lg:w-10 lg:bg-spectrum" />
            <span className="whitespace-nowrap rounded-full border border-paper/25 bg-panel/60 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/90 backdrop-blur-md">
              {connector}
            </span>
            <span className="h-12 w-px bg-spectrum-v lg:h-px lg:w-10 lg:bg-spectrum" />
          </div>
        </Reveal>
      ) : (
        // Holds the middle column open at the width a connector would take.
        // An empty `w-10` spacer let the output column grow by a hundred
        // pixels, so the tiles in a sourceless row came out visibly larger
        // than the tiles in the rows above — on a page whose argument is that
        // the same pass happens to all of them.
        <span aria-hidden className="hidden lg:block lg:w-[200px]" />
      )}

      <Reveal delay={140}>
        <ColumnLabel index="02" title={outputTitle} note={outputNote} spectrum />
        <div className="mx-auto grid max-w-[560px] grid-cols-2 gap-4 sm:gap-5 lg:mx-0 lg:max-w-none">
          {outputs.map((clip) => (
            <ShowcaseVideo
              key={clip.id}
              clip={clip}
              active={loud === clip.id}
              onActivate={onActivate}
            />
          ))}
        </div>
      </Reveal>
    </div>
  );
}

/**
 * The three facts under a source tile.
 *
 * They balance the column — a short tile leaves a lot of black under it — and
 * they carry their weight: "no retakes" and "one phone" are the two objections
 * a raw take is there to answer.
 */
export function SourceFacts({ facts, wide }: { facts: [string, string][]; wide?: boolean }) {
  return (
    <dl
      className={`mx-auto mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-paper/12 bg-paper/12 lg:mx-0 ${
        wide ? "max-w-[420px]" : "max-w-[300px]"
      }`}
    >
      {facts.map(([term, value]) => (
        // px-3.5, not px-4: beside a vertical take the strip is 300px wide,
        // and at px-4 "One phone" broke across two lines in a 100px cell.
        <div key={term} className="bg-panel px-3.5 py-4">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">
            {term}
          </dt>
          <dd className="mt-1.5 whitespace-nowrap font-display text-[15px] tracking-tight text-paper">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
