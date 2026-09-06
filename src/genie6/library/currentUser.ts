import { displayRole } from "@/lib/display-role";

/**
 * Current-user stub for the Library's §17 role gating ("Admin gets a user
 * filter, and the user's name appears inside the record").
 *
 * The codebase has no auth/session context to read a real logged-in user
 * from (searched — no `useCurrentUser`/`CURRENT_USER` exists anywhere in
 * genie6, src/lib or src/hooks). This prototype's session user is Rahul
 * Saini (Fabfunnel's design lead / Idea Clan founder — the only account this
 * demo runs as), treated as an owner/admin so the user filter has something
 * to gate on. Replace with a real session read when auth lands.
 */
export const CURRENT_USER = {
  name: "Rahul Saini",
  role: "owner" as const,
};

export function isCurrentUserAdmin(): boolean {
  return displayRole(CURRENT_USER.role) === "Admin";
}
