import { useContext } from "react";
import type { Account } from "@olum-video/api-client";

import { SessionContext, type Session } from "./context";

/** The current session. */
export function useSession(): Session {
  return useContext(SessionContext);
}

/** The signed-in account, or null. For components that just want a name. */
export function useAccount(): Account | null {
  const session = useSession();
  return session.status === "authenticated" ? session.account : null;
}
