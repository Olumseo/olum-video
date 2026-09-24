/**
 * Local sign-in. Development builds only.
 *
 * # WHY THIS EXISTS
 *
 * There is no authservice on a laptop, so until now "signing in" meant a
 * three-step manual ceremony: read the DPoP thumbprint out of the browser
 * console, run a CLI to mint a token bound to it, paste a `document.cookie`
 * line back. Per developer, per browser profile, and again whenever the token
 * expired.
 *
 * That is not a login flow, it is a workaround, and it made the product
 * impossible to simply open and click through.
 *
 * # WHY IT IS SAFE
 *
 * `import.meta.env.DEV` is a compile-time constant. In a production build the
 * bundler evaluates it to `false`, the branch is dead, and this component and
 * everything it imports are dropped from the output. It is not hidden at
 * runtime — it is absent.
 *
 * The backend half is gated independently, on `APP_ENV=development`. Two
 * unrelated locks, either of which is sufficient.
 *
 * # WHY IT STILL USES DPoP
 *
 * It sends the thumbprint of the key the browser already holds, and the server
 * binds the token to it exactly as authservice would. A dev login that skipped
 * DPoP would be easier and would hide the entire class of bug this service is
 * most likely to have — a mismatched key, a proof that does not verify, a
 * token with no `cnf.jkt`. Those must fail here the same way they fail in
 * production.
 *
 * # WHY SIGNING IN HERE SIGNS YOU OUT OF THE OTHER APP
 *
 * Cookies are scoped to a HOST, not a host:port — :5200 and :5201 share one
 * `access_token`. DPoP keys live in IndexedDB, which IS per-origin, so the two
 * ports hold DIFFERENT keys.
 *
 * So the last port to sign in owns the cookie, and that cookie is bound to
 * that port's key. The other port sends the same cookie with a proof signed by
 * its own key, the `cnf.jkt` does not match, and it 401s — correctly.
 *
 * This is an artefact of running two dev servers, not a flaw in the design. In
 * production both apps are served from https://olum.ai: one origin, one key,
 * one cookie, and the question disappears. Rather than weaken the binding to
 * paper over it, the screen just says so.
 */

import { useState } from "react";
import { thumbprint } from "@olum-video/api-client";

/**
 * The seeded personas.
 *
 * Every onboarding state is reachable by signing in as a different user, which
 * is the only way to exercise the setup screens without hand-editing the
 * database between clicks.
 *
 * These ids are seeded by `./dev.sh seed`. A persona whose row is missing
 * still signs in — you just land on whatever state that user is actually in,
 * which is usually "no entitlement".
 */
const PERSONAS: { id: string; label: string; detail: string }[] = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    label: "Ready client",
    detail: "Arjun, daily AI news — a cut waiting on him, a script to OK, videos live",
  },
  {
    id: "cccccccc-0000-4000-8000-000000000001",
    label: "Ready client — news desk",
    detail: "Kabir, world affairs — one video approved and waiting to go live",
  },
  {
    id: "dddddddd-0000-4000-8000-000000000001",
    label: "Just subscribed",
    detail: "Paid, nothing provisioned — the setup screen, step 1",
  },
  {
    id: "dddddddd-0000-4000-8000-000000000002",
    label: "Awaiting your check",
    detail: "Staff finished; the cross-check is yours to do",
  },
  {
    id: "dddddddd-0000-4000-8000-000000000003",
    label: "Needs a twin",
    detail: "Active, no twin yet — request one and watch it reach the staff queue",
  },
  {
    id: "eeeeeeee-0000-4000-8000-000000000009",
    label: "olum staff — admin",
    detail: "Sees olum's own queue. Use this for the staff portal",
  },
  {
    id: "eeeeeeee-0000-4000-8000-00000000000e",
    label: "olum staff — editor",
    detail: "Has videos assigned — the “on your desk” screen",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    label: "Agency owner",
    detail: "Northwind Media — manages a team and their own clients",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000002",
    label: "Agency editor",
    detail: "On Northwind's team — sees only their clients",
  },
  {
    id: "aaaaaaaa-0000-4000-8000-000000000003",
    label: "An agency's client",
    detail: "Maya, future of work — signed up through Northwind, so her work goes there",
  },
];

export function DevSignIn() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(userId: string) {
    setError(null);
    setBusy(userId);
    try {
      // The thumbprint of the key already in IndexedDB — the same key the
      // production login would bind to, and the same one dpopFetch signs
      // every later request with.
      const jkt = await thumbprint();

      const res = await fetch("/api/v1/video/dev/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The server sets an httpOnly cookie, so the token never touches JS —
        // the same mechanism as production, which is the point.
        credentials: "include",
        body: JSON.stringify({ jkt, user_id: userId }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Sign-in failed (${res.status}).`);
      }

      // Reload rather than re-fetching the session in place: every screen
      // derives from the session, and a full reload is the honest way to prove
      // the cookie works on a cold load.
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the API. Is the backend running on :8098?",
      );
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        Local development
      </p>
      <h1 className="mt-4 font-serif text-3xl">Sign in as…</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        There&rsquo;s no authservice on a laptop, so pick a seeded user. Each one
        sits at a different point in the flow.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        The last four exist to make the agency rule visible: an agency&rsquo;s
        client is served by that agency&rsquo;s staff, never by olum&rsquo;s. Sign
        in as each and compare the queues.
      </p>

      <p className="mt-4 rounded-card border border-subtle bg-ink/[0.03] px-4 py-3 text-[13px] leading-relaxed text-muted">
        <span className="text-ink">Signing in here signs you out of the other
        port.</span> localhost shares one cookie across :5200 and :5201, but each
        origin holds its own DPoP key &mdash; so a cookie only works on the port
        that minted it. In production both apps are one origin and this
        doesn&rsquo;t happen.
      </p>

      <ul className="mt-8 space-y-2">
        {PERSONAS.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => signIn(p.id)}
              disabled={busy !== null}
              className="w-full rounded-card border border-subtle bg-paper px-5 py-4 text-left transition-colors duration-300 hover:border-ink/30 disabled:opacity-50"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-[15px] text-ink">{p.label}</span>
                {busy === p.id && (
                  <span className="font-mono text-[11px] text-muted">signing in…</span>
                )}
              </span>
              <span className="mt-1 block text-[13px] text-muted">{p.detail}</span>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <div className="mt-6 rounded-card border border-danger-ink/30 bg-danger/10 px-5 py-4">
          <p className="text-[14px] text-ink">{error}</p>
          <p className="mt-1 text-[13px] text-muted">
            Check the API is up: <code className="font-mono">curl localhost:8098/healthz</code>
          </p>
        </div>
      )}

      <p className="mt-8 font-mono text-[11px] leading-relaxed text-muted">
        This screen does not exist in a production build — `import.meta.env.DEV`
        is a compile-time constant, so the bundler drops it entirely.
      </p>
    </div>
  );
}
