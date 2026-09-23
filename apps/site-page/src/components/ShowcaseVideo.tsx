/**
 * A showcase tile: a video that loops silently until you press it, then plays
 * with sound in place.
 *
 * NO LIGHTBOX. Clicking used to open a modal over the page, which is the
 * standard pattern and the wrong one here. The panel's whole argument is the
 * comparison — one recording on the left, two videos made from it on the right
 * — and a modal covers the comparison with one of its three terms. Playing in
 * place keeps all three on screen, so you can hear one and still see what it
 * came from.
 *
 * Only one tile may be loud at a time; the parent owns that, because a tile
 * cannot know about its siblings.
 *
 * THREE RULES IT FOLLOWS, IN ORDER OF HOW OFTEN THEY GET BROKEN
 * -------------------------------------------------------------
 * 1. It only plays while on screen. An IntersectionObserver starts and pauses
 *    it, so a visitor reading the footer is not decoding three video streams
 *    they cannot see. On a phone that is the difference between a warm battery
 *    and a hot one.
 *
 * 2. It never plays on its own if motion is reduced. Autoplaying video is
 *    exactly what `prefers-reduced-motion` is asking us not to do; those
 *    visitors get the poster and a play button, which still works perfectly.
 *
 * 3. Sound is never a surprise. It is muted until a real click, which is also
 *    the only way a browser would permit audio.
 *
 * THE ASPECT RATIO COMES FROM THE FILE, NOT FROM A GUESS
 * ------------------------------------------------------
 * The source clip was shot vertically on a phone. Its stream probes as
 * 1920x1080, because the rotation lives in a metadata flag rather than in the
 * pixels, so it was labelled landscape and dropped into a 16:9 frame — where
 * `object-cover` cropped the top of the man's head clean off. Every clip now
 * carries its real encoded `width` and `height` and the frame is built from
 * those, so the box always matches the footage and nothing can be cropped.
 */

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@olum-video/ui";

import { VideoControls } from "./VideoControls";

export type ClipKind = "source" | "generated";

export type Clip = {
  id: string;
  src: string;
  poster: string;
  /** Short label shown on the tile. */
  label: string;
  /** One line of context above the label. */
  caption: string;
  /** Runtime, already formatted — shown as a chip. */
  duration: string;
  /** Spoken description for anyone who cannot see the tile. */
  alt: string;
  /** The ENCODED dimensions. Read from the file, never assumed. */
  width: number;
  height: number;
  kind: ClipKind;
};

export function ShowcaseVideo({
  clip,
  active,
  onActivate,
  className = "",
}: {
  clip: Clip;
  /** True when this is the tile playing with sound. */
  active: boolean;
  onActivate: (id: string) => void;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Muted unless this tile is the active one. Set imperatively rather than as
    // a prop: React treats `muted` as an initial attribute and will not update
    // the live element, which is a long-standing and very confusing gap.
    video.muted = !active;
    // React writes `muted` as a property only. iOS Safari checks the attribute
    // before allowing inline autoplay, so it has to be kept in step by hand.
    if (active) video.removeAttribute("muted");
    else video.setAttribute("muted", "");
    // The source loops as wallpaper; a tile you are actually listening to
    // should stop at the end rather than start over.
    video.loop = !active;

    if (!onScreen || (reduced && !active)) {
      video.pause();
      return;
    }

    // `play()` rejects for reasons outside our control — a data saver setting,
    // an OS policy. The poster staying up is a fine outcome; an unhandled
    // rejection in the console is not.
    void video.play().catch(() => undefined);
  }, [active, onScreen, reduced]);

  // Scroll an activated tile fully into view. A tile half off the bottom of the
  // window is a tile whose controls you cannot reach.
  useEffect(() => {
    if (!active) return;
    hostRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  const generated = clip.kind === "generated";

  return (
    // The spectrum ring is a 1px gradient BORDER, built as a padded wrapper
    // rather than `border-image` — border-image cannot follow a border-radius,
    // so a gradient border on a rounded card leaves square corners.
    <div
      ref={hostRef}
      tabIndex={-1}
      className={`group/tile relative outline-none transition-transform duration-[650ms] ease-luxe ${
        active ? "-translate-y-1" : "hover:-translate-y-1"
      } ${className}`}
    >
      {/* The gradient ring wraps the VIDEO ONLY.

          The caption used to live inside this wrapper, which meant its
          background was the spectrum itself — paper text on a bright gradient,
          measuring 2.4:1. Pulling the ring in around the frame puts the words
          back on the near-black panel where they belong, and the ring still
          does its job of marking which clips were generated. */}
      <div className={`rounded-[21px] p-px ${generated ? "bg-spectrum" : "bg-paper/20"}`}>
        <div
          className={`relative overflow-hidden rounded-card bg-panel transition-shadow duration-[650ms] ease-luxe ${
            active
              ? "shadow-[0_40px_90px_-40px_rgb(0,0,0,1)]"
              : "shadow-[0_30px_70px_-42px_rgb(0,0,0,0.95)]"
          }`}
          // The frame is built from the file's own dimensions, so the box can
          // never disagree with the footage.
          style={{ aspectRatio: `${clip.width} / ${clip.height}` }}
        >
          <video
            ref={videoRef}
            src={clip.src}
            poster={clip.poster}
            muted
            loop
            playsInline
            // `preload="none"`, NOT "metadata".
            //
            // The page carries six <video> elements — the hero fan and the showcase
            // tiles, the same three files twice — and the browser caps how many it
            // will load at once. With `preload="metadata"` three of the six sat at
            // `readyState 0, networkState LOADING` forever and simply never played.
            //
            // With "none" nothing is fetched until `play()` is called, and play() only
            // happens on intersection. The hero and the showcase are a screen apart,
            // so only the set you are actually looking at is ever loading. The poster
            // covers the gap.
            preload="none"
            aria-label={clip.alt}
            className={`h-full w-full object-cover transition-transform duration-[900ms] ease-luxe ${
              active ? "" : "group-hover/tile:scale-[1.04]"
            }`}
          />

          {/* The whole picture is the button. A separate overlay control would
            mean the obvious thing to click does nothing. */}
          <button
            type="button"
            onClick={() => onActivate(clip.id)}
            aria-label={
              active ? `${clip.label}, playing with sound` : `Play ${clip.label} with sound`
            }
            aria-pressed={active}
            // Sits under the control bar (z-20) so the bar's own buttons win.
            className="absolute inset-0 z-10 cursor-pointer"
          />

          {/* The ONE thing still allowed over the footage.

            Everything textual — the caption, the title, the runtime — moved out
            below the frame. These clips carry their own burned-in captions
            along the bottom third, so a label parked there was not merely
            covering "some video", it was covering the words the video is
            made of.

            This badge survives because it is an affordance rather than
            information: it says the picture is pressable, it is centred where
            no caption ever is, and it disappears the moment the tile plays. */}
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-luxe ${
              active ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="flex items-center gap-2 rounded-full bg-paper/95 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-ink shadow-[0_12px_34px_-10px_rgb(0,0,0,0.8)] transition-transform duration-500 ease-luxe group-hover/tile:scale-105">
              <PlayGlyph />
              Sound
            </span>
          </span>

          <VideoControls videoRef={videoRef} hostRef={hostRef} visible={active} />
        </div>
      </div>

      {/* Caption and title, below the frame rather than on it. */}
      <div className="px-1 pb-0.5 pt-3">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              generated ? "bg-spectrum" : "bg-paper/45"
            }`}
          />
          {clip.caption}
          <span className="ml-auto shrink-0 normal-case tracking-normal text-paper/60">
            {clip.duration}
          </span>
        </p>
        <p className="mt-1.5 font-display text-[15px] leading-snug tracking-tight text-paper sm:text-base">
          {clip.label}
        </p>
      </div>
    </div>
  );
}

export function PlayGlyph({ size = 9 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 12" aria-hidden className="shrink-0">
      <path
        d="M0 0.8v10.4a.8.8 0 0 0 1.2.7l9-5.2a.8.8 0 0 0 0-1.4l-9-5.2A.8.8 0 0 0 0 .8Z"
        fill="currentColor"
      />
    </svg>
  );
}
