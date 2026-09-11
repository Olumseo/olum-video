import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, QuotaError, type Video, type VideoVersion } from "@olum-video/api-client";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Field,
  LoadingRows,
  VideoPlayer,
  duration,
  inputClass,
  presentStatus,
  relativeTime,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

export default function VideoDetail() {
  const { id = "" } = useParams();
  const { data, error, loading, retry } = useAsync(() => api.getVideo(id), [id]);

  // Local copy so approving or requesting rework updates the page immediately
  // instead of waiting for a refetch.
  const [video, setVideo] = useState<Video | null>(null);
  const current = video ?? data;

  if (loading && !current) return <LoadingRows rows={3} />;
  if (error && !current) return <ErrorState message={error} onRetry={retry} />;
  if (!current) return null;

  const status = presentStatus(current.status, "client");
  const latest = current.versions[0];
  const revisionsLeft = current.regen_limit - current.regens_used;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="font-mono text-xs text-muted underline underline-offset-4">
          ← All videos
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl">{current.title}</h1>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="mt-1 font-mono text-xs text-muted">
          Created {relativeTime(current.created_at)} · updated {relativeTime(current.updated_at)}
        </p>
      </div>

      {latest ? (
        <Player version={latest} />
      ) : (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-muted">
              Nothing to watch yet — we're still producing this one.
            </p>
          </CardBody>
        </Card>
      )}

      {current.status === "client_review" && latest && (
        <ReviewPanel
          video={current}
          version={latest}
          revisionsLeft={revisionsLeft}
          onUpdated={setVideo}
        />
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm text-ink">Script</h2>
        </CardHeader>
        <CardBody>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Your prompt</p>
          <p className="mt-1.5 text-sm text-muted">{current.script.prompt || "—"}</p>
          {current.script.body && (
            <>
              <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
                What we wrote
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{current.script.body}</p>
            </>
          )}
        </CardBody>
      </Card>

      {current.notes.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm text-ink">History</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {current.notes.map((note) => (
              <div key={note.id}>
                <p className="font-mono text-xs text-muted">
                  {note.author_name} · {relativeTime(note.created_at)}
                </p>
                <p className="mt-1 text-sm">{note.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Player({ version }: { version: VideoVersion }) {
  return (
    <Card>
      <VideoPlayer src={version.asset_url} label={`Version ${version.version_no}`} />
      <CardBody>
        <p className="font-mono text-xs text-muted">
          Version {version.version_no} · {duration(version.duration_ms)} ·{" "}
          {relativeTime(version.created_at)}
        </p>
      </CardBody>
    </Card>
  );
}

function ReviewPanel({
  video,
  version,
  revisionsLeft,
  onUpdated,
}: {
  video: Video;
  version: VideoVersion;
  revisionsLeft: number;
  onUpdated: (v: Video) => void;
}) {
  const [asking, setAsking] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<"approve" | "rework" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    setBusy("approve");
    try {
      onUpdated(await api.approveVideo(video.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve.");
      setBusy(null);
    }
  }

  async function requestRework() {
    setError(null);
    setBusy("rework");
    try {
      onUpdated(
        await api.requestRework({ video_id: video.id, version_id: version.id, body: body.trim() }),
      );
      setAsking(false);
      setBody("");
    } catch (err) {
      // QuotaError is a rule, not a fault. Say what the limit is rather than
      // showing a generic failure the user cannot act on.
      setError(
        err instanceof QuotaError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not send your changes.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-accent/40">
      <CardHeader>
        <h2 className="text-sm text-ink">Ready for your review</h2>
      </CardHeader>
      <CardBody>
        {!asking ? (
          <>
            <p className="text-sm text-muted">
              Happy with this cut? Approving sends it on. If not, tell us what to change.
            </p>
            <p className="mt-2 font-mono text-xs text-muted">
              {revisionsLeft > 0
                ? `${revisionsLeft} of ${video.regen_limit} revisions remaining`
                : "No revisions remaining on this video"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={approve} loading={busy === "approve"}>
                Approve
              </Button>
              <Button variant="secondary" onClick={() => setAsking(true)} disabled={revisionsLeft <= 0}>
                Request changes
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Field
              id="rework"
              label="What should we change?"
              hint="Be specific — timestamps help. This uses one of your revisions."
            >
              <textarea
                id="rework"
                className={`${inputClass} min-h-28 resize-y`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="The intro runs long — can we start at 0:08?"
              />
            </Field>
            <div className="flex gap-3">
              <Button onClick={requestRework} loading={busy === "rework"} disabled={!body.trim()}>
                Send changes
              </Button>
              <Button variant="ghost" onClick={() => setAsking(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
