/**
 * A card in the hero's fan: a finished social post, laid out the way a real
 * one is — caption above, video below, provenance underneath.
 *
 * NOTHING SITS ON THE FOOTAGE
 * ---------------------------
 * The first version put the caption in a bubble floating over the middle of
 * the video, which is what the reference design did. It looked right in a
 * still mockup and was wrong the moment the video moved: the bubble parks over
 * the speaker's face, which is the one thing these clips are for. A caption
 * over a photograph is a design choice; a caption over a talking head is a
 * blindfold.
 *
 * So the text moved out. The video now occupies a clean rounded frame with
 * nothing on top of it at all — not the caption, not the runtime, not a menu
 * glyph — and every word lives in the card around it. That is also how the
 * platforms themselves lay a post out, so it reads as more native, not less.
 *
 * REAL OR GENERATED, AT A GLANCE
 * ------------------------------
 * The hero's whole claim is "one of these was filmed, the other two were made
 * from it". When all three cards wore the same white frame and the same small
 * grey chip, a visitor could not tell which was which without reading 9px
 * type. So the difference is now the loudest thing on each card: a solid
 * band across the top — dark with a red REC dot for the real recording,
 * spectrum with a spark for the AI-generated ones — and a spectrum frame
 * around the generated two, the same mark the showcase uses for output.
 *
 * THE GENERATED CARDS PLAY IN FULL ON A CLICK
 * -------------------------------------------
 * Idle, a generated card repeats only its split-screen stretch (see
 * previewLoop.tsx). Hovering shows a "See full video" cursor; clicking plays
 * the whole video from 0:00 with sound, in place. A second click pauses, and
 * the end of the video puts the card back to its silent preview. The recorded
 * card does none of this — it is the one thing on the fan that is not output.
 *
 * DECORATIVE ON PURPOSE
 * ---------------------
 * The whole fan is `aria-hidden`. These are the same three clips the showcase
 * panel further down presents properly, with labels, controls and sound; a
 * screen reader meeting them twice would hear the same videos announced with
 * two different sets of words.
 */

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@olum-video/ui";

import { useCursorLabel, usePreviewLoop, type Segment } from "./previewLoop";

export type PhoneClip = {
  id: string;
  src: string;
  poster: string;
  /** The post's own text, above the video. */
  caption: string;
  /** Category chip, top-left. */
  label: string;
  /** Runtime, shown beside the chip. */
  duration: string;
  /** Where this clip came from — the line under the video. */
  origin: string;
  width: number;
  height: number;
  /** Filmed by a person, or made by their AI clone. Drives the band and frame. */
  kind: "recorded" | "generated";
  /** The split-screen stretch a generated card repeats while idle. */
  preview?: Segment;
};

export function PhoneCard({ clip, className = "" }: { clip: PhoneClip; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  // True while the visitor is watching this card in full, with sound.
  const [full, setFull] = useState(false);
  const generated = clip.kind === "generated";

  usePreviewLoop(videoRef, clip.preview, full);
  const cursor = useCursorLabel(generated && !full, "See full video");

  // In full: sound on, no looping. Back to preview: silent loop again.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !full;
    if (full) video.removeAttribute("muted");
    else video.setAttribute("muted", "");
    video.loop = !full;
    if (full) void video.play().catch(() => undefined);
    if (!full) return;
    // The end of the full video returns the card to its preview.
    const onEnded = () => setFull(false);
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [full]);

  function press() {
    const video = videoRef.current;
    if (!generated || !video) return;
    if (!full) {
      setFull(true);
      return;
    }
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    // React sets `muted` as a PROPERTY and never writes the attribute. Chrome
    // reads the property, so muted autoplay works there — iOS Safari checks the
    // ATTRIBUTE, and without it refuses to play inline and shows the poster
    // forever.
    video.muted = true;
    video.setAttribute("muted", "");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // `play()` rejects for reasons outside our control — a data saver,
          // an OS policy. The poster staying up is a fine outcome; an
          // unhandled rejection in the console is not.
          void video.play().then(
            () => setPlaying(true),
            () => setPlaying(false),
          );
        } else {
          video.pause();
          setPlaying(false);
          setFull(false);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    // The spectrum frame is a 2px padded wrapper, not a border: a gradient
    // border-image cannot follow a border-radius.
    <div
      aria-hidden
      className={`rounded-[24px] p-[2px] shadow-[0_30px_64px_-32px_rgb(var(--ink-rgb)/0.42)] ${
        generated ? "bg-spectrum" : "bg-ink/15"
      } ${className}`}
    >
    <div className="overflow-hidden rounded-[22px] bg-paper">
      {/* ── What this is: the loudest thing on the card ─────────────────── */}
      {generated ? (
        <p className="flex items-center justify-center gap-1.5 bg-spectrum px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-paper sm:text-[11px]">
          <SparkGlyph />
          AI-generated
        </p>
      ) : (
        <p className="flex items-center justify-center gap-2 bg-ink px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-paper sm:text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inset-0 rounded-full bg-flare" />
            <span className="relative h-2 w-2 rounded-full bg-flare" />
          </span>
          Real recording
        </p>
      )}

      {/* ── Post header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <span className="truncate rounded-full border border-subtle bg-cream/60 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-muted">
          {clip.label}
        </span>
        <span className="shrink-0 font-mono text-[9.5px] text-muted">{clip.duration}</span>
      </div>

      {/* ── The caption, as post text ───────────────────────────────────── */}
      {/* Clamped to two lines. The three cards sit in a fan aligned at the
          bottom, so a caption that runs to a third line makes its card taller
          and its neighbours look dropped rather than deliberately staggered. */}
      {/* The padding lives on a wrapper, not on the clamped <p>: line-clamp
          clips at the PADDING box, so bottom padding on the <p> itself let the
          top of a third line show through under the ellipsis. */}
      <div className="px-3 pb-2.5 pt-2">
        <p className="line-clamp-2 text-[12px] leading-snug text-ink sm:text-[12.5px]">
          {clip.caption}
        </p>
      </div>

      {/* ── The video, with nothing over it ─────────────────────────────── */}
      <div
        onClick={press}
        {...cursor.bind}
        className={`relative mx-3 overflow-hidden rounded-[14px] bg-panel ${
          generated ? (cursor.showing ? "cursor-none" : "cursor-pointer") : ""
        }`}
        // The frame is built from the file's own encoded dimensions, so the box
        // can never disagree with the footage and crop someone's head off.
        style={{ aspectRatio: `${clip.width} / ${clip.height}` }}
      >
        <video
          ref={videoRef}
          src={clip.src}
          poster={clip.poster}
          muted
          loop
          playsInline
          // `preload="none"`, NOT "metadata". The page carries six <video>
          // elements — this fan and the showcase tiles, the same three files
          // twice — and the browser caps how many it will load at once. With
          // "metadata" three of the six sat at `readyState 0 / LOADING` forever
          // and never played. With "none" nothing is fetched until `play()`,
          // which only happens on intersection.
          preload="none"
          className="h-full w-full object-cover"
        />

        {/* The one thing still allowed over the footage: a play badge, and only
            while nothing is playing. It marks the card as video rather than a
            still, and it is gone the instant it would be in the way. */}
        {cursor.label}

        {!playing && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-panel/25">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper/95 text-ink">
              <PlayGlyph size={13} />
            </span>
          </span>
        )}
      </div>

      {/* ── Provenance ──────────────────────────────────────────────────── */}
      <p className="flex items-center gap-1.5 px-3 py-2.5 font-mono text-[9.5px] text-muted">
        <BoltGlyph />
        <span className="truncate">{clip.origin}</span>
      </p>
    </div>
    </div>
  );
}

function SparkGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className="shrink-0">
      <path d="M6 0l1.4 4.6L12 6l-4.6 1.4L6 12 4.6 7.4 0 6l4.6-1.4z" fill="currentColor" />
    </svg>
  );
}

function PlayGlyph({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" aria-hidden className="shrink-0">
      <path
        d="M0 0.8v10.4a.8.8 0 0 0 1.2.7l9-5.2a.8.8 0 0 0 0-1.4l-9-5.2A.8.8 0 0 0 0 .8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BoltGlyph() {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden className="shrink-0">
      <path d="M4.6 0 0 5.6h2.6L3.4 10 8 4.4H5.4L4.6 0Z" fill="currentColor" />
    </svg>
  );
}
