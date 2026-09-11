import { useEffect, useState, type ReactNode } from "react";
import { api, ForbiddenError, UnauthorizedError } from "@olum-video/api-client";

import { SessionContext, type Session } from "./context";

/**
 * Establishes who the viewer is, once, at the top of the app.
 *
 * There is deliberately NO login form here. Sign-in happens on olum.ai's own
 * pages, which own the Firebase flow and the token exchange; these apps only
 * ever consume the session cookie that flow produced. Rebuilding sign-in would
 * mean a second implementation of the trickiest security path in the product.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    api.getAccount().then(
      (account) => {
        if (!cancelled) setSession({ status: "authenticated", account });
      },
      (err: unknown) => {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) {
          setSession({ status: "unauthenticated" });
        } else if (err instanceof ForbiddenError) {
          // Signed in, but not entitled to video. A distinct state: sending
          // this user to sign in again would loop them forever, since signing
          // in is not the problem.
          setSession({ status: "forbidden", reason: err.message });
        } else {
          // A network blip must not look like being signed out — that would
          // bounce the user to a login page they do not need.
          setSession({ status: "unauthenticated" });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
