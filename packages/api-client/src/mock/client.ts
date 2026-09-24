// A stand-in for the real API, with the same method signatures the generated
// client will have. Components call `api.listVideos()` either way, so swapping
// to the real implementation touches src/index.ts and nothing else.
//
// Every method is async and delayed on purpose. An API that resolves instantly
// hides loading states, and loading states that were never exercised in
// development are always broken in production.

import type {
  Account,
  AttachVersionRequest,
  PublishVideoRequest,
  Lead,
  CreateVideoRequest,
  Entitlement,
  RequestUploadRequest,
  RequestReworkRequest,
  StaffClient,
  Ticket,
  UploadTicket,
  Video,
  VideoVersion,
} from "../types";
import * as fixtures from "./data";
import { onboardingMock } from "./onboarding";
import { agencyMock } from "./agency";
import { NotFoundError, QuotaError } from "../errors";

const latency = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/** Mutable copy so writes during a session are visible on later reads. */
let videos: Video[] = structuredClone(fixtures.videos);
let leads: Lead[] = structuredClone(fixtures.leads);

export const mockApi = {
  async getAccount(): Promise<Account> {
    await latency(200);
    return structuredClone(fixtures.account);
  },

  async getEntitlement(): Promise<Entitlement> {
    await latency(200);
    return structuredClone(fixtures.entitlement);
  },

  async listVideos(): Promise<Video[]> {
    await latency();
    return structuredClone(videos);
  },

  async getVideo(id: string): Promise<Video> {
    await latency();
    const found = videos.find((v) => v.id === id);
    if (!found) throw new NotFoundError(`No video ${id}`);
    return structuredClone(found);
  },

  async createVideo(req: CreateVideoRequest): Promise<Video> {
    await latency(600);
    const created: Video = {
      id: `vid_${Math.random().toString(36).slice(2, 8)}`,
      title: req.title,
      status: "gen_queued",
      regen_limit: 2,
      regens_used: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      script: {
        id: `sc_${Math.random().toString(36).slice(2, 8)}`,
        prompt: req.prompt ?? "",
        body: req.script_body ?? null,
        status: req.script_body ? "approved" : "drafting",
        created_at: new Date().toISOString(),
      },
      versions: [],
      notes: [],
      publications: [],
      brief_id: null,
    };
    videos = [created, ...videos];
    return structuredClone(created);
  },

  async requestRework(req: RequestReworkRequest): Promise<Video> {
    await latency(500);
    const video = videos.find((v) => v.id === req.video_id);
    if (!video) throw new NotFoundError(`No video ${req.video_id}`);

    // The rule the database also enforces, via
    // CHECK (regens_used BETWEEN 0 AND regen_limit). Checking here too gives a
    // useful message instead of a constraint violation; the DB stays the
    // backstop for when this check has a bug.
    if (video.regens_used >= video.regen_limit) {
      throw new QuotaError("You've used both revisions for this video.");
    }

    video.regens_used += 1;
    video.status = "rework_requested";
    video.updated_at = new Date().toISOString();
    video.notes = [
      {
        id: `rn_${Math.random().toString(36).slice(2, 8)}`,
        video_version_id: req.version_id,
        author_type: "client",
        author_name: "You",
        body: req.body,
        created_at: new Date().toISOString(),
      },
      ...video.notes,
    ];
    return structuredClone(video);
  },

  async approveVideo(id: string): Promise<Video> {
    await latency(500);
    const video = videos.find((v) => v.id === id);
    if (!video) throw new NotFoundError(`No video ${id}`);
    video.status = "approved";
    video.updated_at = new Date().toISOString();
    return structuredClone(video);
  },

  async requestUpload(req: RequestUploadRequest): Promise<UploadTicket> {
    await latency(300);
    return {
      // A blob: URL nothing will actually PUT to. Enough for the UI to run
      // its full path without inventing a fake S3.
      upload_url: `blob:mock-upload/${req.purpose}`,
      asset_id: `as_${Math.random().toString(36).slice(2, 10)}`,
      expires_in: 900,
    };
  },

  /**
   * Simulates the direct-to-storage PUT, reporting progress as it goes.
   *
   * Progress is faked in steps rather than resolving instantly, because a
   * progress bar that only ever shows 0% then 100% hides every bug in the
   * component that draws it.
   */
  async uploadFile(
    _ticket: UploadTicket,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await latency(120);
      onProgress?.((i / steps) * 100);
    }
    void file;
  },

  async attachVersion(req: AttachVersionRequest): Promise<Video> {
    await latency(500);
    const video = videos.find((v) => v.id === req.video_id);
    if (!video) throw new NotFoundError(`No video ${req.video_id}`);

    const nextNo = (video.versions[0]?.version_no ?? 0) + 1;
    const version: VideoVersion = {
      id: `vv_${Math.random().toString(36).slice(2, 8)}`,
      video_id: video.id,
      version_no: nextNo,
      source: "editor",
      trigger: req.trigger,
      // The rule the database also enforces via
      // CHECK (billable = (trigger = 'client_redo')).
      billable: req.trigger === "client_redo",
      status: "client_review",
      asset_url: `https://example.invalid/${req.asset_id}.mp4`,
      duration_ms: 60_000,
      created_at: new Date().toISOString(),
    };

    video.versions = [version, ...video.versions];
    video.status = "client_review";
    video.updated_at = new Date().toISOString();
    if (req.note) {
      video.notes = [
        {
          id: `rn_${Math.random().toString(36).slice(2, 8)}`,
          video_version_id: version.id,
          author_type: "staff",
          author_name: "You (staff)",
          body: req.note,
          created_at: new Date().toISOString(),
        },
        ...video.notes,
      ];
    }
    return structuredClone(video);
  },

  async listStaffVideos(): Promise<Video[]> {
    await latency();
    return structuredClone(videos).map((v) => ({ ...v, client_name: "Northwind Co" }));
  },

  async publishVideo(id: string, req: PublishVideoRequest): Promise<Video> {
    await latency(500);
    const video = videos.find((v) => v.id === id);
    if (!video) throw new NotFoundError(`No video ${id}`);
    // The rule the server enforces in the transaction: only what the client
    // approved goes out.
    if (!["approved", "publish_queued", "published"].includes(video.status)) {
      throw new Error("That has already moved on. Reload and try again.");
    }
    video.publications = [
      {
        platform: req.platform,
        status: "published",
        public_url: req.url,
        published_at: new Date().toISOString(),
      },
      ...video.publications.filter((p) => p.platform !== req.platform),
    ];
    video.status = "published";
    video.updated_at = new Date().toISOString();
    return structuredClone(video);
  },

  async listLeads(): Promise<Lead[]> {
    await latency();
    return structuredClone(leads);
  },

  async markLeadContacted(id: string): Promise<{ status: string }> {
    await latency(300);
    leads = leads.map((l) =>
      l.id === id
        ? { ...l, status: "contacted", contacted_by: "You", contacted_at: new Date().toISOString() }
        : l,
    );
    return { status: "contacted" };
  },

  async listTickets(): Promise<Ticket[]> {
    await latency();
    return structuredClone(fixtures.tickets);
  },

  async listClients(): Promise<StaffClient[]> {
    await latency();
    return structuredClone(fixtures.staffClients);
  },

  // Onboarding, twins and briefs live in their own module: they share their
  // own mutable state and need a way to be PUT into each state for demos.
  ...onboardingMock,

  // Agencies, teams and the editor's own queue.
  ...agencyMock,
};

export type Api = typeof mockApi;
