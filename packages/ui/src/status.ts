// How a video's status is presented.
//
// Clients and staff get DIFFERENT labels for the same status on purpose. A
// client should never read "internal_qa" — that is our workflow leaking into
// their product. Staff, meanwhile, need the precise stage to do their job.

import type { Tone } from "./components/Badge";

type Presentation = { label: string; tone: Tone };

const CLIENT: Record<string, Presentation> = {
  script_approved: { label: "Script approved", tone: "neutral" },
  gen_queued: { label: "In production", tone: "progress" },
  gen_running: { label: "In production", tone: "progress" },
  gen_failed: { label: "We're on it", tone: "attention" },
  gen_done: { label: "In production", tone: "progress" },
  internal_qa: { label: "In production", tone: "progress" },
  edit_queued: { label: "Being edited", tone: "progress" },
  edit_running: { label: "Being edited", tone: "progress" },
  client_review: { label: "Ready for you", tone: "attention" },
  rework_requested: { label: "Changes requested", tone: "attention" },
  approved: { label: "Approved", tone: "good" },
  publish_queued: { label: "Publishing", tone: "progress" },
  published: { label: "Published", tone: "good" },
  quota_exhausted: { label: "Limit reached", tone: "bad" },
  canceled: { label: "Cancelled", tone: "neutral" },
};

const STAFF: Record<string, Presentation> = {
  script_approved: { label: "script approved", tone: "neutral" },
  gen_queued: { label: "gen queued", tone: "progress" },
  gen_running: { label: "gen running", tone: "progress" },
  gen_failed: { label: "gen FAILED", tone: "bad" },
  gen_done: { label: "gen done", tone: "progress" },
  internal_qa: { label: "internal QA", tone: "attention" },
  edit_queued: { label: "edit queued", tone: "attention" },
  edit_running: { label: "edit running", tone: "progress" },
  client_review: { label: "with client", tone: "neutral" },
  rework_requested: { label: "rework", tone: "bad" },
  approved: { label: "approved", tone: "good" },
  publish_queued: { label: "publish queued", tone: "progress" },
  published: { label: "published", tone: "good" },
  quota_exhausted: { label: "quota exhausted", tone: "bad" },
  canceled: { label: "cancelled", tone: "neutral" },
};

const UNKNOWN: Presentation = { label: "Unknown", tone: "neutral" };

/**
 * A status we have never seen must not crash the page.
 *
 * The backend can add an enum value and deploy before the frontend does. That
 * is normal, and it should degrade to a plain label — not a blank screen.
 */
export function presentStatus(status: string, audience: "client" | "staff"): Presentation {
  const table = audience === "client" ? CLIENT : STAFF;
  return table[status] ?? UNKNOWN;
}
