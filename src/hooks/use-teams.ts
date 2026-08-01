import { useTeamsSnapshot, type Team } from "@/components/ums/ums-store";

export type { Team };

export interface TeamMember {
  teamId: string;
  userId: string;
}

export interface TeamClient {
  teamId: string;
  clientId: string;
}

export function useTeams() {
  const teams = useTeamsSnapshot();

  const teamMembers: TeamMember[] = teams.flatMap((t) =>
    t.memberIds.map((userId) => ({ teamId: t.id, userId })),
  );
  const teamClients: TeamClient[] = teams.flatMap((t) =>
    t.clientIds.map((clientId) => ({ teamId: t.id, clientId })),
  );

  return { teams, teamMembers, teamClients, loading: false, refetch: () => {} };
}

export function teamMemberCount(teamId: string, teamMembers: TeamMember[]): number {
  return teamMembers.filter((tm) => tm.teamId === teamId).length;
}

export function teamOfUser(
  userId: string,
  teamMembers: TeamMember[],
  teams: Team[],
): Team | undefined {
  const membership = teamMembers.find((tm) => tm.userId === userId);
  if (!membership) return undefined;
  return teams.find((t) => t.id === membership.teamId);
}
