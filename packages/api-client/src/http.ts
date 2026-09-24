// The real HTTP client, implementing the same interface as the mock.
//
// Every method here is backed by a live endpoint in video-service and
// documented in its openapi/openapi.yaml. Switching between this and the
// fixtures is VITE_API_MODE, nothing more.

import { dpopFetch } from "./dpop";
import { withRefresh } from "./refresh";
import type {
  Brief,
  ConfirmSetupRequest,
  CreateBriefRequest,
  MarkTwinReadyRequest,
  OnboardingClient,
  Readiness,
  RecordProviderRequest,
  TwinRequestResult,
  Account,
  AttachVersionRequest,
  CreateVideoRequest,
  Entitlement,
  RequestUploadRequest,
  RequestReworkRequest,
  StaffClient,
  Ticket,
  UploadTicket,
  Video,
  Agency,
  TeamMember,
  TeamInvite,
  TeamRole,
  InviteResult,
  InvitePreview,
  EditorAssignment,
  EditorWorkload,
  QueueCounts,
  PublishVideoRequest,
  Lead,
  Me,
} from "./types";
import type { Api } from "./mock/client";
import {
  ForbiddenError,
  NotFoundError,
  NotReadyError,
  QuotaError,
  UnauthorizedError,
} from "./errors";

const BASE = "/api/v1/video";

/**
 * Turns a response into a typed error, or its parsed body.
 *
 * Status codes are mapped to distinct error types rather than one generic
 * failure, because the UI must react differently to each: 401 sends the user
 * to sign-in, 429 explains a plan limit, 500 offers a retry. Collapsing them
 * into `Error` pushes that decision into string-matching at the call site.
 */
async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    // 204 has no body; calling .json() on it throws.
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  let message = "";
  let blocker = "";
  try {
    const body = (await res.json()) as {
      message?: string;
      detail?: string;
      blocker?: string;
    };
    message = body.message ?? body.detail ?? "";
    blocker = body.blocker ?? "";
  } catch {
    /* non-JSON error body */
  }

  switch (res.status) {
    case 401:
      throw new UnauthorizedError();
    case 403:
      throw new ForbiddenError(message || undefined);
    case 404:
      throw new NotFoundError(message || "Not found.");
    case 409:
      // Onboarding is not finished. NOT a 403: the user has paid and is
      // allowed, so "not on your plan" would be wrong and unactionable. The
      // blocker names the step that is actually waiting.
      throw new NotReadyError(message || undefined, blocker);
    case 429:
      throw new QuotaError(message || "You've reached your plan's limit.");
    default:
      throw new Error(message || `Request failed (${res.status}).`);
  }
}

// Both verbs go through withRefresh, so an expired session is renewed in place
// instead of throwing the user out. The closure is what makes the retry legal:
// it builds a NEW request, with a new DPoP proof, since a proof's jti is
// single-use and replaying one is rejected.
function get<T>(path: string): Promise<T> {
  return withRefresh(() => dpopFetch(`${BASE}${path}`)).then((r) => handle<T>(r));
}

function post<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  // Generated OUTSIDE the closure on purpose. If the retry made a new key the
  // server would treat it as a second, unrelated action — so a refresh in the
  // middle of "create video" could charge two videos of quota. The whole point
  // of the header is that both attempts are recognised as one intent.
  const key = idempotencyKey;
  return withRefresh(() =>
    dpopFetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Every mutation carries one. A request that times out and is retried
        // must not consume two videos' worth of quota — the server matches on
        // this key and returns the original result.
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: JSON.stringify(body),
    }),
  ).then((r) => handle<T>(r));
}

/** A key that is stable for one user action and unique across actions. */
function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export const httpApi: Api = {
  getMe: () => get<Me>("/me"),

  getAccount: () => get<Account>("/account"),
  getEntitlement: () => get<Entitlement>("/entitlement"),

  listVideos: () => get<Video[]>("/videos"),
  getVideo: (id: string) => get<Video>(`/videos/${encodeURIComponent(id)}`),

  createVideo: (req: CreateVideoRequest) => post<Video>("/videos", req, newIdempotencyKey()),

  requestRework: (req: RequestReworkRequest) =>
    post<Video>(
      `/videos/${encodeURIComponent(req.video_id)}/rework`,
      { version_id: req.version_id, body: req.body },
      newIdempotencyKey(),
    ),

  approveVideo: (id: string) =>
    post<Video>(`/videos/${encodeURIComponent(id)}/approve`, {}, newIdempotencyKey()),

  requestUpload: (req: RequestUploadRequest) =>
    post<UploadTicket>("/uploads", req, newIdempotencyKey()),

  /**
   * PUTs the file straight to storage, reporting progress.
   *
   * XMLHttpRequest, not fetch: fetch still cannot report UPLOAD progress in
   * any browser (its streaming request bodies are download-side only). A
   * 500MB upload with no progress bar looks frozen, and users cancel it.
   *
   * No DPoP proof and no credentials here — the pre-signed URL carries its
   * own authorisation, and sending cookies to a storage host would leak the
   * session outside our origin.
   */
  uploadFile: (ticket: UploadTicket, file: File, onProgress?: (percent: number) => void) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", ticket.upload_url, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        // lengthComputable is false for chunked bodies; reporting NaN% would
        // render a broken bar, so skip the update instead.
        if (e.lengthComputable) onProgress?.((e.loaded / e.total) * 100);
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed (${xhr.status}).`));
      xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
      xhr.onabort = () => reject(new Error("Upload cancelled."));
      xhr.send(file);
    }),

  attachVersion: (req: AttachVersionRequest) =>
    post<Video>(
      `/videos/${encodeURIComponent(req.video_id)}/versions`,
      { asset_id: req.asset_id, trigger: req.trigger, note: req.note },
      newIdempotencyKey(),
    ),

  listTickets: () => get<Ticket[]>("/staff/tickets"),

  // Every video in the caller's organisation. NOT listVideos, which is the
  // signed-in person's own client account.
  listStaffVideos: () => get<Video[]>("/staff/videos"),

  // Landing-page sign-ups — olum's staff only.
  listLeads: () => get<Lead[]>("/staff/leads"),
  markLeadContacted: (id: string) =>
    post<{ status: string }>(`/staff/leads/${encodeURIComponent(id)}/contacted`, {}, newIdempotencyKey()),

  publishVideo: (id: string, req: PublishVideoRequest) =>
    post<Video>(`/staff/videos/${encodeURIComponent(id)}/publish`, req, newIdempotencyKey()),
  listClients: () => get<StaffClient[]>("/staff/clients"),

  // ── onboarding, twins and briefs ──────────────────────────────────────────

  getReadiness: () => get<Readiness>("/readiness"),

  confirmSetup: (req: ConfirmSetupRequest) =>
    post<Readiness>("/onboarding/confirm", req, newIdempotencyKey()),

  requestTwin: () => post<TwinRequestResult>("/twin-requests", {}, newIdempotencyKey()),

  listBriefs: () => get<Brief[]>("/briefs"),
  getBrief: (id: string) => get<Brief>(`/briefs/${encodeURIComponent(id)}`),

  createBrief: (req: CreateBriefRequest) => post<Brief>("/briefs", req, newIdempotencyKey()),

  // ── staff ─────────────────────────────────────────────────────────────────

  listOnboarding: () => get<OnboardingClient[]>("/staff/onboarding"),

  claimOnboarding: (clientId: string) =>
    post<{ status: string }>(
      `/staff/clients/${encodeURIComponent(clientId)}/claim`, {}, newIdempotencyKey()),

  recordProvider: (clientId: string, req: RecordProviderRequest) =>
    post<{ status: string }>(
      `/staff/clients/${encodeURIComponent(clientId)}/provider`, req, newIdempotencyKey()),

  verifyProvider: (clientId: string) =>
    post<{ status: string }>(
      `/staff/clients/${encodeURIComponent(clientId)}/verify`, {}, newIdempotencyKey()),

  submitForCheck: (clientId: string) =>
    post<{ status: string }>(
      `/staff/clients/${encodeURIComponent(clientId)}/submit`, {}, newIdempotencyKey()),

  markTwinReady: (clientId: string, req: MarkTwinReadyRequest) =>
    post<{ status: string }>(
      `/staff/clients/${encodeURIComponent(clientId)}/twin`, req, newIdempotencyKey()),

  listPendingBriefs: () => get<Brief[]>("/staff/briefs"),
  getStaffBrief: (id: string) => get<Brief>(`/staff/briefs/${encodeURIComponent(id)}`),

  writeBrief: (id: string, body: string) =>
    post<{ status: string }>(
      `/staff/briefs/${encodeURIComponent(id)}/write`, { body }, newIdempotencyKey()),

  // Staff HAND OVER; they no longer approve. `body` is optional: sending it
  // saves the edit and hands over in one action, which is what the review
  // screen does.
  sendBriefToClient: (id: string, body?: string) =>
    post<{ status: string }>(
      `/staff/briefs/${encodeURIComponent(id)}/send`,
      body === undefined ? {} : { body },
      newIdempotencyKey()),

  // ── the CLIENT's decision ────────────────────────────────────────────────
  approveBrief: (id: string) =>
    post<{ status: string; video_id: string }>(
      `/briefs/${encodeURIComponent(id)}/approve`, {}, newIdempotencyKey()),

  requestScriptChanges: (id: string, note: string) =>
    post<{ status: string }>(
      `/briefs/${encodeURIComponent(id)}/changes`, { note }, newIdempotencyKey()),

  requestBriefChanges: (id: string, reason: string) =>
    post<{ status: string }>(
      `/staff/briefs/${encodeURIComponent(id)}/changes`, { reason }, newIdempotencyKey()),

  rejectBrief: (id: string, reason: string) =>
    post<{ status: string }>(
      `/staff/briefs/${encodeURIComponent(id)}/reject`, { reason }, newIdempotencyKey()),

  assignTicket: (ticketId: string, staffId: string) =>
    post<{ status: string }>(
      `/staff/tickets/${encodeURIComponent(ticketId)}/assign`,
      { staff_id: staffId }, newIdempotencyKey()),

  // ── editors ──────────────────────────────────────────────────────────────
  listMyAssignments: () => get<EditorAssignment[]>("/staff/my-work"),
  listEditors: () => get<EditorWorkload[]>("/staff/editors"),
  getQueueCounts: () => get<QueueCounts>("/staff/counts"),

  // ── agencies ─────────────────────────────────────────────────────────────
  registerAgency: (name: string) =>
    post<Agency>("/agency", { name }, newIdempotencyKey()),

  getMyAgency: () => get<{ agency: Agency | null }>("/agency"),

  getTeam: () => get<{ members: TeamMember[]; invites: TeamInvite[] }>("/agency/team"),

  inviteMember: (email: string, position: string, role: TeamRole) =>
    post<InviteResult>("/agency/team/invites",
      { email, position, role }, newIdempotencyKey()),

  revokeInvite: (id: string) =>
    post<{ status: string }>(
      `/agency/team/invites/${encodeURIComponent(id)}/revoke`, {}, newIdempotencyKey()),

  // No session required — the invitee does not have one yet.
  peekInvite: (token: string) =>
    get<InvitePreview>(`/agency/invites/peek?token=${encodeURIComponent(token)}`),

  acceptInvite: (token: string, name: string) =>
    post<Agency>("/agency/join", { token, name }, newIdempotencyKey()),
};
