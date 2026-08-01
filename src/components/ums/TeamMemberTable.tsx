import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/use-roles";
import { useTeams, teamOfUser } from "@/hooks/use-teams";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, MoreHorizontal, Search } from "lucide-react";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import {
  useMembersSnapshot,
  useInvitesSnapshot,
  useClientsSnapshot,
  cancelInvite,
  resendInvite,
  removeMember,
  addMemberToTeam,
  assignClientsToMembers,
  type Member,
  type UmsClient,
} from "./ums-store";

function isInviteExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function TeamMemberTable() {
  const { role: currentUserRole } = useAuth();
  const { toast } = useToast();
  const { roles } = useRoles();
  const { teams, teamMembers } = useTeams();
  const members = useMembersSnapshot();
  const invites = useInvitesSnapshot();
  const clients = useClientsSnapshot();
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [teamDialogMemberId, setTeamDialogMemberId] = useState<string | null>(null);
  const [clientsDialogMemberId, setClientsDialogMemberId] = useState<string | null>(null);
  const [bulkClientsDialogOpen, setBulkClientsDialogOpen] = useState(false);

  const adminCount = members.filter((m) => m.roleEnum === "owner" || m.roleEnum === "admin").length;
  const ownerCount = members.filter((m) => m.roleEnum === "owner").length;

  const resolveRoleName = (roleId: string | null, roleEnum: string) => {
    if (roleId) {
      const match = roles.find((r) => r.id === roleId);
      if (match) return match.name;
    }
    return roleEnum === "owner" || roleEnum === "admin" ? "Admin" : "Member";
  };

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        (m.fullName ?? "").toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || m.roleId === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  const allVisibleSelected =
    filteredMembers.length > 0 && filteredMembers.every((m) => selectedMemberIds.includes(m.id));

  const toggleSelectMember = (id: string, checked: boolean) => {
    setSelectedMemberIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedMemberIds(checked ? filteredMembers.map((m) => m.id) : []);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember(memberId);
    toast({ title: "Member removed" });
  };

  const handleCancelInvite = (inviteId: string) => {
    cancelInvite(inviteId);
    toast({ title: "Invite cancelled" });
  };

  const handleResendInvite = (inviteId: string) => {
    resendInvite(inviteId);
    toast({ title: "Invitation resent", description: "Expiry extended by 7 days." });
  };

  const handleAddToTeam = (memberId: string, teamId: string) => {
    addMemberToTeam(memberId, teamId);
    toast({ title: "Added to team" });
  };

  const handleAssignClients = (memberIds: string[], clientIds: string[]) => {
    assignClientsToMembers(memberIds, clientIds);
    toast({ title: "Clients assigned" });
  };

  const teamDialogMember = members.find((m) => m.id === teamDialogMemberId) ?? null;
  const clientsDialogMember = members.find((m) => m.id === clientsDialogMemberId) ?? null;

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <InviteMemberDialog />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Search members by name or email"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {canManage && selectedMemberIds.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">{selectedMemberIds.length} selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkClientsDialogOpen(true)}>
              Assign clients
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMemberIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Active Members</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {canManage && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                      aria-label="Select all members"
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((m) => {
                const mIsAdmin = m.roleEnum === "owner" || m.roleEnum === "admin";
                const isLastAdmin = mIsAdmin && adminCount <= 1;
                const protectedRow = isLastAdmin || (m.roleEnum === "owner" && ownerCount <= 1);
                const team = teamOfUser(m.id, teamMembers, teams);
                return (
                  <TableRow key={m.id}>
                    {canManage && (
                      <TableCell>
                        <Checkbox
                          checked={selectedMemberIds.includes(m.id)}
                          onCheckedChange={(checked) => toggleSelectMember(m.id, !!checked)}
                          aria-label={`Select ${m.email}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="max-w-[200px] truncate" title={m.fullName ?? "—"}>
                      {m.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={m.email}>
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mIsAdmin ? "default" : "secondary"}
                        className="capitalize max-w-[160px] truncate"
                        title={resolveRoleName(m.roleId, m.roleEnum)}
                      >
                        {resolveRoleName(m.roleId, m.roleEnum)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[200px] truncate"
                      title={team?.name ?? "—"}
                    >
                      {team?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-500/15 text-green-700 dark:text-green-400 border-0"
                      >
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.clientIds.map((cid) => {
                          const client = clients.find((c) => c.id === cid);
                          return client ? (
                            <Badge key={cid} variant="outline" className="text-[10px]">
                              {client.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Member actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() =>
                                  toast({ title: "Coming soon", description: "Editing member details is on the way." })
                                }
                              >
                                Edit member
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setTeamDialogMemberId(m.id)}>
                                Add to team
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setClientsDialogMemberId(m.id)}>
                                Assign clients
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {!protectedRow && (
                            <RemoveMemberDialog
                              email={m.email}
                              onConfirm={() => handleRemoveMember(m.id)}
                            />
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 9 : 7}
                    className="text-center text-muted-foreground py-6"
                  >
                    {members.length === 0
                      ? "No team members yet."
                      : "No members match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pending Invites — Owner/Admin only */}
      {canManage && invites.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Pending Invites</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => {
                  const expired = isInviteExpired(inv.expiresAt);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {resolveRoleName(inv.roleId, inv.roleEnum)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0"
                          >
                            Link expired
                          </Badge>
                        ) : (
                          <Badge variant="outline">Invited</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{inv.invitedByEmail ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {expired && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Invite actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleResendInvite(inv.id)}>
                                  Resend invitation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvite(inv.id)}
                            aria-label="Cancel invite"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AddToTeamDialog
        member={teamDialogMember}
        teams={teams}
        onClose={() => setTeamDialogMemberId(null)}
        onSubmit={handleAddToTeam}
      />

      <AssignClientsDialog
        open={!!clientsDialogMember}
        title="Assign clients"
        description={clientsDialogMember ? `Assign clients to ${clientsDialogMember.email}.` : ""}
        clients={clients}
        onClose={() => setClientsDialogMemberId(null)}
        onSubmit={(clientIds) => handleAssignClients([clientsDialogMember!.id], clientIds)}
      />

      <AssignClientsDialog
        open={bulkClientsDialogOpen}
        title="Assign clients"
        description={`Assign clients to ${selectedMemberIds.length} selected member(s).`}
        clients={clients}
        onClose={() => setBulkClientsDialogOpen(false)}
        onSubmit={(clientIds) => {
          handleAssignClients(selectedMemberIds, clientIds);
          setSelectedMemberIds([]);
        }}
      />
    </div>
  );
}

function AddToTeamDialog({
  member,
  teams,
  onClose,
  onSubmit,
}: {
  member: Member | null;
  teams: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (memberId: string, teamId: string) => void;
}) {
  const [teamId, setTeamId] = useState<string>("");

  const handleSubmit = () => {
    if (!member || !teamId) return;
    onSubmit(member.id, teamId);
    setTeamId("");
    onClose();
  };

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to team</DialogTitle>
          <DialogDescription>{member ? `Assign ${member.email} to a team.` : ""}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Team</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
              {teams.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No teams yet.</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!teamId}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignClientsDialog({
  open,
  title,
  description,
  clients,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  clients: UmsClient[];
  onClose: () => void;
  onSubmit: (clientIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onSubmit(selected);
    setSelected([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSelected([]);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 max-h-56 overflow-y-auto border rounded-md p-2">
          {clients.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selected.includes(c.id)}
                onCheckedChange={(checked) =>
                  setSelected((prev) => (checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                }
              />
              {c.name}
            </label>
          ))}
          {clients.length === 0 && (
            <p className="text-sm text-muted-foreground p-2">No clients available.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={selected.length === 0}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
