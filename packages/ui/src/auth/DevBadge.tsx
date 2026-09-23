/**
 * "You are signed in as X — switch". Development builds only.
 *
 * Without it, changing persona means opening devtools and clearing site data,
 * which is the same manual ceremony the dev sign-in screen exists to remove.
 * Half a login flow is not a login flow.
 *
 * Dropped from production builds for the same reason as DevSignIn:
 * `import.meta.env.DEV` is a compile-time constant, so the branch and this
 * component disappear from the bundle rather than being hidden at runtime.
 */

import { useState } from "react";
import { useAccount } from "./useSession";

export function DevBadge() {
  const account = useAccount();
  const [busy, setBusy] = useState(false);

  async function switchUser() {
    setBusy(true);
    try {
      await fetch("/api/v1/video/dev/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Clearing the cookie is best-effort: if the API is down there is
      // nothing to sign out of anyway, and reloading will show the sign-in
      // screen regardless.
    }
    window.location.reload();
  }

  return (
    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
      <span
        aria-hidden
        title="development build"
        className="h-1.5 w-1.5 rounded-full bg-amber"
      />
      <span className="hidden sm:inline">{account?.name ?? "signed in"}</span>
      <button
        onClick={switchUser}
        disabled={busy}
        className="underline decoration-dotted underline-offset-2 transition-colors hover:text-ink disabled:opacity-50"
      >
        {busy ? "…" : "switch"}
      </button>
    </span>
  );
}
