// ─────────────────────────────────────────────────────────────────────────────
//  TEMPORARY hand-written types.
//
//  DELETE THIS FILE once the Go service emits an OpenAPI spec. Everything here
//  is re-exported from src/index.ts, so replacing it with generated types is an
//  import swap in ONE file, not a hunt through every component.
//
//  Field names mirror the `video` schema so the eventual generated types line
//  up rather than needing a translation layer.
// ─────────────────────────────────────────────────────────────────────────────

/** Every state a video can be in. Mirrors the `video_status` enum. */
export type VideoStatus =
  | "script_approved"
  | "gen_queued"
  | "gen_running"
  | "gen_failed"
  | "gen_done"
  | "internal_qa"
  | "edit_queued"
  | "edit_running"
  | "client_review"
  | "rework_requested"
  | "approved"
  | "publish_queued"
  | "published"
  | "quota_exhausted"
  | "canceled";

/** How a version came to exist. Only `client_redo` is billable. */
export type VersionTrigger = "initial" | "client_redo" | "internal_fix";
export type VersionSource = "heygen" | "editor";

export type ScriptStatus = "drafting" | "pending_client" | "approved" | "rejected";
export type TicketType = "script" | "avatar" | "voice" | "video_gen" | "edit" | "issue";
export type TicketStatus = "open" | "in_progress" | "blocked" | "done" | "canceled";
export type AssetStatus = "training" | "ready" | "failed";

export interface Script {
  id: string;
  prompt: string;
  body: string | null;
  status: ScriptStatus;
  created_at: string;
}

export interface VideoVersion {
  id: string;
  video_id: string;
  version_no: number;
  source: VersionSource;
  trigger: VersionTrigger;
  /** True only for a client-requested redo. Internal fixes are free. */
  billable: boolean;
  status: VideoStatus;
  /** Playable URL, absent until the version has an asset attached. */
  asset_url: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface RevisionNote {
  id: string;
  video_version_id: string;
  author_type: "client" | "staff" | "system";
  author_name: string;
  body: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  status: VideoStatus;
  script: Script;
  versions: VideoVersion[];
  notes: RevisionNote[];
  /** Snapshotted from the plan when the video was created. */
  regen_limit: number;
  regens_used: number;
  created_at: string;
  updated_at: string;
}

/** What the client is allowed to do right now. */
export interface Entitlement {
  product: "premium_video" | "ultimate";
  active: boolean;
  daily_video_limit: number;
  videos_used_today: number;
  /** ISO timestamp when the daily allowance resets, in the client's timezone. */
  resets_at: string;
}

export interface Avatar {
  id: string;
  name: string;
  status: AssetStatus;
}

export interface Voice {
  id: string;
  name: string;
  status: AssetStatus;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatars: Avatar[];
  voices: Voice[];
}

// ── Staff-facing ─────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  type: TicketType;
  status: TicketStatus;
  priority: number;
  client_id: string;
  client_name: string;
  subject_id: string;
  subject_title: string;
  assignee_name: string | null;
  sla_due_at: string | null;
  created_at: string;
}

export interface StaffClient {
  id: string;
  name: string;
  email: string;
  plan: string;
  videos_in_flight: number;
  status: "active" | "suspended" | "closed";
}

// ── Requests ─────────────────────────────────────────────────────────────────

export interface CreateVideoRequest {
  title: string;
  /** Exactly one of these. A prompt means we write the script. */
  prompt?: string;
  script_body?: string;
}

export interface RequestReworkRequest {
  video_id: string;
  version_id: string;
  body: string;
}

// ── Uploads ──────────────────────────────────────────────────────────────────

/**
 * A short-lived, pre-signed URL for uploading one file straight to storage.
 *
 * The bytes NEVER pass through video-service. Streaming a 500MB file through
 * a Go handler would hold a connection and a chunk of memory for the whole
 * upload, and at 100 concurrent users that is how a small service falls over.
 * The client PUTs directly to S3; we only hand out the permission and record
 * the result.
 */
export interface UploadTicket {
  /** PUT the file body here. Expires — do not cache it. */
  upload_url: string;
  /** Opaque handle to give back to us once the PUT succeeds. */
  asset_id: string;
  /** Seconds until upload_url stops working. */
  expires_in: number;
}

export interface RequestUploadRequest {
  filename: string;
  content_type: string;
  size_bytes: number;
  /** What this file is for. Decides where it lands and who may read it. */
  purpose: "avatar_source" | "video_version";
}

/** Attaches an uploaded file to a video as a new version. Staff only. */
export interface AttachVersionRequest {
  video_id: string;
  asset_id: string;
  /**
   * Why this version exists. Drives billing: only `client_redo` is billable,
   * enforced by a CHECK constraint in the database.
   */
  trigger: VersionTrigger;
  note?: string;
}
