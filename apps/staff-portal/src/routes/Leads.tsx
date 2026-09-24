/**
 * Sign-ups: people who filled in "Create my AI clone" on the landing page.
 *
 * Every row is VERIFIED — they typed back a code from their inbox and one
 * from their phone — so the list is safe to call from without first checking
 * the number is real. The landing page promises "our team will contact you
 * shortly"; this is the list that keeps that promise.
 *
 * Olum's staff only. The landing page is olum's, so an agency's staff get a
 * 404 from the API and the nav hides the link for them.
 */

import { useState } from "react";
import { api, type Lead } from "@olum-video/api-client";
import { EmptyState, ErrorState, LoadingRows, relativeTime } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

export default function Leads() {
  const { data, error, loading, retry } = useAsync(() => api.listLeads());

  if (loading) return <LoadingRows rows={3} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  const fresh = (data ?? []).filter((l) => l.status === "new").length;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Sign-ups</p>
      <h1 className="mt-3 font-serif text-3xl">People waiting for a call</h1>
      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted">
        From the landing page&rsquo;s &ldquo;Create my AI clone&rdquo; form. Email and phone are
        both verified. {fresh > 0 ? `${fresh} not called yet — newest first.` : "Everyone has been called."}
      </p>

      {!data?.length ? (
        <div className="mt-8">
          <EmptyState
            heading="No sign-ups yet"
            body="They appear here the moment someone verifies both codes on the landing page."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {data.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onChanged={retry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadRow({ lead, onChanged }: { lead: Lead; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const fresh = lead.status === "new";

  async function contacted() {
    setProblem(null);
    setBusy(true);
    try {
      await api.markLeadContacted(lead.id);
      onChanged();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "That didn't save.");
      setBusy(false);
    }
  }

  return (
    <li
      className={`rounded-card border px-6 py-5 ${
        fresh ? "border-flare-ink/25 bg-flare/[0.04]" : "border-subtle bg-paper"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[15px] text-ink">
            {lead.name}
            {lead.company && <span className="text-muted"> · {lead.company}</span>}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px]">
            <a href={`tel:${lead.phone}`} className="link-underline text-ink">
              {lead.phone}
            </a>
            <a href={`mailto:${lead.email}`} className="link-underline text-ink">
              {lead.email}
            </a>
          </p>
          {lead.note && <p className="mt-2 text-[13.5px] text-muted">&ldquo;{lead.note}&rdquo;</p>}
          <p className="mt-2 font-mono text-[11px] text-muted">
            signed up {relativeTime(lead.updated_at)}
            {!fresh && lead.contacted_at &&
              ` · called ${relativeTime(lead.contacted_at)}${lead.contacted_by ? ` by ${lead.contacted_by}` : ""}`}
          </p>
        </div>
        {fresh ? (
          <button
            onClick={contacted}
            disabled={busy}
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors duration-300 hover:bg-accent-2 disabled:opacity-40"
          >
            {busy ? "…" : "Mark as called"}
          </button>
        ) : (
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-success-ink">
            called
          </span>
        )}
      </div>
      {problem && <p className="mt-3 text-[13px] text-danger-ink">{problem}</p>}
    </li>
  );
}
