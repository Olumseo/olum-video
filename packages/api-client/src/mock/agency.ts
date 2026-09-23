// Fixture implementations of the agency and editor endpoints.
//
// Its own module for the same reason as onboarding.ts: shared mutable state,
// and these need to be demonstrable without a backend.
//
// The fixtures deliberately describe an AGENCY, not olum, because the rule
// worth seeing on screen is that an agency serves only its own clients. A
// fixture set with no agency in it renders identically whether or not the
// scoping works.

import type {
  Agency,
  EditorAssignment,
  EditorWorkload,
  InvitePreview,
  InviteResult,
  QueueCounts,
  TeamInvite,
  TeamMember,
  TeamRole,
  Me,
} from "../types";
import * as fixtures from "./data";
import { NotFoundError } from "../errors";

const latency = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const agency: Agency = {
  id: "ag100000-0000-4000-8000-000000000001",
  name: "Northwind Agency",
  owner_user_id: "aaaaaaaa-0000-4000-8000-000000000001",
  created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
};

let members: TeamMember[] = [
  {
    staff_id: "st100000-0000-4000-8000-000000000001",
    user_id: "aaaaaaaa-0000-4000-8000-000000000001",
    name: "Priya Raman",
    position: "Owner",
    roles: ["admin", "employee"],
    is_owner: true,
    active: true,
  },
  {
    staff_id: "st100000-0000-4000-8000-000000000002",
    user_id: "aaaaaaaa-0000-4000-8000-000000000002",
    name: "Sam Okafor",
    position: "Script writer & editor",
    roles: ["editor", "employee"],
    is_owner: false,
    active: true,
  },
  {
    staff_id: "st100000-0000-4000-8000-000000000003",
    user_id: "aaaaaaaa-0000-4000-8000-000000000004",
    name: "Dana Liu",
    position: "Account manager",
    roles: ["employee"],
    is_owner: false,
    active: true,
  },
];

let invites: TeamInvite[] = [
  {
    id: "iv100000-0000-4000-8000-000000000001",
    email: "newjoiner@example.com",
    position: "Junior editor",
    role: "editor",
    expires_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    accepted_at: null,
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

const assignments: EditorAssignment[] = [
  {
    ticket_id: "tk100000-0000-4000-8000-000000000001",
    ticket_type: "edit",
    ticket_status: "in_progress",
    priority: 2,
    video_id: "vid_01",
    title: "Meet the practice",
    video_status: "edit_running",
    client_id: "c1000000-0000-4000-8000-000000000009",
    client_name: "Lumen Dental",
    sla_due_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    assigned_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    ticket_id: "tk100000-0000-4000-8000-000000000002",
    ticket_type: "video_gen",
    ticket_status: "open",
    priority: 3,
    video_id: "vid_02",
    title: "Teeth whitening explained",
    video_status: "gen_queued",
    client_id: "c1000000-0000-4000-8000-000000000009",
    client_name: "Lumen Dental",
    // Deliberately overdue, so the "late" styling is exercised. A fixture set
    // where nothing is ever late means that branch ships untested.
    sla_due_at: new Date(Date.now() - 86_400_000).toISOString(),
    assigned_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
  },
];

export const agencyMock = {
  // Fixture identity: staff of an agency, with no subscription of their own.
  // That combination is the one the old /account-based check got wrong, so it
  // is the one the fixtures describe.
  async getMe(): Promise<Me> {
    await latency(200);
    return {
      user_id: agency.owner_user_id,
      account: structuredClone(fixtures.account),
      staff: {
        id: members[0]!.staff_id,
        name: members[0]!.name,
        roles: members[0]!.roles,
        position: members[0]!.position,
        agency_id: agency.id,
        agency_name: agency.name,
      },
    };
  },

  async getMyAgency(): Promise<{ agency: Agency | null }> {
    await latency(200);
    return { agency: structuredClone(agency) };
  },

  async registerAgency(name: string): Promise<Agency> {
    await latency();
    return { ...structuredClone(agency), name };
  },

  async getTeam(): Promise<{ members: TeamMember[]; invites: TeamInvite[] }> {
    await latency();
    return { members: structuredClone(members), invites: structuredClone(invites) };
  },

  async inviteMember(email: string, position: string, role: TeamRole): Promise<InviteResult> {
    await latency();
    if (invites.some((i) => i.email === email.toLowerCase() && !i.accepted_at)) {
      // Mirrors the server's 409. A mock that always succeeds hides the
      // duplicate-invite branch entirely.
      throw new Error("There's already an open invite for that address.");
    }
    const token = `mock-${Math.random().toString(36).slice(2, 10)}`;
    const invite: TeamInvite = {
      id: `iv-${Date.now()}`,
      email: email.toLowerCase(),
      position: position || null,
      role,
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      accepted_at: null,
      created_at: new Date().toISOString(),
      token,
    };
    invites = [invite, ...invites];
    return { invite, link: `${window.location.origin}/video/join?token=${token}` };
  },

  async revokeInvite(id: string): Promise<{ status: string }> {
    await latency();
    invites = invites.filter((i) => i.id !== id);
    return { status: "revoked" };
  },

  async peekInvite(token: string): Promise<InvitePreview> {
    await latency(200);
    if (!token) throw new NotFoundError("This invite link has expired.");
    return { agency_name: agency.name, position: "Junior editor", role: "editor" };
  },

  async acceptInvite(_token: string, name: string): Promise<Agency> {
    await latency();
    members = [
      ...members,
      {
        staff_id: `st-${Date.now()}`,
        user_id: `u-${Date.now()}`,
        name,
        position: "Junior editor",
        roles: ["editor"],
        is_owner: false,
        active: true,
      },
    ];
    return structuredClone(agency);
  },

  async listMyAssignments(): Promise<EditorAssignment[]> {
    await latency();
    return structuredClone(assignments);
  },

  async listEditors(): Promise<EditorWorkload[]> {
    await latency();
    return members
      .filter((m) => m.roles.includes("editor"))
      .map((m) => ({
        staff_id: m.staff_id,
        name: m.name,
        position: m.position,
        open: m.staff_id.endsWith("02") ? 2 : 0,
        in_flight: m.staff_id.endsWith("02") ? 1 : 0,
      }));
  },

  async getQueueCounts(): Promise<QueueCounts> {
    await latency(200);
    return {
      onboarding: 2,
      briefs_to_write: 3,
      awaiting_client: 1,
      videos_to_produce: 4,
      my_assignments: assignments.length,
      unassigned: 2,
    };
  },
};
