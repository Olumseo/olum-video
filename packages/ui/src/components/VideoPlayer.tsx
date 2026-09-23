import { useRef, useState } from "react";

/**
 * Video player for a rendered cut.
 *
 * `src` may be null while a video is still in production, so the placeholder is
 * a first-class state rather than a broken <video> element.
 */
export function VideoPlayer({
  src,
  poster,
  label,
}: {
  src: string | null;
  poster?: string;
  label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-t-lg bg-cream">
        <p className="px-6 text-center text-sm text-muted">
          Nothing to watch yet — we're still producing this one.
        </p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-t-lg bg-cream">
        <p className="px-6 text-center text-sm text-muted">
          This video didn't load. It may still be uploading.
        </p>
        <button
          onClick={() => {
            setFailed(false);
            ref.current?.load();
          }}
          className="text-xs text-accent-ink underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      // `controls` rather than a custom control bar: the native controls are
      // keyboard accessible, screen-reader labelled, and support picture-in-
      // picture and captions for free. A bespoke bar would have to re-earn all
      // of that.
      controls
      // "metadata" fetches only duration and dimensions on load. "auto" would
      // pull whole videos for every item a user merely scrolls past.
      preload="metadata"
      playsInline
      poster={poster}
      aria-label={label ?? "Video preview"}
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-t-lg bg-ink"
    >
      <source src={src} />
      Your browser can't play this video.
    </video>
  );
}
