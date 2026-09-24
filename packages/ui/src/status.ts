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

// ── briefs ──────────────────────────────────────────────────────────────────
//
// Three screens each kept their own copy of this map, which is how
// `awaiting_client_approval` came to be missing from all three at once when
// the state was added. One table, two audiences, same rule as videos.

/** A brief presentation carries whose turn it is, because that is the
 *  question every one of these screens is really answering. */
export type BriefPresentation = Presentation & {
  /** Whose move it is. Drives the "needs you" emphasis. */
  turn: "client" | "staff" | "none";
  /** One line of plain English for a detail page. */
  detail: string;
};

const BRIEF_CLIENT: Record<string, BriefPresentation> = {
  generating: {
    label: "Being written",
    tone: "progress",
    turn: "staff",
    detail: "We're turning your idea into a script. You'll get it to approve shortly.",
  },
  ready_for_staff: {
    label: "With our team",
    tone: "progress",
    turn: "staff",
    detail: "Our team is polishing the script. Nothing needed from you yet.",
  },
  awaiting_client_approval: {
    label: "Needs your OK",
    tone: "attention",
    turn: "client",
    detail: "Here's the script. Approve it and we'll make the video, or tell us what to change.",
  },
  generation_failed: {
    label: "We're on it",
    tone: "attention",
    turn: "staff",
    detail: "Something went wrong at our end. It hasn't cost you anything — we're redoing it.",
  },
  approved: {
    label: "Approved",
    tone: "good",
    turn: "none",
    detail: "You approved this script. The video is being made.",
  },
  rejected: {
    label: "Not going ahead",
    tone: "neutral",
    turn: "none",
    detail: "This request was closed. Your video allowance was returned.",
  },
};

const BRIEF_STAFF: Record<string, BriefPresentation> = {
  generating: {
    label: "Needs writing",
    tone: "attention",
    turn: "staff",
    detail: "Nobody has written this yet.",
  },
  ready_for_staff: {
    label: "Ready to send",
    tone: "attention",
    turn: "staff",
    detail: "Draft written. Review it, then send it to the client.",
  },
  awaiting_client_approval: {
    label: "With client",
    tone: "neutral",
    turn: "client",
    detail: "Sent. Waiting on the client to approve or ask for changes.",
  },
  generation_failed: {
    label: "Generation failed",
    tone: "bad",
    turn: "staff",
    detail: "Generation failed and the client's quota was returned.",
  },
  approved: {
    label: "Approved",
    tone: "good",
    turn: "none",
    detail: "The client approved it. A video was created.",
  },
  rejected: { label: "Rejected", tone: "neutral", turn: "none", detail: "Closed, quota returned." },
};

const BRIEF_UNKNOWN: BriefPresentation = {
  label: "Unknown",
  tone: "neutral",
  turn: "none",
  detail: "",
};

/** Same degradation rule as presentStatus: an unknown state must not blank
 *  the page just because the backend deployed first. */
export function presentBrief(status: string, audience: "client" | "staff"): BriefPresentation {
  const table = audience === "client" ? BRIEF_CLIENT : BRIEF_STAFF;
  return table[status] ?? BRIEF_UNKNOWN;
}

// ── platforms ────────────────────────────────────────────────────────────────

/**
 * Where a video can go live, as people write it.
 *
 * One table for both apps: the staff member picks "Instagram" and the client
 * reads "Live on Instagram" — the same word on both sides of the handoff.
 */
export const PLATFORMS = [
  { id: "instagram", name: "Instagram" },
  { id: "youtube", name: "YouTube" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "tiktok", name: "TikTok" },
  { id: "x", name: "X" },
] as const;

export function platformName(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}
