import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useMembersSnapshot,
  updateRole,
  assignRoleToMember,
} from "./ums-store";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Lock, UserPlus } from "lucide-react";
import type { Role } from "@/hooks/use-roles";
import { describePermissions, type PermissionSet, type ResourceKey } from "@/lib/permissions";

interface EditRoleDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

interface PermissionGroupConfig {
  resource: ResourceKey;
  label: string;
  actions: { key: string; label: string }[];
}

// Same groups/actions as CreateCustomRoleWizard's step 2, kept in sync intentionally.
const PERMISSION_GROUPS: PermissionGroupConfig[] = [
  { resource: "members", label: "Members", actions: [{ key: "view", label: "View" }, { key: "edit", label: "Edit" }] },
  { resource: "teams", label: "Teams", actions: [{ key: "view", label: "View" }, { key: "edit", label: "Edit" }] },
  { resource: "clients", label: "Clients", actions: [{ key: "view", label: "View" }, { key: "assign", label: "Assign" }] },
  { resource: "roles", label: "Roles", actions: [{ key: "view", label: "View" }, { key: "edit", label: "Edit" }] },
];

export function EditRoleDialog({ role, open, onOpenChange, onUpdated }: EditRoleDialogProps) {
  const { toast } = useToast();
  const allMembers = useMembersSnapshot();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [permissions, setPermissions] = useState<PermissionSet>(role.permissions ?? {});

  const [addMemberId, setAddMemberId] = useState<string>("");

  const previewLines = useMemo(() => describePermissions(permissions), [permissions]);

  const members = useMemo(
    () => allMembers.filter((m) => m.roleId === role.id),
    [allMembers, role.id],
  );
  const addableMembers = useMemo(
    () => allMembers.filter((m) => m.roleId !== role.id && m.roleEnum !== "owner"),
    [allMembers, role.id],
  );

  useEffect(() => {
    if (open) {
      setName(role.name);
      setDescription(role.description ?? "");
      setPermissions(role.permissions ?? {});
      setAddMemberId("");
    }
  }, [open, role]);

  const toggleAction = (resource: ResourceKey, action: string, checked: boolean) => {
    setPermissions((prev) => {
      const current = prev[resource]?.actions ?? [];
      let nextActions: string[];
      if (checked) {
        nextActions = current.includes(action) ? current : [...current, action];
        if (action === "edit" && !nextActions.includes("view")) {
          nextActions = [...nextActions, "view"];
        }
      } else {
        nextActions = current.filter((a) => a !== action);
      }
      return {
        ...prev,
        [resource]: { actions: nextActions, scope: prev[resource]?.scope ?? "all" },
      };
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateRole(role.id, {
      name: name.trim(),
      description: description.trim() || null,
      permissions,
    });
    toast({ title: "Role updated" });
    onUpdated();
    onOpenChange(false);
  };

  const handleAddMember = () => {
    if (!addMemberId) return;
    assignRoleToMember(addMemberId, role.id);
    toast({ title: "Member assigned", description: `Now has the ${role.name} role.` });
    setAddMemberId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role.name}
            {role.isSystem && <Badge variant="secondary">Default</Badge>}
          </DialogTitle>
          <DialogDescription>
            {role.isSystem
              ? "System role — permissions cannot be edited."
              : "Edit this role's details, permissions, and members."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {role.isSystem ? (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mt-0.5 shrink-0" />
              <span>System role — permissions cannot be edited.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input id="edit-role-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role-description">Role Description</Label>
                <Textarea
                  id="edit-role-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What can this role do? (optional)"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERMISSION_GROUPS.map((group) => (
              <Card key={group.resource}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">{group.label}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1.5">
                  {group.actions.map((action) => (
                    <label
                      key={action.key}
                      className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground"
                    >
                      <Checkbox
                        checked={(permissions[group.resource]?.actions ?? []).includes(action.key)}
                        disabled={role.isSystem}
                        onCheckedChange={(checked) =>
                          toggleAction(group.resource, action.key, checked === true)
                        }
                      />
                      {action.label}
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-sm font-medium text-foreground">This role can:</p>
            <ul className="space-y-1">
              {previewLines.map((line) => (
                <li key={line} className="text-sm text-muted-foreground">
                  • {line}
                </li>
              ))}
            </ul>
          </div>

          {!role.isSystem && (
            <div className="space-y-2">
              <Label>Members with this role</Label>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members have this role yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-md p-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span>{m.fullName ?? m.email}</span>
                      <span className="text-muted-foreground">{m.email}</span>
                    </div>
                  ))}
                </div>
              )}

              {addableMembers.length > 0 && (
                <div className="flex gap-2 pt-1">
                  <Select value={addMemberId} onValueChange={setAddMemberId}>
                    <SelectTrigger className="flex-1" aria-label="Select a member to assign">
                      <SelectValue placeholder="Select a member to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {addableMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName ?? m.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!addMemberId}
                    onClick={handleAddMember}
                    aria-label="Assign member to role"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!role.isSystem && (
            <Button onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
