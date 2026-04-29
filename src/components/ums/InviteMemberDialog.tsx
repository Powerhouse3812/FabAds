import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Copy, Check } from "lucide-react";

interface InviteMemberDialogProps {
  workspaceId: string;
  onInvited: () => void;
}

export function InviteMemberDialog({ workspaceId, onInvited }: InviteMemberDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { clients } = useClients();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    // Check if user is already a member of THIS workspace
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from("workspace_users")
        .select("id")
        .eq("user_id", existingProfile.id)
        .eq("workspace_id", workspaceId)
        .single();

      if (existingMember) {
        toast({ title: "Already a member", description: `${email} is already in this workspace.`, variant: "destructive" });
        setSubmitting(false);
        return;
      }
    }

    // Cancel any old pending invites for this email + workspace
    await supabase
      .from("team_invites")
      .update({ status: "cancelled" })
      .eq("email", email)
      .eq("workspace_id", workspaceId)
      .eq("status", "pending");

    // Create pending invite and get the token back
    const { data: inviteData, error } = await supabase.from("team_invites").insert({
      email,
      role,
      invited_by: user.id,
      workspace_id: workspaceId,
      status: "pending",
    }).select("invite_token").single();

    if (error) {
      const msg = error.message.includes("duplicate")
        ? "A pending invite already exists for this email."
        : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      action: "invite_sent",
      target_email: email,
      metadata: { role, clients: selectedClientIds },
    });

    // If the invitee already has a profile, assign them to selected clients now
    if (existingProfile && selectedClientIds.length > 0) {
      const clientUserRows = selectedClientIds.map((cid) => ({
        client_id: cid,
        user_id: existingProfile.id,
        workspace_id: workspaceId,
      }));
      await supabase.from("client_users").insert(clientUserRows as any);
    }

    // Generate invite link
    const link = `${window.location.origin}/auth?invite=${inviteData.invite_token}`;
    setInviteLink(link);
    setSubmitting(false);
    onInvited();
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Copied", description: "Invite link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setInviteLink(null);
      setCopied(false);
      setEmail("");
      setRole("member");
      setSelectedClientIds([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Create an invite link for a new team member. Share the link with them to join your workspace.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with <strong>{email}</strong>. They'll be added as <strong>{role === "admin" ? "Admin" : "Member"}</strong> when they sign up.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                <Label>Assign to Clients</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-md p-2">
                  {clients.filter((c) => c.status === "active").map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedClientIds.includes(c.id)}
                        onCheckedChange={(checked) => {
                          setSelectedClientIds((prev) =>
                            checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                          );
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Generate Invite Link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
