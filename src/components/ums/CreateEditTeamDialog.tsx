import { useState, useEffect } from "react";
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
import { Plus, Pencil } from "lucide-react";
import {
  useMembersSnapshot,
  useClientsSnapshot,
  createTeam,
  updateTeam,
  type Team,
} from "./ums-store";

interface CreateEditTeamDialogProps {
  team?: Team;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

export function CreateEditTeamDialog({ team, trigger, onSaved }: CreateEditTeamDialogProps) {
  const { toast } = useToast();
  const members = useMembersSnapshot();
  const clients = useClientsSnapshot();
  const isEdit = !!team;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team?.name ?? "");
  const [about, setAbout] = useState(team?.about ?? "");
  const [teamLeadUserId, setTeamLeadUserId] = useState<string>(team?.teamLeadUserId ?? "");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(team?.memberIds ?? []);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(team?.clientIds ?? []);
  const [leadError, setLeadError] = useState(false);

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      setAbout(team?.about ?? "");
      setTeamLeadUserId(team?.teamLeadUserId ?? "");
      setSelectedMemberIds(team?.memberIds ?? []);
      setSelectedClientIds(team?.clientIds ?? []);
      setLeadError(false);
    }
  }, [open, team]);

  const handleClose = (isOpen: boolean) => setOpen(isOpen);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamLeadUserId) {
      setLeadError(true);
      return;
    }
    setLeadError(false);

    // Team lead is always a member of their own team.
    const memberIds = Array.from(new Set([teamLeadUserId, ...selectedMemberIds]));
    const input = { name, about: about || null, teamLeadUserId, memberIds, clientIds: selectedClientIds };

    if (isEdit && team) {
      updateTeam(team.id, input);
      toast({ title: "Team updated" });
    } else {
      createTeam(input);
      toast({ title: "Team created" });
    }
    onSaved?.();
    handleClose(false);
  };

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" aria-label="Edit team">
      <Pencil className="h-4 w-4" />
    </Button>
  ) : (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create new team
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update team details, lead, members, and assigned clients."
              : "Set up a new team with a lead, members, and assigned clients."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Performance Marketing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-about">About the team</Label>
            <Input
              id="team-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="What does this team own?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-lead">Team lead</Label>
            <Select
              value={teamLeadUserId}
              onValueChange={(v) => {
                setTeamLeadUserId(v);
                setLeadError(false);
              }}
            >
              <SelectTrigger id="team-lead" className={leadError ? "border-destructive" : undefined}>
                <SelectValue placeholder="Select a team lead" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName ?? m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {leadError && <p className="text-sm text-destructive">A team lead must be chosen.</p>}
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-md p-2">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedMemberIds.includes(m.id)}
                    onCheckedChange={(checked) => {
                      setSelectedMemberIds((prev) =>
                        checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                      );
                    }}
                  />
                  {m.fullName ?? m.email}
                </label>
              ))}
            </div>
          </div>

          {clients.length > 0 && (
            <div className="space-y-2">
              <Label>Assign clients</Label>
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
            <Button type="submit">{isEdit ? "Save Changes" : "Create Team"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
