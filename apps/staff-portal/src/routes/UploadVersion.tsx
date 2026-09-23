import { useState } from "react";
import { api, type Video, type VersionTrigger } from "@olum-video/api-client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  FileUpload,
  UploadProgress,
  inputClass,
} from "@olum-video/ui";

type Phase = "choosing" | "uploading" | "attaching" | "done";

/**
 * The last step of manual production: an employee uploads the finished cut.
 *
 * Three network steps, not one:
 *   1. ask our API for a pre-signed URL
 *   2. PUT the bytes STRAIGHT to storage (never through video-service)
 *   3. tell our API the upload landed, so it becomes a version
 *
 * Step 2 skips our server on purpose. Streaming a 500MB file through a Go
 * handler holds a connection and a slab of memory for the whole upload; at any
 * real concurrency that is how the service falls over.
 */
export function UploadVersion({
  video,
  onAttached,
}: {
  video: Video;
  onAttached: (updated: Video) => void;
}) {
  const [phase, setPhase] = useState<Phase>("choosing");
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Which kind of version this is. It decides whether the CLIENT is charged,
  // so it is an explicit choice by the employee, never inferred.
  const [trigger, setTrigger] = useState<VersionTrigger>(
    video.versions.length === 0 ? "initial" : "internal_fix",
  );

  const revisionsLeft = video.regen_limit - video.regens_used;
  const noRevisionsLeft = revisionsLeft <= 0;

  async function submit() {
    if (!file) return;
    setError(null);

    try {
      setPhase("uploading");
      setPercent(0);
      const ticket = await api.requestUpload({
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
        purpose: "video_version",
      });

      await api.uploadFile(ticket, file, setPercent);

      setPhase("attaching");
      const updated = await api.attachVersion({
        video_id: video.id,
        asset_id: ticket.asset_id,
        trigger,
        note: note.trim() || undefined,
      });

      setPhase("done");
      onAttached(updated);
    } catch (err) {
      // Back to "choosing", not a dead end: the file is still selected, so a
      // retry is one click rather than picking it again.
      setPhase("choosing");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  if (phase === "done") {
    return (
      <Card className="border-success/40">
        <CardBody>
          <p className="text-sm">Uploaded. This video is now with the client for review.</p>
        </CardBody>
      </Card>
    );
  }

  const busy = phase === "uploading" || phase === "attaching";

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm text-ink">Upload the finished cut</h3>
      </CardHeader>
      <CardBody className="space-y-5">
        <FileUpload
          label="The edited video"
          hint="MP4 up to 500 MB. Goes straight to storage, not through our API."
          accept="video/*"
          disabled={busy}
          onSelect={setFile}
        />

        <div>
          <p className="text-sm text-ink">What kind of version is this?</p>
          {/* Spelled out because it decides whether the client pays. An
              employee guessing here is a billing error. */}
          <div className="mt-2 space-y-2">
            <TriggerChoice
              value="initial"
              current={trigger}
              onPick={setTrigger}
              disabled={busy}
              label="First cut"
              detail="The original video for this request. Free."
            />
            <TriggerChoice
              value="internal_fix"
              current={trigger}
              onPick={setTrigger}
              disabled={busy}
              label="Our fix"
              detail="A problem we found ourselves. Free — never counts against the client."
            />
            <TriggerChoice
              value="client_redo"
              current={trigger}
              onPick={setTrigger}
              disabled={busy || noRevisionsLeft}
              label="Client-requested change"
              detail={
                noRevisionsLeft
                  ? "Unavailable — the client has used both revisions."
                  : `Billable. Uses one of ${revisionsLeft} remaining revisions.`
              }
            />
          </div>
        </div>

        <Field id="upload-note" label="Note for the client" hint="Optional. Shown in their history.">
          <textarea
            id="upload-note"
            className={`${inputClass} min-h-20 resize-y`}
            value={note}
            disabled={busy}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Trimmed the intro and tightened the close."
          />
        </Field>

        {phase === "uploading" && <UploadProgress percent={percent} />}
        {phase === "attaching" && (
          <p className="font-mono text-xs text-muted">Upload finished — saving the version…</p>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger-ink">
            {error}
          </p>
        )}

        <Button onClick={submit} disabled={!file || busy} loading={busy}>
          {busy ? "Uploading…" : "Upload and send to client"}
        </Button>
      </CardBody>
    </Card>
  );
}

function TriggerChoice({
  value,
  current,
  onPick,
  label,
  detail,
  disabled,
}: {
  value: VersionTrigger;
  current: VersionTrigger;
  onPick: (v: VersionTrigger) => void;
  label: string;
  detail: string;
  disabled?: boolean;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onPick(value)}
      className={`w-full rounded border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        selected ? "border-ink bg-cream" : "border-subtle hover:bg-cream/60"
      }`}
    >
      <span className="block text-sm">{label}</span>
      <span className="mt-0.5 block text-xs text-muted">{detail}</span>
    </button>
  );
}
