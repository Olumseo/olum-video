/**
 * The hero: what olum.video is, told as one cloud of particles changing its
 * mind four times.
 *
 * The section is four screens tall and its contents are `sticky`, so the
 * viewport holds still while you scroll through it. Scroll position picks the
 * stage; the stage picks the shape AND the paragraph, from a single source
 * (STAGES), so the picture and the words cannot drift apart.
 *
 * Pinning is done with `position: sticky` rather than by intercepting the
 * wheel. Sticky is the native scroll — Page Down, find-in-page, a screen
 * reader moving the caret and a trackpad fling all behave exactly as they do
 * everywhere else on the web, and the section costs nothing on the scroll
 * thread. A scroll-jacking library would look identical and break all four.
 */

import { useEffect, useRef, useState } from "react";

import { ParticleField } from "../motion/ParticleField";
import { STAGES } from "../motion/shapes";
import { RevealLines, useReducedMotion, useScrollProgress } from "@olum-video/ui";

import { Magnetic } from "../components/Magnetic";
import { Link } from "react-router-dom";

/**
 * Deadband around a stage boundary, as a fraction of the section's scroll.
 *
 * Without it, resting the page exactly on a boundary lets sub-pixel scroll
 * jitter flip the stage back and forth, restarting the morph every few frames.
 */
const HYSTERESIS = 0.02;

/**
 * Point in the section's scroll where the pinned content starts fading out.
 *
 * Without it the hero and the section after it are both `position: sticky`, so
 * for one screen of scroll you see the tail of the hero above the head of the
 * next section — two pinned layouts sharing a viewport, which reads as a
 * rendering fault rather than a transition.
 */
const EXIT_START = 0.9;

const CTA_PRIMARY = "/get-started";
const CTA_SECONDARY = "/video/welcome/pricing";

export function Hero() {
  const reduced = useReducedMotion();
  return reduced ? <StaticHero /> : <PinnedHero />;
}

function PinnedHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef);

  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    let current = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const p = progress.current;

      // The rail is written straight to the DOM. Routing a value that changes
      // every frame through state would re-render the whole hero — including
      // the canvas element — sixty times a second.
      if (railRef.current) {
        railRef.current.style.transform = `scaleY(${Math.max(0.02, p)})`;
      }
      if (stageRef.current) {
        const exit = Math.min(1, Math.max(0, (p - EXIT_START) / (1 - EXIT_START)));
        stageRef.current.style.opacity = `${1 - exit}`;
      }

      const raw = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
      if (raw !== current) {
        const boundary = (raw > current ? raw : current) / STAGES.length;
        if (Math.abs(p - boundary) > HYSTERESIS) {
          current = raw;
          setStage(raw);
        }
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, progress]);

  /** Scrolls to the middle of a stage's slice — the rail ticks are buttons. */
  const goToStage = (index: number) => {
    const node = sectionRef.current;
    if (!node) return;
    const travel = node.offsetHeight - window.innerHeight;
    const top = node.offsetTop + travel * ((index + 0.5) / STAGES.length);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      // Four screens of travel, one per stage. Any less and a single flick of
      // a trackpad skips two stages; any more and reaching the next section
      // starts to feel like the page is broken.
      className="relative h-[400vh]"
      aria-label="How olum.video works"
    >
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0 lg:left-1/3" />

        <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 px-6 pb-10 pt-24 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-16 lg:pt-20">
          {/* Cloud first in the DOM on phones (order swaps below `lg`) so the
              thing that explains the product is the thing you see first on the
              screen where there is no room for both. */}
          <div className="relative order-first h-[34vh] min-h-0 shrink lg:order-last lg:h-[76vh]">
            <ParticleField
              shapes={STAGES.map((s) => s.draw)}
              hues={STAGES.map((s) => s.hue)}
              stage={stage}
              paused={!inView}
              className="absolute inset-0"
            />
          </div>

          <div className="relative flex min-h-0 flex-col justify-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              olum.video
            </p>

            <RevealLines
              as="h1"
              className="mt-4 font-serif text-[clamp(2.1rem,5.6vw,4.1rem)] leading-[1.04] tracking-tight"
              lines={[
                "Record yourself once.",
                <span className="text-accent-ink">Be on camera every day.</span>,
              ]}
            />

            {/* The stage copy. All four paragraphs are mounted and stacked, so
                the block's height is set by the tallest of them once — the
                layout below cannot jump as the text swaps. */}
            <div className="relative mt-8 min-h-[9.5rem] sm:min-h-[8rem]">
              {STAGES.map((item, i) => {
                // Stages already behind you leave upward and ones still ahead
                // wait below, so the block reads as one column of text moving
                // past a window — scrolling back up reverses it for free.
                const state = i === stage ? "in" : i < stage ? "out-up" : "out-down";
                return (
                  <div
                    key={item.key}
                    className="stage-copy absolute inset-x-0 top-0"
                    data-state={state}
                    // Hidden stages leave the accessibility tree: four
                    // paragraphs read back to back would be nonsense. They hold
                    // no focusable elements, so `aria-hidden` alone is enough —
                    // there is nothing here for the tab order to trip over.
                    aria-hidden={i !== stage}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-ink">
                      {item.index} — {item.title}
                    </p>
                    <p className="mt-3 max-w-readable text-[15px] leading-relaxed text-muted">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* Plain <a>, deliberately NOT a react-router <Link>.

                  The client app is a SEPARATE application at /video — its own
                  bundle, its own index.html. <Link> would look for the route
                  inside THIS app's table, find nothing, and render this app's
                  404. A real anchor makes the browser fetch the other app. */}
              <Magnetic>
                <Link
                  to={CTA_PRIMARY}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
                >
                  Open the app
                  <span aria-hidden>→</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <a
                  href={CTA_SECONDARY}
                  className="inline-flex items-center rounded-full border border-subtle px-6 py-3 text-sm transition-all duration-500 ease-luxe hover:border-ink/25 hover:bg-cream"
                >
                  See pricing
                </a>
              </Magnetic>
            </div>
          </div>
        </div>

        {/* Stage rail. Real buttons, so the sequence is reachable without a
            scroll wheel at all. */}
        <div className="pointer-events-none absolute inset-y-0 right-4 hidden items-center lg:flex">
          <div className="pointer-events-auto flex flex-col items-center gap-4">
            <span className="relative h-24 w-px bg-ink/10">
              <span
                ref={railRef}
                className="absolute inset-x-0 top-0 h-full origin-top bg-accent"
              />
            </span>
            {STAGES.map((item, i) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goToStage(i)}
                aria-current={i === stage}
                className={`font-mono text-[10px] tracking-widest transition-colors ${
                  i === stage ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {item.index}
                <span className="sr-only"> — {item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-cue pointer-events-none absolute bottom-6 left-1/2 hidden h-10 w-px -translate-x-1/2 lg:block" />
      </div>
    </section>
  );
}

/**
 * The reduced-motion hero.
 *
 * Not a stripped-down version of the animated one — a different, honest
 * layout. There is no pinning, no canvas and no scroll choreography, because
 * a four-screen-tall section whose content only changes via motion is exactly
 * the experience someone has asked the operating system not to give them. The
 * four steps are simply a list, which is what they always were underneath.
 */
function StaticHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-32" aria-label="How olum.video works">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">olum.video</p>
      <h1 className="mt-4 max-w-3xl font-serif text-[clamp(2.1rem,6vw,4.25rem)] leading-[1.03] tracking-tight">
        Record yourself once.
        <span className="block text-accent-ink">Be on camera daily.</span>
      </h1>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to={CTA_PRIMARY}
          className="rounded-full bg-ink px-6 py-3 text-sm text-paper transition-all duration-500 ease-luxe hover:bg-accent-2 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink-rgb)/0.55)]"
        >
          Open the app
        </Link>
        <a
          href={CTA_SECONDARY}
          className="rounded-full border border-subtle px-6 py-3 text-sm transition-all duration-500 ease-luxe hover:border-ink/25 hover:bg-cream"
        >
          See pricing
        </a>
      </div>

      <ol className="mt-14 grid gap-8 sm:grid-cols-2">
        {STAGES.map((item) => (
          <li key={item.key}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-ink">
              {item.index} — {item.title}
            </p>
            <p className="mt-3 max-w-readable text-[15px] leading-relaxed text-muted">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
