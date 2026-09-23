import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { api, type Video } from "@olum-video/api-client";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingRows,
  duration,
  presentStatus,
  relativeTime,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/**
 * Cap on the stagger, in rows.
 *
 * Without it a client with forty videos waits three seconds for the last row
 * to appear. Past the sixth the entrance has done its job, so everything after
 * that shares the sixth row's delay and lands together.
 */
const STAGGER_LIMIT = 6;
const STAGGER_STEP_MS = 45;

export default function VideoList() {
  const { data, error, loading, retry } = useAsync(() => api.listVideos());

  if (loading) return <LoadingRows rows={4} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data?.length) {
    return (
      <EmptyState
        heading="No videos yet"
        body="Send us a prompt and we'll write the script, or upload one you've already written."
        action={
          <Link to="/new">
            <Button>Create your first video</Button>
          </Link>
        }
      />
    );
  }

  const waiting = data.filter((video) => video.status === "client_review").length;

  return (
    <div>
      {/* A count of what is actually waiting on you, above the list. On a long
          list the one row that needs an action is otherwise just another row. */}
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-2xl">Your videos</h1>
        {waiting > 0 && (
          <p className="flex items-center gap-2 font-mono text-xs text-accent-ink">
            <span aria-hidden className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            {waiting === 1 ? "1 video needs you" : `${waiting} videos need you`}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {data.map((video, i) => (
          <VideoRow key={video.id} video={video} index={i} />
        ))}
      </div>
    </div>
  );
}

function VideoRow({ video, index }: { video: Video; index: number }) {
  const status = presentStatus(video.status, "client");
  const latest = video.versions[0];
  const needsYou = video.status === "client_review";

  return (
    <Link
      to={`/videos/${video.id}`}
      // `group` is what lets the arrow react to a hover anywhere on the row
      // rather than only when the pointer is over the arrow itself.
      className="row-enter group block"
      style={
        {
          "--row-delay": `${Math.min(index, STAGGER_LIMIT) * STAGGER_STEP_MS}ms`,
        } as CSSProperties
      }
    >
      <Card
        className={`row-lift hover:border-accent/50 ${needsYou ? "border-accent/40" : ""}`}
      >
        {/* Stacks on phones and sits side-by-side from `sm` up. Side-by-side at
            375px squeezed the title into an ellipsis and wrapped the metadata
            around a floating badge — three ragged lines for one short sentence. */}
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {/* Two lines on mobile, one from `sm` up: a title worth reading is
                worth wrapping for, but it must not push the row's height around
                on wide screens. */}
            <p className="line-clamp-2 text-sm text-ink sm:truncate">{video.title}</p>
            <p className="mt-1 font-mono text-xs text-muted">
              Updated {relativeTime(video.updated_at)}
              {latest && ` · ${duration(latest.duration_ms)}`}
              {video.regens_used > 0 &&
                ` · ${video.regens_used} of ${video.regen_limit} revisions used`}
            </p>
          </div>
          {/* self-start keeps the pill hugging the left edge when stacked,
              instead of stretching to the full row width. */}
          <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
            <Badge tone={status.tone}>{status.label}</Badge>
            {/* Nudges right on hover to signal the row is a link. `aria-hidden`
                because "arrow" read aloud after the status adds nothing. */}
            <span
              aria-hidden
              className="hidden text-muted transition-transform duration-300 group-hover:translate-x-1 sm:inline"
            >
              →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
