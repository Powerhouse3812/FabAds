import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";
import { friendlyError } from "@/lib/edge-errors";

interface MemberInfo {
  user_id: string;
  role: string;
  email: string;
  full_name: string | null;
}

export function DeleteAccountDialog() {
  const { user, role, signOut } = useAuth();
  const workspaceId = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [promoteUserId, setPromoteUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "owner" || role === "admin";

  useEffect(() => {
    if (!open || !workspaceId) return;

    const fetchMembers = async () => {
      const { data: wsUsers } = await supabase
        .from("workspace_users")
        .select("user_id, role")
        .eq("workspace_id", workspaceId);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      const mapped: MemberInfo[] = (wsUsers ?? []).map((wu) => {
        const p = profiles?.find((pr) => pr.id === wu.user_id);
        return {
          user_id: wu.user_id,
          role: wu.role,
          email: p?.email ?? "",
          full_name: p?.full_name ?? null,
        };
      });
      setMembers(mapped);
    };

    fetchMembers();
  }, [open, workspaceId]);

  const otherAdmins = members.filter(
    (m) =>
      m.user_id !== user?.id &&
      (m.role === "owner" || m.role === "admin")
  );
  const otherMembers = members.filter((m) => m.user_id !== user?.id);
  const isSoleUser = otherMembers.length === 0;
  const isLastAdmin = isAdmin && otherAdmins.length === 0 && !isSoleUser;

  const handleDelete = async () => {
    if (!workspaceId) return;

    // Verify active session before calling
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, string> = {};
      if (isLastAdmin && promoteUserId) {
        body.promote_user_id = promoteUserId;
      }

      const { data, error } = await supabase.functions.invoke("account-delete-self", {
        body,
      });

      if (error) {
        toast({
          title: "Error",
          description: friendlyError(error.message),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data && !data.success) {
        toast({
          title: "Error",
          description: friendlyError(data.error || data.message),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await signOut();
      navigate("/auth");
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete My Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            {isSoleUser ? (
              "You are the only user in this workspace. Please delete the workspace instead."
            ) : isLastAdmin ? (
              "You are the last admin. Select a member to promote to Admin before deleting your account."
            ) : (
              "This will permanently delete your account and remove you from this workspace. This action cannot be undone."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLastAdmin && (
          <div className="py-2">
            <Select value={promoteUserId} onValueChange={setPromoteUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select member to promote" />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.full_name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {!isSoleUser && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading || (isLastAdmin && !promoteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
