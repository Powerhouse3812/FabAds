import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserPlus, X, Archive, RotateCcw } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Client, ClientUser } from "@/hooks/use-clients";

interface Props {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

interface MemberInfo {
  user_id: string;
  email: string;
  full_name: string | null;
}

export function ClientDetailDrawer({ client, open, onOpenChange, onUpdated }: Props) {
  const workspaceId = useWorkspace();
  const { toast } = useToast();
  const [assignedUsers, setAssignedUsers] = useState<(ClientUser & MemberInfo)[]>([]);
  const [allMembers, setAllMembers] = useState<MemberInfo[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchAssigned = useCallback(async () => {
    if (!client || !workspaceId) return;

    const { data: cuData } = await supabase
      .from("client_users")
      .select("*")
      .eq("client_id", client.id);

    const { data: wsUsers } = await supabase
      .from("workspace_users")
      .select("user_id")
      .eq("workspace_id", workspaceId);

    const userIds = wsUsers?.map((u: any) => u.user_id) ?? [];
    if (userIds.length === 0) {
      setAssignedUsers([]);
      setAllMembers([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    setAssignedUsers(
      (cuData ?? []).map((cu: any) => ({
        ...cu,
        email: profileMap.get(cu.user_id)?.email ?? "—",
        full_name: profileMap.get(cu.user_id)?.full_name ?? null,
        user_id: cu.user_id,
      }))
    );

    setAllMembers(
      userIds.map((uid: string) => ({
        user_id: uid,
        email: profileMap.get(uid)?.email ?? "—",
        full_name: profileMap.get(uid)?.full_name ?? null,
      }))
    );
  }, [client, workspaceId]);

  useEffect(() => {
    if (open) fetchAssigned();
  }, [open, fetchAssigned]);

  const handleAssign = async () => {
    if (!client || !selectedUserId || !workspaceId) return;
    setAdding(true);

    const { error } = await supabase.from("client_users").insert({
      client_id: client.id,
      user_id: selectedUserId,
      workspace_id: workspaceId,
    } as any);

    setAdding(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSelectedUserId("");
    fetchAssigned();
    onUpdated();
  };

  const handleUnassign = async (cuId: string) => {
    await supabase.from("client_users").delete().eq("id", cuId);
    fetchAssigned();
    onUpdated();
  };

  const handleToggleStatus = async () => {
    if (!client) return;
    const newStatus = client.status === "active" ? "archived" : "active";
    await supabase.from("clients").update({ status: newStatus } as any).eq("id", client.id);
    toast({ title: `Client ${newStatus}` });
    onUpdated();
    onOpenChange(false);
  };

  const unassignedMembers = allMembers.filter(
    (m) => !assignedUsers.some((au) => au.user_id === m.user_id)
  );

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {client.logo_url && <AvatarImage src={client.logo_url} />}
              <AvatarFallback>{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{client.name}</SheetTitle>
              <div className="flex gap-2 mt-1">
                {client.industry && <Badge variant="secondary" className="text-[10px]">{client.industry}</Badge>}
                <Badge variant={client.status === "active" ? "default" : "outline"} className="text-[10px] capitalize">{client.status}</Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Assigned Users */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Assigned Users ({assignedUsers.length})</h3>
          <div className="space-y-2">
            {assignedUsers.map((au) => (
              <div key={au.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm truncate">{au.full_name ?? au.email}</p>
                  {au.full_name && <p className="text-xs text-muted-foreground truncate">{au.email}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnassign(au.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {assignedUsers.length === 0 && <p className="text-xs text-muted-foreground">No users assigned yet.</p>}
          </div>

          {/* Assign user */}
          {unassignedMembers.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="Select user to assign" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedMembers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.full_name ?? m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleAssign} disabled={!selectedUserId || adding}>
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={handleToggleStatus} className="gap-2 w-full">
          {client.status === "active" ? (
            <><Archive className="h-4 w-4" /> Archive Client</>
          ) : (
            <><RotateCcw className="h-4 w-4" /> Reactivate Client</>
          )}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
