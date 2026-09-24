// Fixture implementations of the onboarding, twin and brief endpoints.
//
// A separate module from client.ts because these share their own mutable
// state and, unlike the video fixtures, they need a way to be *put* into each
// state for demos — see `__setMockReadiness`.

import type {
  Brief,
  ConfirmSetupRequest,
  CreateBriefRequest,
  MarkTwinReadyRequest,
  OnboardingClient,
  Readiness,
  RecordProviderRequest,
  TwinRequestResult,
} from "../types";
import * as fixtures from "./data";
import { NotFoundError, NotReadyError } from "../errors";

const latency = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/** Mutable copies, so writes during a session are visible on later reads. */
let briefs: Brief[] = structuredClone(fixtures.briefs);
let onboarding: OnboardingClient[] = structuredClone(fixtures.onboardingQueue);
let readiness: Readiness = structuredClone(fixtures.readiness);
let twinRequested = false;

/**
 * Keeps `ready` and `blocker` consistent with the individual flags, exactly
 * the way the server derives them.
 *
 * Letting fixtures drift from that rule would teach the UI to trust a
 * combination the API can never actually produce — and that is the class of
 * bug you only find in production.
 */
function recompute(r: Readiness): Readiness {
  const steps: [boolean, Readiness["blocker"], string][] = [
    [r.entitled, "no_entitlement", "Video isn't on your plan yet."],
    [r.email_created, "awaiting_managed_email", "We're setting up your olum video mailbox."],
    [r.provider_created, "awaiting_provider_account", "We're creating your video studio account."],
    [
      r.provider_verified,
      "awaiting_provider_verification",
      "Your studio account is being verified.",
    ],
    [
      r.client_confirmed,
      "awaiting_client_confirmation",
      "Please confirm your setup to finish activating your account.",
    ],
    [
      r.twin_ready,
      "awaiting_digital_twin",
      r.twin_requested
        ? "You've asked for your digital twin. An executive will be in touch to book the recording."
        : "Your digital twin isn't ready yet. Request one to get started.",
    ],
  ];
  const unmet = steps.find(([ok]) => !ok);
  return unmet
    ? { ...r, ready: false, blocker: unmet[1], message: unmet[2] }
    : { ...r, ready: true, blocker: "", message: "" };
}

/**
 * Puts the fixture client into a chosen onboarding state.
 *
 * Fixtures default to a FULLY onboarded client, because the everyday screen is
 * the one most people are looking at. But the half-finished states are the
 * ones with the interesting layout, so they have to be reachable without a
 * backend: `/video/setup?state=awaiting_digital_twin`.
 */
export function setMockReadiness(blocker: Readiness["blocker"]): void {
  const order: Readiness["blocker"][] = [
    "no_entitlement",
    "awaiting_managed_email",
    "awaiting_provider_account",
    "awaiting_provider_verification",
    "awaiting_client_confirmation",
    "awaiting_digital_twin",
  ];
  const at = order.indexOf(blocker);
  if (at < 0) return;
  readiness = recompute({
    ...readiness,
    entitled: at > 0,
    email_created: at > 1,
    provider_created: at > 2,
    provider_verified: at > 3,
    client_confirmed: at > 4,
    twin_ready: at > 5,
    client_status: at > 4 ? "active" : at > 3 ? "awaiting_client_check" : "provisioning",
    twin_requested: false,
  });
  twinRequested = false;
}

export const onboardingMock = {
  async getReadiness(): Promise<Readiness> {
    await latency(200);
    return structuredClone(readiness);
  },

  async confirmSetup(req: ConfirmSetupRequest): Promise<Readiness> {
    await latency();
    readiness = recompute({
      ...readiness,
      client_confirmed: req.confirmed,
      client_status: req.confirmed ? "active" : "provisioning",
    });
    return structuredClone(readiness);
  },

  async requestTwin(): Promise<TwinRequestResult> {
    await latency();
    const already = twinRequested;
    twinRequested = true;
    readiness = recompute({ ...readiness, twin_requested: true });
    return {
      status: "requested",
      created: !already,
      message: "An executive will be in touch to record your avatar and voice.",
    };
  },

  async listBriefs(): Promise<Brief[]> {
    await latency();
    return structuredClone(briefs);
  },

  async getBrief(id: string): Promise<Brief> {
    await latency();
    const brief = briefs.find((b) => b.id === id);
    if (!brief) throw new NotFoundError("That brief doesn't exist.");
    return structuredClone(brief);
  },

  async createBrief(req: CreateBriefRequest): Promise<Brief> {
    await latency(500);
    if (!readiness.ready) {
      // Mirrors the API's 409. A mock that always succeeds hides the branch
      // that matters most — the one where the client is blocked.
      throw new NotReadyError(readiness.message, readiness.blocker);
    }
    // A supplied script skips generation, exactly as the server does: the
    // words already exist, so it opens in front of staff with the body set.
    const wroteItThemselves = Boolean(req.script?.trim());

    const brief: Brief = {
      id: `b-${Date.now()}`,
      client_id: fixtures.account.id,
      title: req.title,
      prompt: req.prompt,
      context: structuredClone(fixtures.briefs[0]!.context),
      body: wroteItThemselves ? req.script!.trim() : null,
      status: wroteItThemselves ? "ready_for_staff" : "generating",
      rounds: 0,
      max_rounds: 2,
      failure_reason: null,
      video_id: null,
      source: wroteItThemselves ? "script" : "prompt",
      sent_to_client_at: null,
      client_decided_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    briefs = [brief, ...briefs];
    return structuredClone(brief);
  },

  // ── staff ─────────────────────────────────────────────────────────────────

  async listOnboarding(): Promise<OnboardingClient[]> {
    await latency();
    return structuredClone(onboarding);
  },

  async claimOnboarding(clientId: string): Promise<{ status: string }> {
    await latency();
    onboarding = onboarding.map((c) =>
      c.ClientID === clientId
        ? { ...c, Status: "provisioning" as const, AssigneeName: "You" }
        : c,
    );
    return { status: "claimed" };
  },

  async recordProvider(
    clientId: string,
    req: RecordProviderRequest,
  ): Promise<{ status: string }> {
    await latency();
    onboarding = onboarding.map((c) =>
      c.ClientID === clientId
        ? {
            ...c,
            ManagedEmail: req.managed_email,
            ExternalID: req.external_account_id ?? c.ExternalID,
            Verification: c.Verification ?? "invited",
          }
        : c,
    );
    return { status: "recorded" };
  },

  async verifyProvider(clientId: string): Promise<{ status: string }> {
    await latency();
    onboarding = onboarding.map((c) =>
      c.ClientID === clientId ? { ...c, Verification: "verified" } : c,
    );
    return { status: "verified" };
  },

  async submitForCheck(clientId: string): Promise<{ status: string }> {
    await latency();
    onboarding = onboarding.map((c) =>
      c.ClientID === clientId ? { ...c, Status: "awaiting_client_check" as const } : c,
    );
    return { status: "awaiting_client_check" };
  },

  async markTwinReady(
    clientId: string,
    req: MarkTwinReadyRequest,
  ): Promise<{ status: string }> {
    await latency();
    onboarding = onboarding
      .map((c) =>
        c.ClientID === clientId
          ? {
              ...c,
              AvatarReady: c.AvatarReady || req.kind === "avatar",
              VoiceReady: c.VoiceReady || req.kind === "voice",
            }
          : c,
      )
      // Both halves done: the request is closed and the row leaves the queue,
      // as it does on the server.
      .filter((c) => !(c.Status === "active" && c.AvatarReady && c.VoiceReady));
    return { status: "ready" };
  },

  async listPendingBriefs(): Promise<Brief[]> {
    await latency();
    return structuredClone(
      briefs.filter((b) => b.status !== "approved" && b.status !== "rejected"),
    );
  },

  async getStaffBrief(id: string): Promise<Brief> {
    await latency();
    const brief = briefs.find((b) => b.id === id);
    if (!brief) throw new NotFoundError("That brief doesn't exist.");
    return structuredClone(brief);
  },

  async writeBrief(id: string, body: string): Promise<{ status: string }> {
    await latency();
    briefs = briefs.map((b) =>
      b.id === id ? { ...b, body, status: "ready_for_staff" as const } : b,
    );
    return { status: "ready_for_staff" };
  },

  // Staff hand the script over. The mock enforces the same rule the server
  // does — ready_for_staff goes to the CLIENT, not straight to approved —
  // because a mock that allows an illegal transition teaches the UI a flow
  // the API will reject.
  async sendBriefToClient(id: string, body?: string): Promise<{ status: string }> {
    await latency();
    briefs = briefs.map((b) =>
      b.id === id
        ? {
            ...b,
            body: body ?? b.body,
            status: "awaiting_client_approval" as const,
            sent_to_client_at: new Date().toISOString(),
          }
        : b,
    );
    return { status: "awaiting_client_approval" };
  },

  async approveBrief(id: string): Promise<{ status: string; video_id: string }> {
    await latency();
    const videoId = `v-${Date.now()}`;
    briefs = briefs.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "approved" as const,
            video_id: videoId,
            client_decided_at: new Date().toISOString(),
          }
        : b,
    );
    return { status: "approved", video_id: videoId };
  },

  async requestScriptChanges(id: string, note: string): Promise<{ status: string }> {
    await latency();
    briefs = briefs.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "ready_for_staff" as const,
            rounds: b.rounds + 1,
            sent_to_client_at: null,
            failure_reason: note,
          }
        : b,
    );
    return { status: "ready_for_staff" };
  },

  async requestBriefChanges(id: string, reason: string): Promise<{ status: string }> {
    await latency();
    briefs = briefs.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "generating" as const,
            rounds: b.rounds + 1,
            failure_reason: reason,
          }
        : b,
    );
    return { status: "generating" };
  },

  async rejectBrief(id: string, reason: string): Promise<{ status: string }> {
    await latency();
    briefs = briefs.map((b) =>
      b.id === id ? { ...b, status: "rejected" as const, failure_reason: reason } : b,
    );
    return { status: "rejected" };
  },

  async assignTicket(_ticketId: string, _staffId: string): Promise<{ status: string }> {
    await latency();
    return { status: "assigned" };
  },
};
