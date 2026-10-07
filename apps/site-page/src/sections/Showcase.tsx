/**
 * The proof.
 *
 * A raw phone take on the left, two finished videos from the same setup on the
 * right. No mockups, no stock footage, no "imagine if".
 *
 * WHY HER, NOT HIM
 * ----------------
 * The hero at the top of this page already shows his recording and the two
 * videos his twin generated. This panel used to show the SAME three clips
 * again, so a visitor scrolling down met identical footage twice. It now
 * leads with the second creator — a different face and the other half of
 * the product: what the edit does to a raw take. His two generated videos
 * are still here, in the strip underneath.
 *
 * Her set makes a smaller claim than his, on purpose: her two videos were cut
 * from the same setup, not generated from this exact take, so the copy says
 * "raw take" and "after the edit", never "this became that" (see clips.ts).
 * And she is never named: the names in the dev database are made up, and
 * she is a real person.
 *
 * The comparison itself lives in `ProofRow`, because /results makes it three
 * times over. This section owns the panel, the copy and the one thing the home
 * page needs that the deeper page does not: a way out to the rest of the work.
 *
 * WHY IT IS THE ONE DARK SURFACE ON THE PAGE
 * -------------------------------------------
 * A warm paper page with video tiles dropped into it makes the video look like
 * an illustration. Sunk into near-black, the same tiles read as a screen — the
 * frame stops competing with the footage and the eye goes to the faces. Used
 * exactly once per page; a second dark panel would cost this one its authority.
 */

import { Reveal, RevealLines } from "@olum-video/ui";

import { Cta } from "../components/Cta";
import { Magnetic } from "../components/Magnetic";
import { ParticleField } from "../motion/ParticleField";
import { ProofPanel } from "../components/ProofPanel";
import { ProofRow, SourceFacts } from "../components/ProofRow";
import { ShowcaseVideo } from "../components/ShowcaseVideo";
import { DESK_OUTPUTS, ROOFTOP_OUTPUTS, ROOFTOP_SOURCE, SOFA_OUTPUTS } from "../components/clips";
import { useLoudClip } from "../components/useLoudClip";

export function Showcase() {
  const [loud, activate] = useLoudClip();

  return (
    <section
      className="px-4 pb-24 pt-4 sm:px-6 lg:pb-32"
      aria-label="A raw take, and the videos that went out"
    >
      <ProofPanel>
        <ParticleField tone="dark" className="absolute inset-0" />

        <div className="relative">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-paper/20 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/85">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-spectrum" />
              Real output, not a mockup
            </p>
            <RevealLines
              as="h2"
              className="mt-6 font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] tracking-tight text-paper"
              lines={["She filmed it on a phone.", "This is what went out."]}
            />
            <Reveal delay={140}>
              <p className="mt-6 max-w-readable text-[15px] leading-relaxed text-paper/75">
                On the left, one of her takes exactly as the phone recorded it — no captions, no
                cuts. On the right, two videos from the same setup after our editors got to them:
                the hook, the captions, the b-roll. Press any of them to turn the sound on.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 lg:mt-20">
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
              outputAside={
                <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Cta to="/get-started" look="light" small arrow>
                    Get videos like these
                  </Cta>
                  <span className="font-mono text-[10.5px] text-paper/65">
                    From one phone recording.
                  </span>
                </div>
              }
              loud={loud}
              onActivate={activate}
            />
          </div>

          {/* ── Four more finished videos ────────────────────────────────

              Inside this panel rather than in a section of their own, which
              would mean a second dark surface on the home page and cost this
              one the authority the whole design rests on.

              Four more <video> elements on a page that already had six. They
              are safe because every tile is `preload="none"` and only calls
              play() once it is on screen — this strip sits two screens below
              the fold, so a visitor who never reaches it never loads it. */}
          <Reveal delay={240}>
            <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-5 lg:mt-20 lg:grid-cols-4">
              {[...SOFA_OUTPUTS, ...DESK_OUTPUTS].map((clip) => (
                <ShowcaseVideo
                  key={clip.id}
                  clip={clip}
                  active={loud === clip.id}
                  onActivate={activate}
                />
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-paper/12 pt-10">
              <h3 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1] tracking-tight text-paper">
                Four more finished videos.
                <br />
                <span className="text-paper/65">Yours could be next.</span>
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic>
                  <Cta to="/get-started" look="light" arrow>
                    Make my AI avatar
                  </Cta>
                </Magnetic>
                <Cta to="/results" look="outline-light">
                  See raw beside finished
                </Cta>
              </div>
            </div>
          </Reveal>
        </div>
      </ProofPanel>
    </section>
  );
}
