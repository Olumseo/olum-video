// Error types shared by the mock and HTTP implementations.
//
// Defined once, in one file, so `err instanceof QuotaError` works no matter
// which implementation produced it. Two parallel definitions would make that
// check silently false in one mode — the sort of bug that only appears when
// you switch from fixtures to the real API.
//
// Distinct types, not one Error with a code, because the UI reacts differently
// to each: a 401 sends the user to sign-in, a quota limit explains a plan rule,
// anything else offers a retry.

/** The session is missing, expired, or rejected. Send the user to sign in. */
export class UnauthorizedError extends Error {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Authenticated, but not entitled to the video product. */
export class ForbiddenError extends Error {
  constructor(message = "You don't have access to the video product.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** The thing asked for does not exist. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * A plan limit blocked the action.
 *
 * A RULE being applied, not something going wrong — so the UI states the limit
 * plainly rather than showing a failure the user cannot act on.
 */
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}
