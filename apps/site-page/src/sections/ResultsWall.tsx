/**
 * The wall: three people's work, raw beside finished, in one dark panel.
 *
 * WHY ONE PANEL AND NOT THREE
 * ---------------------------
 * Three separate dark blocks down a warm page reads as three unrelated
 * products. One panel with hairlines between the sets reads as one body of
 * work, which is the claim — and it keeps the site's rule that there is
 * exactly one dark surface per page.
 *
 * WHAT EACH SET IS ALLOWED TO SAY
 * -------------------------------
 * The three sets do not make the same claim, and the copy does not pretend
 * they do:
 *
 *   01 · the sofa recording IS the consent take its two videos were generated
 *        from, so this one says "generates" and says "twin".
 *   02 · the rooftop take is a raw recording by the person whose finished
 *        videos sit beside it — but not the literal take those two were cut
 *        from. So it says "before / after" about the KIND of thing, never
 *        "this became that".
 *   03 · no raw footage in hand, so it claims none. The left column carries
 *        the editor's checklist instead of an invented "before", which is the
 *        one thing that column could honestly hold.
 *
 * The temptation to round all three up to the same tidy sentence is exactly
 * the failure mode this panel exists to avoid.
 */

import { Reveal, RevealLines } from "@olum-video/ui";

import { ParticleField } from "../motion/ParticleField";
import { ProofPanel } from "../components/ProofPanel";
import { ProofRow, SourceFacts } from "../components/ProofRow";
import {
  DESK_OUTPUTS,
  ROOFTOP_OUTPUTS,
  ROOFTOP_SOURCE,
  SOFA_OUTPUTS,
  SOFA_SOURCE,
} from "../components/clips";
import { useLoudClip } from "../components/useLoudClip";

/** What the editor did to every clip on the right-hand side. */
const EDITOR_PASS = [
  "Take trimmed to the hook",
  "Captions timed to the words",
  "B-roll cut in on the beat",
  "Audio levelled end to end",
  "Watched once more before it left",
];

/**
 * The left column of set 03.
 *
 * There is no raw footage for this one, and drawing an empty frame — or worse,
 * borrowing somebody else's take — would be inventing the one thing this panel
 * promises it has not invented. The editor's pass is true of every clip on the
 * page, so it is the honest thing to put here.
 */
function EditorPass() {
  return (
    <div className="mx-auto max-w-[420px] rounded-card border border-paper/12 bg-paper/[0.04] p-6 lg:mx-0">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper/90">
        The pass, every time
      </p>
      <p className="mt-2 text-[13px] leading-snug text-paper/70">
        The same five things happen to every video on this page.
      </p>
      <ul className="mt-6 space-y-3.5">
        {EDITOR_PASS.map((step) => (
          <li key={step} className="flex items-start gap-3 text-[13.5px] leading-snug text-paper/85">
            <span
              aria-hidden
              className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-spectrum text-panel"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1.5 5.2 3.9 7.6 8.5 2.6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The hairline and title that separate one person's set from the next. */
function SetHeading({ index, title, note }: { index: string; title: string; note: string }) {
  return (
    <Reveal>
      {/* The note goes UNDER the title, never beside it. Set beside, it
          wrapped into a ragged second column whose left edge lined up with
          nothing, and the eye read it as a stray caption rather than as this
          set's explanation. */}
      <div className="mb-10 flex items-baseline gap-4">
        <span className="shrink-0 font-mono text-[11px] tracking-[0.2em] text-spectrum">
          {index}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[clamp(1.15rem,2.4vw,1.6rem)] tracking-tight text-paper">
            {title}
          </h3>
          <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-paper/70">{note}</p>
        </div>
      </div>
    </Reveal>
  );
}

export function ResultsWall() {
  // One "which clip is loud" for the whole page. Two rows each keeping their
  // own would let two videos talk over each other from different screens.
  const [loud, activate] = useLoudClip();

  return (
    <section className="px-4 pb-24 sm:px-6 lg:pb-32" aria-label="Raw takes and finished videos">
      <ProofPanel>
        <ParticleField tone="dark" className="absolute inset-0" />

        <div className="relative">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-paper/20 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/85">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-spectrum" />
              Three people, six finished videos
            </p>
            <RevealLines
              as="h2"
              className="mt-6 font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] tracking-tight text-paper"
              lines={["This is the part", "you would have had", "to do yourself."]}
            />
            <Reveal delay={140}>
              <p className="mt-6 max-w-readable text-[15px] leading-relaxed text-paper/75">
                Writing the script. Finding the b-roll. Cutting to the beat. Timing every caption.
                Watching it back, then doing it again tomorrow. Every video on the right had all of
                that done to it by our team — not by the person in it.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 space-y-16 lg:mt-24 lg:space-y-24">
            {/* ── 01 ─ the twin set ─────────────────────────────────────── */}
            <div>
              <SetHeading
                index="01"
                title="One recording, generated twice"
                note="His consent take on the left. Both videos beside it were generated from it — same face, same voice — then edited."
              />
              <ProofRow
                source={SOFA_SOURCE}
                sourceTitle="Recorded"
                sourceNote="Filmed once, with consent, on a phone."
                sourceAside={
                  <SourceFacts
                    facts={[
                      ["Length", "33 sec"],
                      ["Kit", "One phone"],
                      ["Retakes", "None"],
                    ]}
                  />
                }
                connector="generates"
                outputs={SOFA_OUTPUTS}
                outputTitle="Generated from it"
                outputNote="Two of the videos his twin has made since."
                loud={loud}
                onActivate={activate}
              />
            </div>

            {/* ── 02 ─ raw against finished ─────────────────────────────── */}
            <div className="border-t border-paper/10 pt-16 lg:pt-24">
              <SetHeading
                index="02"
                title="What a raw take looks like"
                note="On the left, one of her takes exactly as the phone recorded it. On the right, two videos from the same setup after the edit."
              />
              <ProofRow
                source={ROOFTOP_SOURCE}
                sourceTitle="Raw"
                sourceNote="One take, one phone, nothing added."
                sourceAside={
                  <SourceFacts
                    facts={[
                      ["Length", "39 sec"],
                      ["Captions", "None"],
                      ["Cuts", "None"],
                    ]}
                  />
                }
                connector="we edit"
                outputs={ROOFTOP_OUTPUTS}
                outputTitle="What went out"
                outputNote="Hook, captions, b-roll, cuts — then a person watched it."
                loud={loud}
                onActivate={activate}
              />
            </div>

            {/* ── 03 ─ finished work, no raw claimed ────────────────────── */}
            <div className="border-t border-paper/10 pt-16 lg:pt-24">
              <SetHeading
                index="03"
                title="Two more, finished"
                note="A different person, a different subject, the same pass over every frame."
              />
              <ProofRow
                source={null}
                sourceFallback={<EditorPass />}
                outputs={DESK_OUTPUTS}
                outputTitle="What went out"
                outputNote="Daily news, cut the same way."
                loud={loud}
                onActivate={activate}
              />
            </div>
          </div>
        </div>
      </ProofPanel>
    </section>
  );
}
