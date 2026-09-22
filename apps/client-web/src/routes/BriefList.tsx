/**
 * Everything the client has asked for, newest first.
 *
 * Separate from the videos list because they answer different questions.
 * "Videos" is what exists and can be watched; this is what has been asked for
 * and is still being decided. Merging them would mean a row that is a request
 * and a row that is a finished film look the same, and the two have nothing in
 * common to do.
 */

import { Link } from "react-router-dom";
import { api, type Brief } from "@olum-video/api-client";
import { Reveal } from "@olum-video/ui";
import { relativeTime } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/** The client-facing reading of each state. See BriefDetail for the long form. */
const LABEL: Record<Brief["status"], { text: string; tone: string; dot: string }> = {
  generating: { text: "Being written", tone: "text-accent-ink", dot: "bg-amber" },
  ready_for_staff: { text: "In review", tone: "text-indigo-ink", dot: "bg-indigo" },
  generation_failed: { text: "Needs another go", tone: "text-flare-ink", dot: "bg-flare" },
  approved: { text: "In production", tone: "text-success-ink", dot: "bg-teal" },
  rejected: { text: "Not going ahead", tone: "text-muted", dot: "bg-muted" },
};

export default function BriefList() {
  const { data, error, loading, retry } = useAsync(() => api.listBriefs());

  return (
    <div className="mx-auto max-w-4xl">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Requests
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.8rem,4.6vw,2.7rem)] leading-[1.14] tracking-tight">
              What you&rsquo;ve asked for
            </h1>
          </div>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-500 ease-luxe hover:bg-accent-2"
          >
            New video
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </Reveal>

      {loading && (
        <ul className="mt-10 space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[86px] rounded-card bg-warm/60" />
          ))}
        </ul>
      )}

      {error && (
        <p className="py-20 text-center text-sm text-muted">
          We couldn&rsquo;t load your requests.{" "}
          <button onClick={retry} className="link-underline text-ink">
            Try again
          </button>
        </p>
      )}

      {data && data.length === 0 && (
        <Reveal delay={60}>
          <div className="mt-12 rounded-panel border border-subtle bg-cream/40 px-8 py-14 text-center">
            <span aria-hidden className="mx-auto mb-6 block h-px w-24 bg-spectrum" />
            <h2 className="font-display text-[clamp(1.2rem,2.6vw,1.6rem)]">
              Nothing asked for yet
            </h2>
            <p className="mx-auto mt-3 max-w-readable text-[14px] leading-relaxed text-muted">
              Write a sentence about what you want to say. We&rsquo;ll script it, check it
              against what we know about you, and put it in front of you before anything is
              made.
            </p>
            <Link
              to="/new"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-colors duration-500 ease-luxe hover:bg-accent-2"
            >
              Ask for your first video
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </Reveal>
      )}

      {data && data.length > 0 && (
        <ul className="mt-10 space-y-3">
          {data.map((brief, i) => {
            const label = LABEL[brief.status];
            return (
              <li
                key={brief.id}
                className="row-enter"
                style={{ "--row-delay": `${i * 50}ms` } as React.CSSProperties}
              >
                <Link
                  to={`/briefs/${brief.id}`}
                  className="row-lift block rounded-card border border-subtle bg-paper px-6 py-5"
                >
                  {/* Column on phones, row above sm. A floating status badge
                      made the metadata wrap around it at narrow widths. */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-[15px] text-ink sm:truncate">
                        {brief.title}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-[13px] text-muted">{brief.prompt}</p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] ${label.tone}`}
                    >
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${label.dot} ${
                          brief.status === "generating" ? "pulse-dot" : ""
                        }`}
                      />
                      {label.text}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-[11px] text-muted">
                    {relativeTime(brief.created_at)}
                    {brief.rounds > 0 && ` · ${brief.rounds} rewrite${brief.rounds === 1 ? "" : "s"}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
