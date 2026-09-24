// Silent session refresh.
//
// # THE PROBLEM THIS SOLVES
//
// The access token expires. Without this, the first request after expiry 401s,
// the app shows "please sign in", and the user loses whatever they were doing —
// on olum.ai that is a 24h cliff that every user hits, every day.
//
// authservice already issues a refresh token beside the access token, and the
// main olum.ai SPA already trades it in transparently. These apps did not, so
// they were the only part of the product that logged you out for no reason.
//
// # WHY THIS IS NOT A COPY OF olum.ai's VERSION
//
// One deliberate difference, and it is the whole reason this file has comments.
//
// olum.ai builds its refresh request with `dpopHeaderSafe`, which returns {}
// when a proof cannot be produced. That is right FOR olum.ai: authservice
// treats a missing proof as "issue an unbound token", and the main SPA still
// works with one, so a proof failure degrades the binding instead of breaking
// the app.
//
// video-service does NOT accept an unbound token. Its verifier requires a
// cnf.jkt claim and rejects the token outright when it is missing. So if we
// refreshed without a proof we would trade a WORKING expired session for a
// permanently rejected one: signed in, every request 401ing, and no way out
// except clearing cookies. That is strictly worse than the expiry we set out
// to fix.
//
// So this uses the strict `dpopHeader`. If the device cannot produce a proof,
// the refresh FAILS and the user signs in again — annoying, and correct.

import { dpopHeader } from "./dpop";

// authservice scopes the refresh cookie to path=/api/v1/auth. A request to any
// other path simply will not carry it, so this URL is not a free choice — it
// has to sit under that prefix or the server sees no refresh token at all.
const REFRESH_URL = "/api/v1/auth/token/refresh";

/** Fired when the session is gone for good, so shells can react. */
export const AUTH_LOGOUT_EVENT = "auth:logout";

// This package is imported by tests and could be imported by a server renderer,
// neither of which has a window. Reaching for one unguarded turned an expected
// 401 into "ReferenceError: window is not defined" — the failure stopped being
// the one the caller was handling, which is the worst kind of breakage.
const hasDOM = typeof window !== "undefined";

function announceLogout(): void {
  if (hasDOM) window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

let inFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  if (!hasDOM) return false;
  try {
    const url = new URL(REFRESH_URL, window.location.origin).href;
    const res = await fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Strict, not best-effort — see the note at the top of this file.
        // A throw here is the correct outcome: it aborts the refresh rather
        // than obtaining a token this service will never accept.
        ...(await dpopHeader("POST", url)),
      },
      // authservice reads the token from the cookie; the body is tolerated but
      // must be present and valid JSON, or FastAPI answers 422.
      body: "{}",
    });

    if (!res.ok) return false;

    // A 200 is not on its own proof that authservice answered. A dev server or
    // a misrouted proxy can return the SPA's index.html with a 200, which would
    // look like a successful refresh and send us into a pointless retry. The
    // real endpoint always answers JSON.
    const type = res.headers.get("content-type") ?? "";
    return type.includes("application/json");
  } catch {
    // Offline, blocked IndexedDB, no WebCrypto, or no authservice at all (which
    // is the normal case on a laptop). All of them mean the same thing here.
    return false;
  }
}

/**
 * Refresh at most once, however many callers ask at once.
 *
 * Screens fire several requests in parallel on mount. Without this, an expired
 * token means every one of them refreshes independently — a burst of identical
 * calls, and with refresh-token rotation all but the winner would be spending
 * an already-spent token and failing.
 */
export function refreshSession(): Promise<boolean> {
  if (!inFlight) {
    inFlight = performRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * Run a request; on 401, refresh once and run it again.
 *
 * `fn` must build a FRESH request each time. A Request object cannot be sent
 * twice — its body is a stream that is consumed on the first send — and the
 * retry needs a new DPoP proof anyway, since `jti` is single-use and the server
 * remembers it. Replaying the first proof would be rejected as a replay.
 */
export async function withRefresh(fn: () => Promise<Response>): Promise<Response> {
  const res = await fn();
  if (res.status !== 401) return res;

  if (!(await refreshSession())) {
    // Tell the app the session is over. Returning the original 401 keeps the
    // caller's error handling unchanged — this only adds a signal on the way
    // past, it does not swallow the failure.
    announceLogout();
    return res;
  }

  // Exactly one retry. A loop here would hammer the API with a token the
  // server has already refused, and would turn one bad session into a
  // self-inflicted outage.
  return fn();
}
