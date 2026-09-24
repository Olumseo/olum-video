/**
 * Publishing: approved videos waiting to go live, and the record of where
 * they went.
 *
 * Posting is manual today. Someone uploads the approved cut to the client's
 * channel by hand, then pastes the post's link here. That link is what the
 * client clicks from their Videos page — it is the proof the video is live,
 * and the only way they can find it in the wild without asking.
 *
 * Only APPROVED videos are listed with a form. The server refuses anything
 * else too, because posting something the client never signed off is the one
 * mistake in this product that cannot be taken back.
 */

import { useState } from "react";
import { api, type SocialPlatform, type Video } from "@olum-video/api-client";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingRows,
  PLATFORMS,
  VideoPlayer,
  platformName,
  relativeTime,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

const TO_PUBLISH = new Set(["approved", "publish_queued"]);

export default function Publish() {
  const { data, error, loading, retry } = useAsync(() => api.listStaffVideos());

  if (loading) return <LoadingRows rows={3} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  const waiting = (data ?? []).filter((v) => TO_PUBLISH.has(v.status));
  const live = (data ?? []).filter((v) => v.status === "published").slice(0, 8);

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Publishing</p>
      <h1 className="mt-3 font-serif text-3xl">Ready to go live</h1>
      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted">
        Approved by the client. Post the cut below to their channel, then paste the link to the
        post — that link is what they&rsquo;ll click to see it live.
      </p>

      <div className="mt-8 space-y-4">
        {waiting.length === 0 ? (
          <EmptyState
            heading="Nothing waiting"
            body="Every approved video is live. New ones appear here the moment a client approves a cut."
          />
        ) : (
          waiting.map((video) => <ToPublish key={video.id} video={video} onDone={retry} />)
        )}
      </div>

      {live.length > 0 && (
        <section className="mt-14">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Recently live
          </h2>
          <ul className="mt-4 divide-y divide-subtle rounded-card border border-subtle bg-paper">
            {live.map((video) => (
              <li
                key={video.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{video.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">{video.client_name}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {video.publications
                    .filter((p) => p.public_url)
                    .map((p) => (
                      <a
                        key={p.platform}
                        href={p.public_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline font-mono text-xs text-muted transition-colors hover:text-ink"
                      >
                        {platformName(p.platform)} ↗
                      </a>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ToPublish({ video, onDone }: { video: Video; onDone: () => void }) {
  const latest = video.versions[0];
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setError(null);
    setBusy(true);
    try {
      await api.publishVideo(video.id, { platform, url: url.trim() });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr]">
        {/* The exact cut the client approved — the one to post. Showing it
            here saves a trip to find the file and removes the chance of
            posting an older version. */}
        <div className="overflow-hidden rounded-[12px] bg-panel">
          {latest ? (
            <VideoPlayer src={latest.asset_url} label={`${video.title} — approved cut`} />
          ) : (
            <p className="p-4 text-xs text-paper/70">No cut attached.</p>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="good">approved</Badge>
            <span className="font-mono text-xs text-muted">
              {video.client_name} · approved {relativeTime(video.updated_at)}
            </span>
          </div>
          <p className="mt-2 text-[15px] text-ink">{video.title}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-[150px_1fr]">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Posted to
              </span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                className="mt-1.5 w-full rounded-[9px] border border-subtle bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Link to the live post
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/…"
                inputMode="url"
                className="mt-1.5 w-full rounded-[9px] border border-subtle bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-muted/50 focus:border-ink focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-danger-ink">
              {error}
            </p>
          )}

          <button
            disabled={busy || url.trim().length === 0}
            onClick={publish}
            className="mt-4 rounded-full bg-ink px-5 py-2 text-sm text-paper transition-colors duration-300 hover:bg-accent-2 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Mark as live"}
          </button>
        </div>
      </div>
    </Card>
  );
}
