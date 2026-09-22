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

// ─────────────────────────────────────────────────────────────────────────────
//  Onboarding, digital twins and briefs.
//
//  A client is not usable the moment they pay: a person has to create their
//  mailbox and studio account, they cross-check it, and they need a digital
//  twin before any video can exist. See video-service/DESIGN-GUIDE.md.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The first unmet step, in the order the client experiences them.
 *
 * Ordered deliberately: telling someone their twin is not ready when their
 * account is not even verified sends them to the wrong place.
 */
export type Blocker =
  | ""
  | "no_entitlement"
  | "awaiting_managed_email"
  | "awaiting_provider_account"
  | "awaiting_provider_verification"
  | "awaiting_client_confirmation"
  | "awaiting_digital_twin";

export type ClientStatus =
  | ""
  | "pending_provisioning"
  | "provisioning"
  | "awaiting_client_check"
  | "active"
  | "suspended"
  | "closed";

/**
 * What, if anything, is blocking this client from making a video.
 *
 * The API refuses `createBrief` on exactly this answer, which is why the UI
 * must read it rather than deriving its own version — two implementations
 * drift, and the failure is a button the API then refuses.
 */
export interface Readiness {
  ready: boolean;
  blocker: Blocker;
  /** The blocker, phrased for a person. */
  message: string;
  client_status: ClientStatus;
  entitled: boolean;
  email_created: boolean;
  provider_created: boolean;
  provider_verified: boolean;
  twin_ready: boolean;
  client_confirmed: boolean;
}

export type BriefStatus =
  | "generating"
  | "ready_for_staff"
  | "generation_failed"
  | "approved"
  | "rejected";

/** The "context page": a prompt, what we know, and the draft staff approve. */
export interface Brief {
  id: string;
  client_id: string;
  title: string;
  prompt: string;
  /** A SNAPSHOT taken when the brief was created, not a live reference. */
  context: Record<string, unknown>;
  body: string | null;
  status: BriefStatus;
  rounds: number;
  max_rounds: number;
  failure_reason: string | null;
  /** Set once approved and turned into a video. */
  video_id: string | null;
  /** Staff views only. */
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBriefRequest {
  title: string;
  prompt: string;
}

export interface ConfirmSetupRequest {
  confirmed: boolean;
  /** Required when confirmed is false — otherwise staff cannot act on it. */
  reason?: string;
}

export interface TwinRequestResult {
  status: string;
  /** False when a request was already open. */
  created: boolean;
  message: string;
}

/** One row of the staff provisioning queue. Go field names, not snake_case. */
export interface OnboardingClient {
  ClientID: string;
  UserID: string;
  DisplayName: string;
  Status: ClientStatus;
  ManagedEmail: string | null;
  ExternalID: string | null;
  Verification: string | null;
  TicketID: string | null;
  /** Null means nobody has claimed it. */
  AssigneeName: string | null;
  CreatedAt: string;
}

export interface RecordProviderRequest {
  managed_email: string;
  external_account_id?: string;
  credentials_ref?: string;
}

export interface MarkTwinReadyRequest {
  kind: "avatar" | "voice";
  external_id?: string;
  name?: string;
}
