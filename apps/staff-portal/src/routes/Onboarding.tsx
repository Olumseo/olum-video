/**
 * The provisioning queue: clients who have paid and cannot yet use anything.
 *
 * Two kinds of row, because there are two things a paying client can be stuck
 * on: their accounts (mailbox, studio account, verification, their check), or
 * — after all that — the digital twin they asked for. The twin rows used to
 * be missing entirely: asking for a twin happens AFTER a client is active,
 * and this list only showed clients who were not. The request opened two
 * tickets and then no screen offered the buttons that close them.
 *
 * This is the most time-sensitive screen in the staff portal. Everyone on it
 * is a paying customer looking at a page that says "almost there", so the
 * design decisions all point the same way:
 *
 *   - Oldest first, and the wait is shown in plain words. A list sorted by
 *     anything else lets the forgotten client stay forgotten.
 *   - The next action is a button ON the row. Provisioning is four small steps
 *     and a detail page for each would turn a two-minute job into navigation.
 *   - Who holds it is always visible. Unclaimed work and work parked with
 *     someone on leave look identical in every queue that omits this.
 */

import { useState } from "react";
import { api, type OnboardingClient } from "@olum-video/api-client";
import { EmptyState, ErrorState, LoadingRows, relativeTime } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

/** How long a client has been waiting before the row starts shouting. */
const OVERDUE_HOURS = 24;

export default function Onboarding() {
  const { data, error, loading, retry } = useAsync(() => api.listOnboarding());

  if (loading) return <LoadingRows rows={3} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data?.length) {
    return (
      <EmptyState
        heading="Nobody waiting"
        body="Every client who has paid is set up. New ones appear here the moment they subscribe."
      />
    );
  }

  const overdue = data.filter((c) => hoursSince(c.WaitingSince) >= OVERDUE_HOURS).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Provisioning
          </p>
          <h1 className="mt-3 font-serif text-3xl">Getting people started</h1>
        </div>
        {overdue > 0 && (
          <p className="rounded-full bg-flare/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-flare-ink">
            {overdue} waiting over a day
          </p>
        )}
      </div>

      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-muted">
        Everyone here has paid and can&rsquo;t make a video yet — waiting on their accounts, or
        on the digital twin they asked for. Longest wait first.
      </p>

      <ul className="mt-8 space-y-3">
        {data.map((client, i) => (
          <Row key={client.ClientID} client={client} index={i} onChange={retry} />
        ))}
      </ul>
    </div>
  );
}

function Row({
  client,
  index,
  onChange,
}: {
  client: OnboardingClient;
  index: number;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(false);
  const [email, setEmail] = useState(client.ManagedEmail ?? "");
  const [external, setExternal] = useState(client.ExternalID ?? "");
  const [ref, setRef] = useState("");

  const waited = hoursSince(client.WaitingSince);
  const late = waited >= OVERDUE_HOURS;
  // Active and asked for a twin: the accounts are done, only the twin is left.
  const twinStage = client.Status === "active" && client.TwinRequested;

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      setForm(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  const verified = client.Verification != null &&
    ["verified", "training", "ready"].includes(client.Verification);

  return (
    <li
      className="row-enter rounded-card border border-subtle bg-paper px-6 py-5"
      style={{ "--row-delay": `${index * 50}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className="text-[15px] text-ink">{client.DisplayName}</h2>
          <p className="mt-1 font-mono text-[11px] text-muted">
            {twinStage ? "asked for a twin " : "waiting "}
            {relativeTime(client.WaitingSince).replace(" ago", twinStage ? " ago" : "")}
            {client.AssigneeName ? ` · ${client.AssigneeName}` : " · unclaimed"}
          </p>
        </div>
        {late && (
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-flare-ink">
            overdue
          </span>
        )}
      </div>

      {/* The steps, as a strip. A client is only ever on one of them, so
          showing them all makes "what's left" answerable without opening
          anything. */}
      {twinStage ? (
        <ol className="mt-4 flex flex-wrap gap-1.5">
          <Pip done label="Accounts" />
          <Pip done={client.AvatarReady} label="Avatar" />
          <Pip done={client.VoiceReady} label="Voice" />
        </ol>
      ) : (
        <ol className="mt-4 flex flex-wrap gap-1.5">
          <Pip done={client.ManagedEmail != null} label="Mailbox" />
          <Pip done={client.ExternalID != null} label="Studio account" />
          <Pip done={verified} label="Verified" />
          <Pip
            done={client.Status === "awaiting_client_check" || client.Status === "active"}
            label="With client"
          />
        </ol>
      )}

      {error && <p className="mt-3 text-[13px] text-danger-ink">{error}</p>}

      {twinStage ? (
        <div className="mt-4">
          <p className="max-w-[60ch] text-[13px] leading-relaxed text-muted">
            Call them to book the recording, create the avatar and the voice in their studio
            account, then mark each one ready. Both halves are needed before they can make a video.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TwinButtons client={client} busy={busy} run={run} />
          </div>
        </div>
      ) : form ? (
        <div className="mt-4 rounded-[12px] border border-subtle bg-cream/40 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Managed email" value={email} onChange={setEmail}
              placeholder="acme@video.olum.ai" />
            <Input label="Studio account id" value={external} onChange={setExternal}
              placeholder="heygen_acme" />
            <Input label="Credentials ref" value={ref} onChange={setRef}
              placeholder="secretsmanager://…" />
          </div>
          {/* Said out loud because the alternative is somebody pasting a
              password into a database that is backed up and read by every DBA. */}
          <p className="mt-2 font-mono text-[10px] text-muted">
            credentials ref is a POINTER into the secrets manager — never the password itself
          </p>
          <div className="mt-4 flex gap-2">
            <Action
              busy={busy}
              disabled={email.trim().length === 0}
              onClick={() =>
                run(() =>
                  api.recordProvider(client.ClientID, {
                    managed_email: email.trim(),
                    external_account_id: external.trim() || undefined,
                    credentials_ref: ref.trim() || undefined,
                  }),
                )
              }
            >
              Save
            </Action>
            <button
              onClick={() => setForm(false)}
              className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {client.AssigneeName == null && (
            <Action busy={busy} onClick={() => run(() => api.claimOnboarding(client.ClientID))}>
              Claim
            </Action>
          )}
          <button
            onClick={() => setForm(true)}
            className="rounded-full border border-subtle px-4 py-2 text-sm text-ink transition-colors duration-300 hover:border-ink/30"
          >
            {client.ManagedEmail ? "Edit accounts" : "Add accounts"}
          </button>
          {client.ManagedEmail != null && !verified && (
            <Action busy={busy} onClick={() => run(() => api.verifyProvider(client.ClientID))}>
              Mark verified
            </Action>
          )}
          {verified && client.Status !== "awaiting_client_check" && (
            <Action busy={busy} onClick={() => run(() => api.submitForCheck(client.ClientID))}>
              Send to client
            </Action>
          )}
          {client.Status === "awaiting_client_check" && (
            <span className="self-center font-mono text-[11px] uppercase tracking-[0.16em] text-indigo-ink">
              waiting on them
            </span>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Recording a trained twin. One button per half still missing — a half that
 * is already done has nothing left to press.
 *
 * Shown on twin rows ONLY. They used to sit on every row, including clients
 * who had not been given a mailbox yet, which offered an action that made no
 * sense at that step.
 */
function TwinButtons({
  client,
  busy,
  run,
}: {
  client: OnboardingClient;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const missing = (["avatar", "voice"] as const).filter((kind) =>
    kind === "avatar" ? !client.AvatarReady : !client.VoiceReady,
  );
  // Named after the client, the way it would read in their studio account.
  const first = client.DisplayName.split(/[ ·]/)[0] ?? client.DisplayName;
  return (
    <>
      {missing.map((kind) => (
        <Action
          key={kind}
          busy={busy}
          onClick={() =>
            run(() =>
              api.markTwinReady(client.ClientID, {
                kind,
                name: kind === "avatar" ? `${first} — main look` : `${first} — natural`,
              }),
            )
          }
        >
          {kind === "avatar" ? "Avatar ready" : "Voice ready"}
        </Action>
      ))}
    </>
  );
}

function Pip({ done, label }: { done: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
        done ? "bg-success/10 text-success-ink" : "bg-warm/70 text-muted"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${done ? "bg-success-ink" : "bg-muted/50"}`}
      />
      {label}
    </li>
  );
}

function Action({
  busy,
  disabled,
  onClick,
  children,
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={busy || disabled}
      onClick={onClick}
      className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors duration-300 hover:bg-accent-2 disabled:opacity-40"
    >
      {busy ? "…" : children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-[9px] border border-subtle bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-muted/50 focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function hoursSince(iso: string): number {
  return (Date.now() - Date.parse(iso)) / 3_600_000;
}
