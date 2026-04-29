import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";
import { useClients } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { displayRole } from "@/lib/display-role";
import { friendlyError } from "@/lib/edge-errors";

interface ActiveMember {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
  kind: "active";
}

interface PendingInvite {
  id: string;
  email: string;
  role: "admin" | "member";
  invited_by_email: string | null;
  created_at: string;
  kind: "pending";
}

export function TeamMemberTable() {
  const { user, role: currentUserRole } = useAuth();
  const workspaceId = useWorkspace();
  const { clients, clientUsers } = useClients();
  const { toast } = useToast();
  const [members, setMembers] = useState<ActiveMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  // Count admins for last-admin guard
  const adminCount = members.filter(
    (m) => m.role === "owner" || m.role === "admin"
  ).length;

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    const { data: wsUsers } = await supabase
      .from("workspace_users")
      .select("user_id, role, created_at")
      .eq("workspace_id", workspaceId);

    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name");

    const activeMembers: ActiveMember[] = (wsUsers ?? []).map((wu) => {
      const profile = profiles?.find((p) => p.id === wu.user_id);
      return {
        id: wu.user_id,
        email: profile?.email ?? "",
        full_name: profile?.full_name ?? null,
        role: wu.role as ActiveMember["role"],
        joined_at: wu.created_at,
        kind: "active",
      };
    });

    // Sort: admin/owner first, then member
    const roleOrder = { owner: 0, admin: 0, member: 1 };
    activeMembers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

    let pendingInvites: PendingInvite[] = [];
    if (canManage) {
      const { data: inv } = await supabase
        .from("team_invites")
        .select("id, email, role, invited_by, created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending");

      pendingInvites = (inv ?? []).map((i) => {
        const inviter = profiles?.find((p) => p.id === i.invited_by);
        return {
          id: i.id,
          email: i.email,
          role: i.role as "admin" | "member",
          invited_by_email: inviter?.email ?? null,
          created_at: i.created_at,
          kind: "pending",
        };
      });
    }

    setMembers(activeMembers);
    setInvites(pendingInvites);
    setLoading(false);
  }, [workspaceId, canManage]);

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId, fetchData]);

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!workspaceId) return;

    // Verify active session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase.functions.invoke("account-delete-member", {
      body: { user_id: userId },
    });

    if (error) {
      toast({
        title: "Error",
        description: friendlyError(error.message),
        variant: "destructive",
      });
      return;
    }

    if (data && !data.success) {
      toast({
        title: "Error",
        description: friendlyError(data.error || data.message),
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Member removed" });
    fetchData();
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    if (!workspaceId) return;
    const { error } = await supabase.from("team_invites").delete().eq("id", inviteId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("activity_logs").insert({
      workspace_id: workspaceId,
      user_id: user!.id,
      action: "invite_cancelled",
      target_email: email,
      metadata: {},
    });

    toast({ title: "Invite cancelled" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <InviteMemberDialog workspaceId={workspaceId!} onInvited={fetchData} />
        </div>
      )}

      {/* Active Members */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Active Members</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && <TableHead className="w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const mIsAdmin = m.role === "owner" || m.role === "admin";
                const isLastAdmin = mIsAdmin && adminCount <= 1;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.full_name ?? "—"}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={mIsAdmin ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {displayRole(m.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {clientUsers
                          .filter((cu) => cu.user_id === m.id)
                          .map((cu) => {
                            const client = clients.find((c) => c.id === cu.client_id);
                            return client ? (
                              <Badge key={cu.id} variant="outline" className="text-[10px]">
                                {client.name}
                              </Badge>
                            ) : null;
                          })}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {m.id !== user?.id && !isLastAdmin && (
                          <RemoveMemberDialog
                            email={m.email}
                            onConfirm={() => handleRemoveMember(m.id, m.email)}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
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
                  <TableHead>Invited By</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {displayRole(inv.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inv.invited_by_email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleCancelInvite(inv.id, inv.email)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
