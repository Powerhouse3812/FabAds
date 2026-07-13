import { useTeams, teamMemberCount, type Team } from "@/hooks/use-teams";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Users2 } from "lucide-react";
import { CreateEditTeamDialog } from "./CreateEditTeamDialog";
import { DeleteTeamDialog } from "./DeleteTeamDialog";
import { useMembersSnapshot, deleteTeam } from "./ums-store";

export default function TeamsTab() {
  const { teams, teamMembers, teamClients, refetch } = useTeams();
  const members = useMembersSnapshot();

  const teamLeadName = (team: Team) => {
    if (!team.teamLeadUserId) return "—";
    const member = members.find((m) => m.id === team.teamLeadUserId);
    return member?.fullName ?? member?.email ?? "—";
  };

  const clientCount = (teamId: string) =>
    teamClients.filter((tc) => tc.teamId === teamId).length;

  const handleDelete = (teamId: string) => {
    deleteTeam(teamId);
  };

  return (
    <div className="space-y-6">
      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <Users2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Start creating your team
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Group members together and assign clients to teams for easier management.
          </p>
          <CreateEditTeamDialog
            onSaved={refetch}
            trigger={<Button className="mt-4">Create new team</Button>}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <CreateEditTeamDialog onSaved={refetch} />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team lead</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium max-w-[240px] truncate" title={team.name}>{team.name}</TableCell>
                    <TableCell>{teamLeadName(team)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {teamMemberCount(team.id, teamMembers)} members
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {clientCount(team.id)} clients
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreateEditTeamDialog
                          team={team}
                          onSaved={refetch}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteTeamDialog
                          teamName={team.name}
                          onConfirm={() => handleDelete(team.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
