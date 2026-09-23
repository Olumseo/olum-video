import { useContext } from "react";
import type { Account, StaffIdentity } from "@olum-video/api-client";

import { SessionContext, type Session } from "./context";

/** The current session. */
export function useSession(): Session {
  return useContext(SessionContext);
}

/** The signed-in customer account, or null. For components that want a name. */
export function useAccount(): Account | null {
  const session = useSession();
  return session.status === "authenticated" ? session.account : null;
}

/** The signed-in staff record, or null when the viewer does not work here. */
export function useStaff(): StaffIdentity | null {
  const session = useSession();
  return session.status === "authenticated" ? session.staff : null;
}
