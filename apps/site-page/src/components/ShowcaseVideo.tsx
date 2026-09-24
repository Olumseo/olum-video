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
 * CLICKING A PLAYING VIDEO PAUSES IT
 * ----------------------------------
 * The first click on the picture turns the sound on. After that the picture
 * behaves like every other video player: click to pause, click to resume.
 * It used to toggle the tile straight back to silent wallpaper instead, so a
 * visitor who clicked to pause twenty seconds in heard the sound cut out and
 * watched the clip carry on looping — which reads as the video breaking.
 * Silencing is the Sound button's job (or Escape), never the picture's.
 *
 * A pause you chose is kept. Scrolling the tile out of view and back used to
 * restart it, because "on screen" meant "play"; a paused tile now stays
 * paused until you resume it.
 *
 * NOTHING SITS ON THE FOOTAGE
 * ---------------------------
 * The "Sound" control lives UNDER the frame, beside the title. It used to be
 * a white pill in the dead centre of the picture, on the theory that centre
 * is where no caption ever is. That held for the first twin videos and broke
 * on the next ones: the creators' cuts are split-screen — b-roll above, the
 * person below — and their captions sit exactly on the centre seam. The pill
 * was covering the words the video is made of.
 *
 * Nor does the picture zoom on hover any more. A 4% scale-up crops every edge
 * of the frame, and on a tightly framed phone take the first thing it crops
 * is the top of someone's head.
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
import { useCursorLabel, usePreviewLoop, type Segment } from "./previewLoop";

/**
 * What a clip IS, which is a claim and not a style.
 *
 * `source` is footage somebody filmed. `generated` came out of a twin.
 * `edited` is a finished cut whose talking head we can only vouch for as that
 * person's own footage — a distinction the page's wording depends on, so it is
 * kept in the type rather than left to whoever writes the caption.
 *
 * Visually the last two are the same thing: output, ringed in spectrum.
 */
export type ClipKind = "source" | "generated" | "edited";

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
  /**
   * The split-screen stretch to repeat while idle, in seconds. Finished videos
   * only; see previewLoop.tsx. Without it the whole clip loops.
   */
  preview?: Segment;
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
  // True while the visitor has paused a tile they are listening to. Kept in
  // a ref, not state: it only has to be read by the effect below, and a
  // re-render on every pause would buy nothing.
  const heldRef = useRef(false);
  // The pause listener below is bound once, so it reads "on screen" through a
  // ref rather than a stale closure.
  const onScreenRef = useRef(onScreen);
  onScreenRef.current = onScreen;

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

    // Their pause, not ours: coming back on screen must not override it.
    if (active && heldRef.current) return;

    // `play()` rejects for reasons outside our control — a data saver setting,
    // an OS policy. The poster staying up is a fine outcome; an unhandled
    // rejection in the console is not.
    void video.play().catch(() => undefined);
  }, [active, onScreen, reduced]);

  // Scroll an activated tile fully into view. A tile half off the bottom of the
  // window is a tile whose controls you cannot reach. Also where a held pause
  // is forgotten: switching sound on or off starts the tile afresh.
  useEffect(() => {
    heldRef.current = false;
    if (!active) return;
    hostRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  // Keep `heldRef` true for any pause the visitor makes — from the picture,
  // the control bar or the keyboard — and false once they play again. A pause
  // WE make (the tile left the screen) happens only while it is off screen,
  // which is how the two are told apart.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPause = () => {
      if (!video.ended && video.muted === false && onScreenRef.current) heldRef.current = true;
    };
    const onPlay = () => {
      heldRef.current = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);
    return () => {
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, []);

  /** The picture: sound on first, then pause and resume like any player. */
  function pressPicture() {
    const video = videoRef.current;
    if (!active || !video) {
      onActivate(clip.id);
      return;
    }
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }

  // Anything that is not the raw footage wears the spectrum ring — that edge
  // means "this came out the other end", whether a model or an editor made it.
  const output = clip.kind !== "source";

  // Idle: repeat the split-screen stretch. Sound on: the full video from 0:00.
  usePreviewLoop(videoRef, clip.preview, active);
  // "See full video" follows the mouse over a finished video that is not yet
  // playing in full. Not on the raw take — there is no fuller version of it.
  const cursor = useCursorLabel(output && !active, "See full video");

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
      <div className={`rounded-[21px] p-px ${output ? "bg-spectrum" : "bg-paper/20"}`}>
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
            className="h-full w-full object-cover"
          />

          {/* The whole picture is still pressable — it is the obvious thing to
            click. But it is a pointer convenience only: hidden from assistive
            tech and out of the tab order, because the labelled Sound button
            under the frame and the control bar's play button cover the same
            ground for everyone else. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={pressPicture}
            {...cursor.bind}
            // Sits under the control bar (z-20) so the bar's own buttons win.
            className={`absolute inset-0 z-10 ${cursor.showing ? "cursor-none" : "cursor-pointer"}`}
          />

          {cursor.label}

          <VideoControls videoRef={videoRef} hostRef={hostRef} visible={active} />
        </div>
      </div>

      {/* Everything about the clip lives below the frame, never on it:
          what it is and the control to hear it, then its title and runtime. */}
      <div className="px-1 pb-0.5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                output ? "bg-spectrum" : "bg-paper/45"
              }`}
            />
            <span className="truncate">{clip.caption}</span>
          </p>
          <SoundButton
            active={active}
            label={clip.label}
            onClick={() => onActivate(clip.id)}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <p className="font-display text-[15px] leading-snug tracking-tight text-paper sm:text-base">
            {clip.label}
          </p>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-paper/60">
            {clip.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hear this one — or, pressed again, put it back to silent.
 *
 * A toggle, so it says which state it is in rather than which it will go to:
 * a filled pill with a play glyph while silent, an outlined one with moving
 * bars while it is the tile you are listening to. `aria-pressed` carries the
 * same fact to a screen reader.
 */
function SoundButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `${label}: sound on. Press to silence` : `Play ${label} with sound`}
      // Icon-only below `sm`. Two tiles side by side on a phone are ~150px
      // wide, and the word pushed "Edited" down to "Edit…" beside it.
      className={`relative z-10 flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors duration-300 ease-luxe focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper sm:px-3 ${
        active
          ? "text-paper ring-1 ring-inset ring-paper/40 hover:ring-paper/70"
          : "bg-paper text-ink hover:bg-paper/85"
      }`}
    >
      {active ? <SoundBars /> : <PlayGlyph />}
      <span className="hidden sm:inline">{active ? "On" : "Sound"}</span>
    </button>
  );
}

/** Three bars that move while sound is playing. Still under reduced motion. */
function SoundBars() {
  return (
    <span aria-hidden className="flex h-[9px] items-end gap-[2px]">
      {[0, 180, 360].map((delay) => (
        <span
          key={delay}
          className="sound-bar w-[2px] rounded-full bg-spectrum"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
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
