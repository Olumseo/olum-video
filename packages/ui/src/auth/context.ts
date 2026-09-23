import { createContext } from "react";
import type { Account, StaffIdentity } from "@olum-video/api-client";

/**
 * Session state.
 *
 * Four states, not a boolean, because the UI must do something different in
 * each. Collapsing "loading" into "signed out" is what makes an app flash a
 * login screen for half a second on every reload.
 *
 * # WHY `account` IS NULLABLE NOW
 *
 * Being signed in and having a video subscription are different facts, and
 * conflating them broke the staff portal the moment agencies existed: an
 * agency's owner has a staff row and no subscription of their own, so the old
 * "call /account and read the 403" check told them to go and buy the product
 * they are employed to operate. olum's own employees only escaped it because
 * the dev fixtures give them a client row as well.
 *
 * So "authenticated" now means "we know who you are", and each app says what
 * it additionally needs — see RequireSession's `requires`.
 */
export type Session =
  | { status: "loading" }
  | {
      status: "authenticated";
      /** Their customer account. null when they have never subscribed. */
      account: Account | null;
      /** Their staff record. null when they do not work here. */
      staff: StaffIdentity | null;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden"; reason: string };

export const SessionContext = createContext<Session>({ status: "loading" });
