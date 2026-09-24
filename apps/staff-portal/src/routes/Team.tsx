/**
 * An agency's team: who is on it, and who has been invited.
 *
 * # HOW SOMEBODY JOINS
 *
 * The owner names an email and a position. We mint a link; the person sets
 * their OWN password through olum's normal sign-in and comes back as a real
 * account we then attach to the team. The owner never types, sees or stores
 * anybody's password.
 *
 * The link is shown ONCE, right after it is created, because the server keeps
 * only a hash of it. That is deliberate — a database dump should not hand over
 * working invitations — and it is why the new-invite row is a copyable field
 * rather than a quiet success message.
 */

import { useState } from "react";
import { api, type TeamInvite, type TeamMember, type TeamRole } from "@olum-video/api-client";
import { ErrorState, LoadingRows, relativeTime } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

const ROLES: { value: TeamRole; label: string; what: string }[] = [
  { value: "employee", label: "Team member", what: "Sees the queue, writes scripts" },
  { value: "editor", label: "Editor", what: "Can be assigned videos to edit" },
  { value: "admin", label: "Admin", what: "Everything, including managing the team" },
];

export default function Team() {
  const { data, error, loading, retry } = useAsync(() => api.getTeam());

  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState<TeamRole>("employee");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [freshLink, setFreshLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setProblem(null);
    setBusy(true);
    try {
      const res = await api.inviteMember(email.trim(), position.trim(), role);
      setFreshLink(res.link);
      setEmail("");
      setPosition("");
      retry();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused, and the link is on screen and
      // selectable either way — so this is not worth an error message.
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Your agency</p>
        <h1 className="mt-3 font-serif text-[clamp(1.8rem,4.4vw,2.6rem)] leading-[1.14] tracking-tight">
          The team
        </h1>
        <p className="mt-4 max-w-readable text-[14px] leading-relaxed text-muted">
          Everyone here can see your clients&rsquo; work &mdash; and only your
          clients&rsquo;. Invite someone and they set their own password; you never
          handle it.
        </p>
      </header>

      {loading && <LoadingRows rows={3} />}
      {error && <ErrorState message="We couldn't load that." onRetry={retry} />}

      {data && (
        <>
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              On the team &middot; {data.members.length}
            </h2>
            <ul className="mt-4 divide-y divide-subtle border-y border-subtle">
              {data.members.map((m) => (
                <MemberRow key={m.staff_id} m={m} />
              ))}
            </ul>
          </section>

          {data.invites.filter((i) => !i.accepted_at).length > 0 && (
            <section className="mt-10">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Waiting to join
              </h2>
              <ul className="mt-4 space-y-2">
                {data.invites
                  .filter((i) => !i.accepted_at)
                  .map((i) => (
                    <InviteRow key={i.id} i={i} onRevoked={retry} />
                  ))}
              </ul>
            </section>
          )}

          {/* The dark panel, as on the client side: this is the action the
              page exists for, so it gets the surface that carries weight. */}
          <section className="mt-12 overflow-hidden rounded-panel bg-panel px-7 py-8 text-paper sm:px-9">
            <span aria-hidden className="mb-7 block h-px w-full bg-spectrum opacity-70" />
            <h2 className="font-serif text-[clamp(1.2rem,2.6vw,1.6rem)]">Add someone</h2>
            <p className="mt-2 max-w-readable text-[13px] leading-relaxed text-paper/60">
              They&rsquo;ll get a link, sign in with their own olum account, and land
              straight in your queue.
            </p>

            <form onSubmit={invite} className="mt-7 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/55">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="mt-2 w-full rounded-[12px] border border-paper/20 bg-paper/[0.06] px-4 py-2.5 text-[14px] text-paper placeholder:text-paper/30 focus:border-paper/45 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/55">
                    Position
                  </span>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Script writer"
                    className="mt-2 w-full rounded-[12px] border border-paper/20 bg-paper/[0.06] px-4 py-2.5 text-[14px] text-paper placeholder:text-paper/30 focus:border-paper/45 focus:outline-none"
                  />
                </label>
              </div>

              <fieldset>
                <legend className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/55">
                  What they can do
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-[14px] border px-4 py-3 text-left transition-colors duration-300 ease-luxe ${
                        role === r.value
                          ? "border-paper/60 bg-paper/[0.1]"
                          : "border-paper/15 hover:border-paper/35"
                      }`}
                    >
                      <span className="block text-[13px] text-paper">{r.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-paper/50">
                        {r.what}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={busy || email.trim() === ""}
                className="rounded-full bg-paper px-6 py-3 text-sm text-ink transition-opacity duration-300 ease-luxe hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Creating the invite…" : "Create invite"}
              </button>

              {problem && (
                <p className="rounded-[12px] bg-flare/15 px-4 py-3 text-[13px] text-paper">
                  {problem}
                </p>
              )}
            </form>

            {/* Shown once. The server stores a hash, so this cannot be fetched
                again — which the copy explains rather than leaving someone to
                discover when they close the page. */}
            {freshLink && (
              <div className="mt-7 rounded-[16px] border border-paper/20 bg-paper/[0.06] px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                  Copy this now &mdash; it isn&rsquo;t shown again
                </p>
                <p className="mt-3 break-all font-mono text-[12px] leading-relaxed text-paper/85">
                  {freshLink}
                </p>
                <button
                  onClick={() => copy(freshLink)}
                  className="mt-3 rounded-full border border-paper/25 px-4 py-1.5 text-[12px] text-paper transition-colors hover:border-paper/50"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MemberRow({ m }: { m: TeamMember }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-[15px] text-ink">
          {m.name}
          {m.is_owner && (
            <span className="ml-2 rounded-full bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              owner
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[13px] text-muted">{m.position ?? "—"}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {m.roles.map((r) => (
          <span
            key={r}
            className="rounded-full border border-subtle px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
          >
            {r}
          </span>
        ))}
      </div>
    </li>
  );
}

function InviteRow({ i, onRevoked }: { i: TeamInvite; onRevoked: () => void }) {
  const [busy, setBusy] = useState(false);
  const expired = new Date(i.expires_at).getTime() < Date.now();

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-subtle bg-cream/40 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-[14px] text-ink">{i.email}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted">
          {i.position ?? i.role} ·{" "}
          {expired ? (
            <span className="text-flare-ink">expired</span>
          ) : (
            `expires ${relativeTime(i.expires_at)}`
          )}
        </p>
      </div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api.revokeInvite(i.id);
            onRevoked();
          } finally {
            setBusy(false);
          }
        }}
        className="text-[13px] text-muted transition-colors hover:text-danger-ink disabled:opacity-40"
      >
        {busy ? "…" : "Revoke"}
      </button>
    </li>
  );
}
