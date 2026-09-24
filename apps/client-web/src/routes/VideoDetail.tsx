/**
 * One video: watch it, and — only when a cut is waiting on you — decide.
 *
 * WHAT IS NOT ON THIS PAGE
 * ------------------------
 * The script. It used to sit under the player with its own prompt and body,
 * which put the same words in two places (here and Requests) and made this
 * page half about a document. Scripts are decided in Requests; this page is
 * for the video. A link back to the request is all that remains of it.
 *
 * Every action on a video lives here and nowhere else: approve the cut, or ask
 * for changes. Script decisions live in Requests, twin actions in Setup.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  QuotaError,
  type Publication,
  type Video,
  type VideoVersion,
} from "@olum-video/api-client";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Field,
  LoadingRows,
  Reveal,
  VideoPlayer,
  duration,
  inputClass,
  platformName,
  presentStatus,
  relativeTime,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/** Statuses where the video is made, whatever else is still happening. */
const FINISHED = new Set(["approved", "publish_queued", "published"]);

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
    // Each block reveals a beat after the one above it, so the page assembles
    // downward instead of appearing as one slab. Delays are short (60ms) and
    // the whole sequence is done inside half a second — this is a screen people
    // open every day, not a page they see once.
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="link-underline font-mono text-xs text-muted transition-colors hover:text-ink"
        >
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

      <Reveal delay={60}>
        {latest ? (
          <Player version={latest} />
        ) : (
          <Card>
            <CardBody className="py-10 text-center">
              {/* Said according to the status, so the page can never contradict
                  its own badge. It used to say "still producing" under a
                  green "Published". */}
              <p className="text-sm text-muted">
                {FINISHED.has(current.status)
                  ? "This one is finished — the links to where it went live are below."
                  : "We're making this one. It will appear here the moment it's ready for you to watch."}
              </p>
            </CardBody>
          </Card>
        )}
      </Reveal>

      <LiveLinks video={current} />

      {current.status === "client_review" && latest && (
        <Reveal delay={120}>
          <ReviewPanel
            video={current}
            version={latest}
            revisionsLeft={revisionsLeft}
            onUpdated={setVideo}
          />
        </Reveal>
      )}

      {current.brief_id && (
        <Reveal delay={180}>
          <p className="font-mono text-xs text-muted">
            <Link
              to={`/briefs/${current.brief_id}`}
              className="link-underline transition-colors hover:text-ink"
            >
              The script behind this video, in Requests →
            </Link>
          </p>
        </Reveal>
      )}

      {current.notes.length > 0 && (
        <Reveal delay={240}>
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
        </Reveal>
      )}
    </div>
  );
}

/**
 * Where the video went live.
 *
 * Only posts with a real permalink are listed — a queued post has no link yet,
 * and a "Live on Instagram" that goes nowhere is worse than not saying it. An
 * approved video with no post yet says what happens next instead.
 */
function LiveLinks({ video }: { video: Video }) {
  const live = video.publications.filter(
    (p): p is Publication & { public_url: string } => p.public_url != null,
  );

  if (live.length === 0) {
    if (video.status !== "approved" && video.status !== "publish_queued") return null;
    return (
      <Reveal delay={90}>
        <Card>
          <CardBody>
            <p className="text-sm text-ink">Approved — we&rsquo;re posting it.</p>
            <p className="mt-1 text-xs text-muted">
              The link to the live post will appear here as soon as it&rsquo;s up.
            </p>
          </CardBody>
        </Card>
      </Reveal>
    );
  }

  return (
    <Reveal delay={90}>
      <Card>
        <CardHeader>
          <h2 className="text-sm text-ink">Live now</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {live.map((post) => (
            <div
              key={post.platform}
              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <a
                href={post.public_url}
                target="_blank"
                // The link is to someone else's site. noopener stops that page
                // reaching back into this one through window.opener.
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-sm text-ink"
              >
                <span className="link-underline">Watch on {platformName(post.platform)}</span>
                <span
                  aria-hidden
                  className="text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  ↗
                </span>
              </a>
              <span className="font-mono text-xs text-muted">
                {post.published_at ? `posted ${relativeTime(post.published_at)}` : "posted"}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    </Reveal>
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
    // The only card on this page that is asking for something. The soft accent
    // shadow is what separates "here is your video" from "here is the decision
    // we need from you" without resorting to a colour fill.
    <Card className="border-accent/40 shadow-[0_18px_44px_-30px_rgb(var(--accent-rgb)/0.55)]">
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
              <Button
                variant="secondary"
                onClick={() => setAsking(true)}
                disabled={revisionsLeft <= 0}
              >
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
          <p role="alert" className="mt-4 text-sm text-danger-ink">
            {error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
