/**
 * "Are you an agency?" — turning a customer account into one.
 *
 * # WHY THIS IS IN SETTINGS AND NOT ON THE SIGN-UP FORM
 *
 * The tick belongs at sign-up, and sign-up is olum.ai's page, owned by the
 * auth team. Adding a field there is their change, not ours, and it needs
 * their release.
 *
 * Putting it here means the feature works today without blocking on anybody,
 * and it is where people will look anyway — almost nobody decides they are an
 * agency in the thirty seconds before they have seen the product. When the
 * auth team does add the tick, it calls the same endpoint and this stays as
 * the way to change your mind afterwards.
 *
 * # WHY IT IS NOT REVERSIBLE HERE
 *
 * Unticking would orphan the team and every client the agency serves. That is
 * a support conversation, not a toggle.
 */

import { useState } from "react";
import { api, type Agency } from "@olum-video/api-client";

export function AgencyCard({ agency, onChanged }: { agency: Agency | null; onChanged: () => void }) {
  const [opening, setOpening] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function register() {
    setProblem(null);
    setBusy(true);
    try {
      await api.registerAgency(name.trim());
      onChanged();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  if (agency) {
    return (
      <div className="overflow-hidden rounded-panel bg-panel px-7 py-7 text-paper">
        <span aria-hidden className="mb-6 block h-px w-full bg-spectrum opacity-70" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/55">
          Agency account
        </p>
        <h2 className="mt-3 font-serif text-[clamp(1.2rem,2.6vw,1.6rem)]">{agency.name}</h2>
        <p className="mt-3 max-w-readable text-[13px] leading-relaxed text-paper/65">
          Your team works on your clients&rsquo; videos in the staff portal, and sees
          nothing outside your agency.
        </p>
        <a
          href="/staff/team"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm text-ink transition-opacity duration-300 ease-luxe hover:opacity-90"
        >
          Manage the team
          <span aria-hidden>&rarr;</span>
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-subtle bg-cream/40 px-6 py-6">
      <h2 className="text-[15px] text-ink">Are you an agency?</h2>
      <p className="mt-2 max-w-readable text-[13px] leading-relaxed text-muted">
        If you make videos for other people, you can bring your team in and work on
        your clients&rsquo; requests yourselves. They sign in with their own olum
        accounts &mdash; you never handle anybody&rsquo;s password.
      </p>

      {!opening ? (
        <button
          onClick={() => setOpening(true)}
          className="mt-5 rounded-full border border-subtle px-5 py-2.5 text-sm text-ink transition-colors duration-500 ease-luxe hover:border-ink/30"
        >
          Set up an agency account
        </button>
      ) : (
        <div className="mt-5">
          <label htmlFor="agency-name" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Agency name
          </label>
          <input
            id="agency-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Northwind Agency"
            className="mt-2 w-full max-w-sm rounded-[12px] border border-subtle bg-paper px-4 py-2.5 text-[14px] text-ink placeholder:text-muted/50 focus:border-ink focus:outline-none"
          />
          <p className="mt-2 text-[12px] text-muted">
            This is what your team and your clients will see. You can&rsquo;t undo this
            yourself &mdash; it would orphan the team.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={register}
              disabled={busy || name.trim() === ""}
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-500 ease-luxe hover:bg-accent-2 disabled:opacity-40"
            >
              {busy ? "Setting up…" : "Create the agency"}
            </button>
            <button
              onClick={() => setOpening(false)}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
          {problem && (
            <p className="mt-4 rounded-[12px] bg-flare/10 px-4 py-3 text-[13px] text-flare-ink">
              {problem}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
