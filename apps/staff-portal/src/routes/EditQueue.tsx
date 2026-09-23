import { useState } from "react";
import { api, type Video } from "@olum-video/api-client";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingRows,
  presentStatus,
  relativeTime,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";
import { UploadVersion } from "./UploadVersion";

// Which statuses mean "a human still has work to do here".
//
// This list is the manual workflow made visible: today an employee downloads
// the input, produces the video in HeyGen's web UI, and uploads the result.
// When the HeyGen API takes over, gen_* rows stop appearing here on their own —
// the screen does not need rewriting, because it filters on DOMAIN status, not
// on who does the work.
const NEEDS_STAFF = new Set([
  "script_approved",
  "gen_queued",
  "gen_running",
  "gen_failed",
  "gen_done",
  "internal_qa",
  "edit_queued",
  "edit_running",
  "rework_requested",
]);

export default function EditQueue() {
  const { data, error, loading, retry } = useAsync(() => api.listVideos());

  if (loading) return <LoadingRows rows={3} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  const queue = (data ?? []).filter((v) => NEEDS_STAFF.has(v.status));

  return (
    <div>
      <h1 className="font-serif text-3xl">Edit queue</h1>
      <p className="mt-1 text-sm text-muted">
        {queue.length} video{queue.length === 1 ? "" : "s"} waiting on us
      </p>

      <div className="mt-6 space-y-4">
        {queue.length === 0 ? (
          <EmptyState heading="Nothing waiting" body="Every video is with a client or published." />
        ) : (
          queue.map((video) => <WorkItem key={video.id} video={video} />)
        )}
      </div>
    </div>
  );
}

function WorkItem({ video }: { video: Video }) {
  // Local copy so attaching a version updates this card immediately rather
  // than waiting for the whole queue to refetch.
  const [current, setCurrent] = useState(video);
  const status = presentStatus(current.status, "staff");
  const [step, setStep] = useState(0);

  // The manual production checklist. These are the real steps an employee
  // performs, spelled out so nothing is skipped and anyone can pick up a
  // half-finished job — a shared queue only works if state is visible.
  const steps = [
    "Download the client's input",
    "Produce in HeyGen (web UI)",
    "Download the render",
    "Cut and upload the result",
  ];

  const latestNote = current.notes[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm">{current.title}</p>
            <p className="mt-1 font-mono text-xs text-muted">
              updated {relativeTime(current.updated_at)}
              {current.regens_used > 0 && ` · redo ${current.regens_used}/${current.regen_limit}`}
            </p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        {latestNote && (
          <div className="mb-4 rounded border border-subtle bg-cream px-4 py-3">
            <p className="font-mono text-xs text-muted">
              {latestNote.author_name} · {relativeTime(latestNote.created_at)}
            </p>
            <p className="mt-1 text-sm">{latestNote.body}</p>
          </div>
        )}

        <ol className="space-y-2">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                  i < step
                    ? "border-success bg-success/15 text-success-ink"
                    : i === step
                      ? "border-ink text-ink"
                      : "border-subtle text-muted"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={`text-sm ${i < step ? "text-muted line-through" : ""}`}>{label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={() => setStep((s) => Math.min(s + 1, steps.length))}
            disabled={step >= steps.length}
          >
            {step >= steps.length ? "Checklist complete" : `Mark "${steps[step]}" done`}
          </Button>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Undo
            </Button>
          )}
        </div>
        {/* Progress is local state only. Persisting it needs a checklist table
            on the ticket so a refresh, or a second employee, sees the same. */}
        <p className="mt-3 font-mono text-xs text-muted">
          checklist not saved yet — needs a table on the ticket
        </p>

        {/* The upload appears only once the work is actually done. Showing it
            from the start invites uploading the wrong file — the client's raw
            input rather than the finished cut. */}
        {step >= steps.length && (
          <div className="mt-5">
            <UploadVersion video={current} onAttached={setCurrent} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
