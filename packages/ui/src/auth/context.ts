import { createContext } from "react";
import type { Account } from "@olum-video/api-client";

/**
 * Session state.
 *
 * Four states, not a boolean, because the UI must do something different in
 * each. Collapsing "loading" into "signed out" is what makes an app flash a
 * login screen for half a second on every reload.
 */
export type Session =
  | { status: "loading" }
  | { status: "authenticated"; account: Account }
  | { status: "unauthenticated" }
  | { status: "forbidden"; reason: string };

export const SessionContext = createContext<Session>({ status: "loading" });
