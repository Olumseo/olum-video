/**
 * The brief review queue — the gate between a client's prompt and a video.
 *
 * Nothing gets made until someone here says yes, so this screen is where the
 * product's promise ("every cut reviewed by a person") is actually kept.
 *
 * It is a two-pane layout rather than a list-then-detail because reviewing is
 * a comparison: the script only makes sense next to what the client asked for
 * and what we know about them. Navigating away to read the context and back to
 * write the script is how a reviewer ends up approving from memory.
 */

import { useEffect, useState } from "react";
import { api, type Brief } from "@olum-video/api-client";
import { EmptyState, ErrorState, LoadingRows, relativeTime } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

const STATUS: Record<Brief["status"], { label: string; tone: string }> = {
  generating: { label: "Needs writing", tone: "text-accent-ink" },
  ready_for_staff: { label: "Needs a decision", tone: "text-indigo-ink" },
  generation_failed: { label: "Failed", tone: "text-flare-ink" },
  approved: { label: "Approved", tone: "text-success-ink" },
  rejected: { label: "Rejected", tone: "text-muted" },
};

export default function BriefReview() {
  const { data, error, loading, retry } = useAsync(() => api.listPendingBriefs());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Select the oldest as soon as the list arrives, so the screen opens on work
  // rather than on an instruction to pick some.
  useEffect(() => {
    if (!selectedId && data && data.length > 0) setSelectedId(data[0]!.id);
  }, [data, selectedId]);

  if (loading) return <LoadingRows rows={4} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data?.length) {
    return (
      <EmptyState
        heading="Nothing to review"
        body="Every brief has been decided. New requests appear here as clients send them."
      />
    );
  }

  const selected = data.find((b) => b.id === selectedId) ?? data[0]!;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Review</p>
      <h1 className="mt-3 font-serif text-3xl">Briefs waiting on us</h1>
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-muted">
        Nothing is generated until one of these is approved. Oldest first.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <ul className="space-y-2">
          {data.map((brief, i) => {
            const active = brief.id === selected.id;
            return (
              <li
                key={brief.id}
                className="row-enter"
                style={{ "--row-delay": `${i * 45}ms` } as React.CSSProperties}
              >
                <button
                  onClick={() => setSelectedId(brief.id)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full rounded-card border px-4 py-3.5 text-left transition-colors duration-300 ${
                    active
                      ? "border-ink/25 bg-paper shadow-[0_18px_40px_-32px_rgb(var(--ink-rgb)/0.5)]"
                      : "border-subtle bg-transparent hover:border-ink/15"
                  }`}
                >
                  <p className="truncate text-[14px] text-ink">{brief.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {brief.client_name ?? "—"}
                  </p>
                  <p
                    className={`mt-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      STATUS[brief.status].tone
                    }`}
                  >
                    {STATUS[brief.status].label} · {relativeTime(brief.created_at)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <Detail key={selected.id} brief={selected} onChange={retry} />
      </div>
    </div>
  );
}

function Detail({ brief, onChange }: { brief: Brief; onChange: () => void }) {
  const [body, setBody] = useState(brief.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState<"changes" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  const facts = Object.entries(brief.context ?? {}).filter(([, v]) => v != null && v !== "");
  const roundsLeft = brief.max_rounds - brief.rounds;

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      setAsking(null);
      setReason("");
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-subtle bg-paper p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl">{brief.title}</h2>
        <span
          className={`font-mono text-[11px] uppercase tracking-[0.16em] ${
            STATUS[brief.status].tone
          }`}
        >
          {STATUS[brief.status].label}
        </span>
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted">
        {brief.client_name} · round {brief.rounds + 1} of {brief.max_rounds + 1}
      </p>

      <section className="mt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          What they asked for
        </h3>
        <p className="mt-2 rounded-[12px] bg-cream/50 px-4 py-3 text-[14px] leading-relaxed text-ink">
          {brief.prompt}
        </p>
      </section>

      {facts.length > 0 && (
        <section className="mt-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Context
          </h3>
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {facts.map(([key, value]) => (
              <div key={key} className="flex gap-2 text-[13px]">
                <dt className="shrink-0 text-muted">{key.replace(/_/g, " ")}</dt>
                <dd className="min-w-0 truncate text-ink">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {brief.failure_reason && (
        <p className="mt-5 rounded-[12px] border border-accent-ink/25 bg-accent/10 px-4 py-3 text-[13px] text-ink">
          {brief.failure_reason}
        </p>
      )}

      <section className="mt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          The script
        </h3>
        <textarea
          rows={14}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write what the avatar will say…"
          className="mt-2 w-full resize-y rounded-[12px] border border-subtle bg-paper px-4 py-3 font-mono text-[13px] leading-relaxed text-ink placeholder:text-muted/50 focus:border-ink focus:outline-none"
        />
      </section>

      {error && <p className="mt-3 text-[13px] text-danger-ink">{error}</p>}

      {asking ? (
        <div className="mt-5 rounded-[12px] border border-subtle bg-cream/40 p-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {asking === "changes" ? "What needs to change?" : "Why not?"}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 w-full resize-y rounded-[9px] border border-subtle bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={busy || reason.trim().length === 0}
              onClick={() =>
                run(() =>
                  asking === "changes"
                    ? api.requestBriefChanges(brief.id, reason.trim())
                    : api.rejectBrief(brief.id, reason.trim()),
                )
              }
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent-2 disabled:opacity-40"
            >
              {asking === "changes" ? "Send back" : "Reject"}
            </button>
            <button
              onClick={() => setAsking(null)}
              className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            disabled={busy || body.trim().length === 0}
            onClick={() => run(() => api.writeBrief(brief.id, body))}
            className="rounded-full border border-subtle px-4 py-2 text-sm text-ink transition-colors hover:border-ink/30 disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            disabled={busy || body.trim().length === 0}
            onClick={() => run(async () => {
              // Save first: approving turns whatever is STORED into the script,
              // so unsaved edits in this box would be silently dropped and a
              // video made from the previous draft.
              if (body !== (brief.body ?? "")) await api.writeBrief(brief.id, body);
              await api.approveBrief(brief.id);
            })}
            className="rounded-full bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent-2 disabled:opacity-40"
          >
            Approve &amp; make it
          </button>
          <button
            disabled={busy || roundsLeft <= 0}
            title={roundsLeft <= 0 ? "No revision rounds left on this plan" : undefined}
            onClick={() => setAsking("changes")}
            className="rounded-full border border-subtle px-4 py-2 text-sm text-ink transition-colors hover:border-ink/30 disabled:opacity-40"
          >
            Send back ({roundsLeft} left)
          </button>
          <button
            disabled={busy}
            onClick={() => setAsking("reject")}
            className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-danger-ink disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
