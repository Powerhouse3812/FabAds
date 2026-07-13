import { useState, useMemo, useEffect } from "react";
import { useRoles } from "@/hooks/use-roles";
import { useTeams } from "@/hooks/use-teams";
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
import { inviteMember, isActiveMemberEmail, useClientsSnapshot } from "./ums-store";

export function InviteMemberDialog() {
  const { toast } = useToast();
  const { roles } = useRoles();
  const { teams } = useTeams();
  const clients = useClientsSnapshot();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Non-owner roles are assignable (Admin / Member / Team Lead + any custom).
  const assignableRoles = useMemo(() => roles.filter((r) => r.key !== "owner"), [roles]);
  const selectedRole = useMemo(
    () => assignableRoles.find((r) => r.id === roleId),
    [assignableRoles, roleId],
  );

  useEffect(() => {
    if (!roleId && assignableRoles.length > 0) {
      const defaultRole = assignableRoles.find((r) => r.key === "member") ?? assignableRoles[0];
      if (defaultRole) setRoleId(defaultRole.id);
    }
  }, [assignableRoles, roleId]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (isActiveMemberEmail(email)) {
      toast({
        title: "Already a member",
        description: `${email} is already in this workspace.`,
        variant: "destructive",
      });
      return;
    }
    inviteMember(email, selectedRole.id);
    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    setInviteLink(`${window.location.origin}/auth?invite=${token}`);
    toast({ title: "Invite created", description: `${email} added to Pending Invites.` });
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
      setRoleId("");
      setTeamId("");
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
                <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy invite link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with <strong>{email}</strong>. They'll be added as{" "}
                <strong>{selectedRole?.name ?? "Member"}</strong> when they sign up.
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
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-team">Team</Label>
              <Select value={teamId || "none"} onValueChange={(v) => setTeamId(v === "none" ? "" : v)}>
                <SelectTrigger id="invite-team">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {clients.length > 0 && (
              <div className="space-y-2">
                <Label>Assign to Clients</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-md p-2">
                  {clients.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedClientIds.includes(c.id)}
                        onCheckedChange={(checked) => {
                          setSelectedClientIds((prev) =>
                            checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
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
              <Button type="submit">Generate Invite Link</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
