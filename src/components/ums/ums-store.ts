import { useSyncExternalStore } from "react";
import type { PermissionSet } from "@/lib/permissions";

/**
 * ums-store — in-memory prototype store for the User Management module.
 *
 * FabAds runs as a demo prototype (auto-login + mock data across the app,
 * see src/mocks/shared/*). UMS follows the same approach: members, teams,
 * roles, invites, and client assignments all live here, seeded with
 * realistic data. No Supabase, no migration. Module-level store with the
 * subscribe/getSnapshot pattern already used by userBrandsStore.ts.
 * Survives navigation, resets on reload.
 */

export type LegacyRole = "owner" | "admin" | "member";

export interface Role {
  id: string;
  workspaceId: string | null;
  key: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionSet;
}

export interface Member {
  id: string;
  email: string;
  fullName: string | null;
  roleEnum: LegacyRole;
  roleId: string | null;
  joinedAt: string;
  clientIds: string[];
}

export interface Invite {
  id: string;
  email: string;
  roleEnum: LegacyRole;
  roleId: string | null;
  invitedByEmail: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface Team {
  id: string;
  workspaceId: string | null;
  name: string;
  about: string | null;
  teamLeadUserId: string | null;
  memberIds: string[];
  clientIds: string[];
  createdAt: string;
}

export interface UmsClient {
  id: string;
  name: string;
}

/** owner/admin keep their enum; everything else (member, team_lead, custom) → member. */
export function roleEnumForKey(key: string | null): LegacyRole {
  if (key === "owner") return "owner";
  if (key === "admin") return "admin";
  return "member";
}

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

const PERM_FULL: PermissionSet = {
  members: { actions: ["view", "edit", "create", "delete"], scope: "all" },
  teams: { actions: ["view", "edit", "create", "delete"], scope: "all" },
  clients: { actions: ["view", "assign"], scope: "all" },
  roles: { actions: ["view", "edit", "create", "delete"], scope: "all" },
};

const PERM_MEMBER: PermissionSet = {
  members: { actions: ["view"], scope: "all" },
  teams: { actions: ["view"], scope: "all" },
  clients: { actions: ["view"], scope: "all" },
  roles: { actions: [], scope: "all" },
};

const PERM_LEAD: PermissionSet = {
  members: { actions: ["view"], scope: "all" },
  teams: { actions: ["view", "edit"], scope: "own" },
  clients: { actions: ["view", "assign"], scope: "own" },
  roles: { actions: [], scope: "all" },
};

const SEED_ROLES: Role[] = [
  {
    id: "role-owner",
    workspaceId: null,
    key: "owner",
    name: "Owner",
    description:
      "Full access to all administrative functions. This role cannot be deleted and its permissions cannot be edited.",
    isSystem: true,
    permissions: PERM_FULL,
  },
  {
    id: "role-admin",
    workspaceId: null,
    key: "admin",
    name: "Admin",
    description: "Can manage members, teams, and roles across the workspace.",
    isSystem: true,
    permissions: PERM_FULL,
  },
  {
    id: "role-member",
    workspaceId: null,
    key: "member",
    name: "Member",
    description: "Standard workspace member with view access.",
    isSystem: true,
    permissions: PERM_MEMBER,
  },
  {
    id: "role-lead",
    workspaceId: null,
    key: "team_lead",
    name: "Team Lead",
    description:
      "Member-level access plus the ability to manage their own team's members and clients.",
    isSystem: true,
    permissions: PERM_LEAD,
  },
];

const SEED_CLIENTS: UmsClient[] = [
  { id: "cl-acme", name: "Acme Co" },
  { id: "cl-zenith", name: "Zenith Retail" },
  { id: "cl-nova", name: "Nova Foods" },
  { id: "cl-pulse", name: "PulseFit" },
];

const SEED_MEMBERS: Member[] = [
  {
    id: "mem-rahul",
    email: "rahulsaini@ideaclan.com",
    fullName: "Rahul Saini",
    roleEnum: "owner",
    roleId: "role-owner",
    joinedAt: "2026-01-12T09:00:00.000Z",
    clientIds: ["cl-acme", "cl-zenith"],
  },
  {
    id: "mem-aisha",
    email: "aisha.khan@ideaclan.com",
    fullName: "Aisha Khan",
    roleEnum: "admin",
    roleId: "role-admin",
    joinedAt: "2026-02-03T09:00:00.000Z",
    clientIds: ["cl-nova"],
  },
  {
    id: "mem-vikram",
    email: "vikram.rao@ideaclan.com",
    fullName: "Vikram Rao",
    roleEnum: "member",
    roleId: "role-lead",
    joinedAt: "2026-02-20T09:00:00.000Z",
    clientIds: ["cl-acme"],
  },
  {
    id: "mem-neha",
    email: "neha.gupta@ideaclan.com",
    fullName: "Neha Gupta",
    roleEnum: "member",
    roleId: "role-member",
    joinedAt: "2026-03-11T09:00:00.000Z",
    clientIds: [],
  },
  {
    id: "mem-sam",
    email: "sam.patel@ideaclan.com",
    fullName: "Sam Patel",
    roleEnum: "member",
    roleId: "role-member",
    joinedAt: "2026-04-01T09:00:00.000Z",
    clientIds: ["cl-pulse"],
  },
];

const SEED_TEAMS: Team[] = [
  {
    id: "team-perf",
    workspaceId: null,
    name: "Performance Marketing",
    about: "Paid acquisition across Meta & Google.",
    teamLeadUserId: "mem-vikram",
    memberIds: ["mem-vikram", "mem-neha"],
    clientIds: ["cl-acme", "cl-zenith"],
    createdAt: "2026-02-25T09:00:00.000Z",
  },
  {
    id: "team-creative",
    workspaceId: null,
    name: "Creative Studio",
    about: "Ad creative production and brand.",
    teamLeadUserId: "mem-aisha",
    memberIds: ["mem-aisha", "mem-sam"],
    clientIds: ["cl-nova"],
    createdAt: "2026-03-05T09:00:00.000Z",
  },
];

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const SEED_INVITES: Invite[] = [
  {
    id: "inv-priya",
    email: "priya.menon@partner.com",
    roleEnum: "member",
    roleId: "role-member",
    invitedByEmail: "rahulsaini@ideaclan.com",
    createdAt: new Date(now - 2 * DAY).toISOString(),
    expiresAt: new Date(now + 5 * DAY).toISOString(),
  },
  {
    id: "inv-lead",
    email: "hunter@growthlab.com",
    roleEnum: "admin",
    roleId: "role-admin",
    invitedByEmail: "aisha.khan@ideaclan.com",
    createdAt: new Date(now - 12 * DAY).toISOString(),
    expiresAt: new Date(now - 5 * DAY).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Store state                                                        */
/* ------------------------------------------------------------------ */

let roles: Role[] = SEED_ROLES;
let members: Member[] = SEED_MEMBERS;
let invites: Invite[] = SEED_INVITES;
let teams: Team[] = SEED_TEAMS;
const clients: UmsClient[] = SEED_CLIENTS;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
  return `${prefix}-${rand}`;
}

/* ------------------------------------------------------------------ */
/*  Snapshots + hooks                                                  */
/* ------------------------------------------------------------------ */

export function useRolesSnapshot(): Role[] {
  return useSyncExternalStore(subscribe, () => roles, () => roles);
}
export function useMembersSnapshot(): Member[] {
  return useSyncExternalStore(subscribe, () => members, () => members);
}
export function useInvitesSnapshot(): Invite[] {
  return useSyncExternalStore(subscribe, () => invites, () => invites);
}
export function useTeamsSnapshot(): Team[] {
  return useSyncExternalStore(subscribe, () => teams, () => teams);
}
export function useClientsSnapshot(): UmsClient[] {
  return useSyncExternalStore(subscribe, () => clients, () => clients);
}

export function roleMemberCount(roleId: string): number {
  return members.filter((m) => m.roleId === roleId).length;
}

/* ------------------------------------------------------------------ */
/*  Mutations — members & invites                                      */
/* ------------------------------------------------------------------ */

/** True if the email already belongs to an active member (case/space-insensitive). */
export function isActiveMemberEmail(email: string): boolean {
  const n = email.trim().toLowerCase();
  return members.some((m) => m.email.trim().toLowerCase() === n);
}

export function inviteMember(email: string, roleId: string): Invite {
  const normalized = email.trim().toLowerCase();
  const role = roles.find((r) => r.id === roleId);
  const invite: Invite = {
    id: newId("inv"),
    email: normalized,
    roleId,
    roleEnum: roleEnumForKey(role?.key ?? null),
    invitedByEmail: "rahulsaini@ideaclan.com",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * DAY).toISOString(),
  };
  // Dedup pending invites by normalized email.
  invites = [...invites.filter((i) => i.email.trim().toLowerCase() !== normalized), invite];
  emit();
  return invite;
}

export function cancelInvite(id: string) {
  invites = invites.filter((i) => i.id !== id);
  emit();
}

export function resendInvite(id: string) {
  invites = invites.map((i) =>
    i.id === id ? { ...i, expiresAt: new Date(Date.now() + 7 * DAY).toISOString() } : i,
  );
  emit();
}

export function removeMember(id: string) {
  const target = members.find((m) => m.id === id);
  if (!target) return;
  // Never orphan the workspace — the last owner cannot be removed.
  const ownerCount = members.filter((m) => m.roleEnum === "owner").length;
  if (target.roleEnum === "owner" && ownerCount <= 1) return;

  members = members.filter((m) => m.id !== id);
  // Strip from team rosters AND clear any team they led (no ghost leads).
  teams = teams.map((t) => ({
    ...t,
    memberIds: t.memberIds.filter((mid) => mid !== id),
    teamLeadUserId: t.teamLeadUserId === id ? null : t.teamLeadUserId,
  }));
  emit();
}

export function assignClientsToMembers(memberIds: string[], clientIds: string[]) {
  members = members.map((m) =>
    memberIds.includes(m.id)
      ? { ...m, clientIds: Array.from(new Set([...m.clientIds, ...clientIds])) }
      : m,
  );
  emit();
}

export function assignRoleToMember(memberId: string, roleId: string) {
  const target = members.find((m) => m.id === memberId);
  // The owner's role is not reassignable — guards against orphaning the workspace.
  if (target?.roleEnum === "owner") return;
  const role = roles.find((r) => r.id === roleId);
  members = members.map((m) =>
    m.id === memberId ? { ...m, roleId, roleEnum: roleEnumForKey(role?.key ?? null) } : m,
  );
  emit();
}

/* ------------------------------------------------------------------ */
/*  Mutations — teams                                                  */
/* ------------------------------------------------------------------ */

export function addMemberToTeam(memberId: string, teamId: string) {
  teams = teams.map((t) => {
    if (t.id === teamId) {
      return { ...t, memberIds: Array.from(new Set([...t.memberIds, memberId])) };
    }
    // A member belongs to one team at a time — remove from others, EXCEPT a
    // team they lead (a lead must stay a member of their own team).
    if (t.teamLeadUserId === memberId) return t;
    return { ...t, memberIds: t.memberIds.filter((mid) => mid !== memberId) };
  });
  emit();
}

export interface TeamInput {
  name: string;
  about: string | null;
  teamLeadUserId: string;
  memberIds: string[];
  clientIds: string[];
}

export function createTeam(input: TeamInput): Team {
  const team: Team = {
    id: newId("team"),
    workspaceId: null,
    name: input.name,
    about: input.about,
    teamLeadUserId: input.teamLeadUserId,
    memberIds: input.memberIds,
    clientIds: input.clientIds,
    createdAt: new Date().toISOString(),
  };
  teams = [...teams, team];
  emit();
  return team;
}

export function updateTeam(id: string, input: TeamInput) {
  teams = teams.map((t) =>
    t.id === id
      ? {
          ...t,
          name: input.name,
          about: input.about,
          teamLeadUserId: input.teamLeadUserId,
          memberIds: input.memberIds,
          clientIds: input.clientIds,
        }
      : t,
  );
  emit();
}

export function deleteTeam(id: string) {
  teams = teams.filter((t) => t.id !== id);
  emit();
}

/* ------------------------------------------------------------------ */
/*  Mutations — roles                                                  */
/* ------------------------------------------------------------------ */

export function createRole(input: {
  name: string;
  description: string | null;
  permissions: PermissionSet;
}): Role {
  const role: Role = {
    id: newId("role"),
    workspaceId: "demo",
    key: null,
    name: input.name,
    description: input.description,
    isSystem: false,
    permissions: input.permissions,
  };
  roles = [...roles, role];
  emit();
  return role;
}

export function updateRole(
  id: string,
  input: { name: string; description: string | null; permissions: PermissionSet },
) {
  roles = roles.map((r) =>
    r.id === id
      ? { ...r, name: input.name, description: input.description, permissions: input.permissions }
      : r,
  );
  emit();
}

export function deleteRole(id: string) {
  roles = roles.filter((r) => r.id !== id);
  emit();
}
