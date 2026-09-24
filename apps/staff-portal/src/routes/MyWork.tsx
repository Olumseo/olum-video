/**
 * What is on YOUR desk.
 *
 * # WHY THIS SCREEN EXISTS
 *
 * The edit queue shows every video that needs attention, for everyone. An
 * editor with four assignments in a queue of sixty had no way to find their
 * four. Assignment existed in the database and nowhere in the product, which
 * meant "who is doing this?" was answered in a chat window.
 *
 * Scoped to the signed-in person by the server, not by a filter here: a
 * client-side filter over everybody's work still ships everybody's work to the
 * browser.
 */

import { Link } from "react-router-dom";
import { api, type EditorAssignment } from "@olum-video/api-client";
import { ErrorState, LoadingRows, presentStatus, relativeTime } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/** Overdue, due soon, or fine. Colour and words come from the same call so a
 *  row can never be red and say "plenty of time". */
function due(sla: string | null): { text: string; tone: string } | null {
  if (!sla) return null;
  const ms = new Date(sla).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms < 0) return { text: `overdue by ${relativeTime(sla).replace(" ago", "")}`, tone: "text-flare-ink" };
  const hours = ms / 3_600_000;
  if (hours < 24) return { text: "due today", tone: "text-amber-ink" };
  return { text: `due in ${Math.round(hours / 24)}d`, tone: "text-muted" };
}

export default function MyWork() {
  const { data, error, loading, retry } = useAsync(() => api.listMyAssignments());

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Assigned</p>
          <h1 className="mt-3 font-serif text-[clamp(1.8rem,4.4vw,2.6rem)] leading-[1.14] tracking-tight">
            On your desk
          </h1>
        </div>
        {data && data.length > 0 && (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            {data.length} {data.length === 1 ? "job" : "jobs"}
          </p>
        )}
      </header>

      {loading && <LoadingRows rows={3} />}
      {error && <ErrorState message="We couldn't load that." onRetry={retry} />}

      {data && data.length === 0 && (
        <div className="mt-10 rounded-panel border border-subtle bg-cream/40 px-8 py-14 text-center">
          <span aria-hidden className="mx-auto mb-6 block h-px w-24 bg-spectrum" />
          <h2 className="font-serif text-xl">Nothing assigned to you</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
            When someone hands you a video it appears here, with what needs doing and when
            it&rsquo;s due.
          </p>
          <Link
            to="/edits"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-subtle px-5 py-2.5 text-sm text-ink transition-colors duration-500 ease-luxe hover:border-ink/30"
          >
            See the whole queue
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="mt-9 space-y-3">
          {data.map((a, i) => (
            <Row key={a.ticket_id} a={a} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ a, index }: { a: EditorAssignment; index: number }) {
  const when = due(a.sla_due_at);
  const late = when?.tone === "text-flare-ink";
  const status = a.video_status ? presentStatus(a.video_status, "staff") : null;

  return (
    <li
      className="row-enter"
      style={{ "--row-delay": `${index * 50}ms` } as React.CSSProperties}
    >
      <div
        className={`row-lift relative overflow-hidden rounded-card border px-6 py-5 ${
          late ? "border-flare-ink/30 bg-flare/[0.05]" : "border-subtle bg-paper"
        }`}
      >
        {/* A spectrum edge on anything overdue. Sixty identical rows is how a
            late job stays late. */}
        {late && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-spectrum-v" />}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] text-ink">{a.title}</h2>
            <p className="mt-1 text-[13px] text-muted">{a.client_name}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span className="rounded-full border border-subtle px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {a.ticket_type.replace(/_/g, " ")}
            </span>
            {status && (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {status.label}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] text-muted">
            assigned {relativeTime(a.assigned_at)}
            {when && (
              <>
                {" · "}
                <span className={when.tone}>{when.text}</span>
              </>
            )}
          </p>
          {a.video_id && (
            <Link
              to={`/edits?video=${a.video_id}`}
              className="text-[13px] text-ink underline decoration-subtle underline-offset-4 transition-colors hover:decoration-ink"
            >
              Open
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
