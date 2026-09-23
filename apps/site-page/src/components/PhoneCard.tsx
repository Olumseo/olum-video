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
 * DECORATIVE ON PURPOSE
 * ---------------------
 * The whole fan is `aria-hidden`. These are the same three clips the showcase
 * panel further down presents properly, with labels, controls and sound; a
 * screen reader meeting them twice would hear the same videos announced with
 * two different sets of words.
 */

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@olum-video/ui";

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
};

export function PhoneCard({ clip, className = "" }: { clip: PhoneClip; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);

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
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      aria-hidden
      className={`overflow-hidden rounded-[22px] border border-subtle bg-paper shadow-[0_30px_64px_-32px_rgb(var(--ink-rgb)/0.42)] ${className}`}
    >
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
      <p className="line-clamp-2 px-3 pb-2.5 pt-2 text-[12px] leading-snug text-ink sm:text-[12.5px]">
        {clip.caption}
      </p>

      {/* ── The video, with nothing over it ─────────────────────────────── */}
      <div
        className="relative mx-3 overflow-hidden rounded-[14px] bg-panel"
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
