// Public surface of the API client.
//
// Apps import from here and nowhere else, so swapping the mock for real HTTP is
// one environment variable rather than an edit in every component.

import { mockApi, type Api } from "./mock/client";
import { httpApi } from "./http";

export * from "./types";
export type { Api };

export {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  NotReadyError,
  QuotaError,
} from "./errors";

export { dpopFetch, dpopHeader, dpopHeaderSafe, thumbprint } from "./dpop";

// Session refresh. AUTH_LOGOUT_EVENT fires on the window when a refresh has
// failed and the session is genuinely over, so a shell can react once instead
// of every screen discovering it separately.
export { withRefresh, refreshSession, AUTH_LOGOUT_EVENT } from "./refresh";

/**
 * Which implementation the apps talk to.
 *
 * Defaults to the mock, because video-service has no endpoints beyond health
 * probes yet — pointing at HTTP today would give every screen a 404. Set
 * `VITE_API_MODE=http` once the endpoints exist.
 *
 * Read at module load, not per call: a value that could change mid-session
 * would make one screen's data real and the next screen's fake.
 */
const mode = import.meta.env.VITE_API_MODE ?? "mock";

export const api: Api = mode === "http" ? httpApi : mockApi;

/** True when the app is running against fixtures, so the UI can say so. */
export const isMockApi = mode !== "http";

/**
 * Fixture-only: put the mock client into a chosen onboarding state.
 *
 * Exported so the setup screen can be demoed at every step without a backend
 * (`/video/setup?state=awaiting_digital_twin`). A no-op against the real API,
 * which is why it is safe to leave in the bundle.
 */
export { setMockReadiness } from "./mock/onboarding";
