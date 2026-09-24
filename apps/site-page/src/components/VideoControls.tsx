/**
 * The control bar for a showcase tile, shown once the tile is playing with
 * sound.
 *
 * WHY NOT `<video controls>`
 * -------------------------
 * The native control bar is the most recognisable "we did not design this"
 * element on the web — a grey gradient strip in a system font, identical on a
 * bank's site and on a blog. Everything around it here is undone the moment it
 * appears.
 *
 * The cost of replacing it is that accessibility becomes ours rather than the
 * browser's, so this keeps the same contract the native control has:
 *
 *   Space / K   play-pause      ← →   seek 5s      M   mute      F   fullscreen
 *
 * Every control is a real `<button>` with a label; the scrubber is a real
 * `<input type="range">` with its paint stripped, so drag, arrow-key stepping,
 * touch and the accessibility tree all still come from the platform.
 *
 * Keyboard handling is bound to the OWNING ELEMENT, not the document — there
 * are three of these on the page at once and document-level shortcuts would
 * have all three responding to one key press.
 *
 * IT GETS OUT OF THE WAY WHILE YOU WATCH
 * --------------------------------------
 * These clips carry burned-in captions, and a bar parked over the bottom of
 * the frame for the whole playback covers them. So while the video plays, the
 * bar shows only when the pointer is over the tile or focus is inside it —
 * the way every video player behaves. Paused, it stays up. On a touch screen
 * (no hover) it also stays up, because there is no pointer to summon it with.
 */

import { useEffect, useState } from "react";
import type { RefObject } from "react";

/** Seconds a left/right arrow moves the playhead. */
const SEEK_STEP = 5;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function VideoControls({
  videoRef,
  hostRef,
  visible,
}: {
  videoRef: RefObject<HTMLVideoElement>;
  /** The element that goes fullscreen, and that keyboard shortcuts are scoped to. */
  hostRef: RefObject<HTMLElement>;
  visible: boolean;
}) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => {
      setPlaying(!video.paused);
      setMuted(video.muted);
      setDuration(video.duration || 0);
    };
    const onTime = () => setTime(video.currentTime);
    const onProgress = () => {
      // `buffered` can hold several disjoint ranges after a seek; the one that
      // matters for the bar is whichever contains the playhead.
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime) setBuffered(video.buffered.end(i));
      }
    };

    sync();
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("durationchange", sync);
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("volumechange", sync);
    video.addEventListener("progress", onProgress);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("durationchange", sync);
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("volumechange", sync);
      video.removeEventListener("progress", onProgress);
    };
  }, [videoRef]);

  /**
   * Shortcuts, scoped to the tile.
   *
   * Bound to the host element rather than the document because the page holds
   * three players. A document listener would make Space toggle all of them, and
   * whichever happened to be last in the DOM would win the argument.
   */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !visible) return;

    const onKey = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      // Let the range input keep its own arrow keys.
      if (document.activeElement instanceof HTMLInputElement) return;

      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          if (video.paused) void video.play().catch(() => undefined);
          else video.pause();
          break;
        case "ArrowRight":
          event.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + SEEK_STEP);
          break;
        case "ArrowLeft":
          event.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - SEEK_STEP);
          break;
        case "m":
          video.muted = !video.muted;
          break;
        case "f":
          if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
          else void host.requestFullscreen().catch(() => undefined);
          break;
        default:
          break;
      }
    };

    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [hostRef, videoRef, visible]);

  const progress = duration > 0 ? (time / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 rounded-b-card bg-gradient-to-t from-panel via-panel/85 to-transparent px-3.5 pb-3.5 pt-10 transition-all duration-500 ease-luxe sm:px-4 sm:pb-4 ${
        !visible
          ? "pointer-events-none translate-y-3 opacity-0"
          : playing
            ? "translate-y-0 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:opacity-100 group-focus-within/tile:opacity-100"
            : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative flex h-4 items-center">
        <span
          aria-hidden
          className="absolute inset-x-0 h-[3px] rounded-full bg-paper/20"
          style={{ top: "calc(50% - 1.5px)" }}
        />
        <span
          aria-hidden
          className="absolute h-[3px] rounded-full bg-paper/30"
          style={{ width: `${bufferedPct}%`, top: "calc(50% - 1.5px)" }}
        />
        <span
          aria-hidden
          className="absolute h-[3px] rounded-full bg-spectrum"
          style={{ width: `${progress}%`, top: "calc(50% - 1.5px)" }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={time}
          onChange={(event) => {
            const video = videoRef.current;
            if (video) video.currentTime = Number(event.target.value);
          }}
          className="scrub relative z-10 w-full"
          aria-label="Seek"
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <ControlButton
          label={playing ? "Pause" : "Play"}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) void video.play().catch(() => undefined);
            else video.pause();
          }}
        >
          {playing ? (
            <svg width="10" height="11" viewBox="0 0 11 12" aria-hidden>
              <rect x="0" y="0" width="3.4" height="12" rx="1.1" fill="currentColor" />
              <rect x="7.1" y="0" width="3.4" height="12" rx="1.1" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="11" viewBox="0 0 10 12" aria-hidden>
              <path
                d="M0 0.8v10.4a.8.8 0 0 0 1.2.7l9-5.2a.8.8 0 0 0 0-1.4l-9-5.2A.8.8 0 0 0 0 .8Z"
                fill="currentColor"
              />
            </svg>
          )}
        </ControlButton>

        <p className="font-mono text-[10px] tabular-nums tracking-wider text-paper/85">
          {formatTime(time)}
          <span className="text-paper/55"> / {formatTime(duration)}</span>
        </p>

        <span className="flex-1" />

        <ControlButton
          label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            const video = videoRef.current;
            if (video) video.muted = !video.muted;
          }}
        >
          <svg width="13" height="11" viewBox="0 0 14 12" aria-hidden>
            <path d="M0 4h2.6L6 1v10L2.6 8H0z" fill="currentColor" />
            {muted ? (
              <path
                d="M8.6 4l3.4 4M12 4L8.6 8"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M8.6 3.6a3.4 3.4 0 0 1 0 4.8M10.6 1.9a6 6 0 0 1 0 8.2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </svg>
        </ControlButton>

        <ControlButton
          label="Full screen"
          onClick={() => {
            const host = hostRef.current;
            if (!host) return;
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
            else void host.requestFullscreen().catch(() => undefined);
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden fill="none">
            <path
              d="M0.8 4.2V0.8h3.4M11.2 4.2V0.8H7.8M0.8 7.8v3.4h3.4M11.2 7.8v3.4H7.8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ControlButton>
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-paper/85 transition-all duration-300 ease-luxe hover:bg-paper/15 hover:text-paper"
    >
      {children}
    </button>
  );
}
