import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createRole } from "./ums-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { describePermissions, type PermissionSet, type ResourceKey } from "@/lib/permissions";

interface CreateCustomRoleWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface PermissionGroupConfig {
  resource: ResourceKey;
  label: string;
  actions: { key: string; label: string }[];
}

const PERMISSION_GROUPS: PermissionGroupConfig[] = [
  { resource: "members", label: "Members", actions: [{ key: "view", label: "View" }, { key: "edit", label: "Edit" }] },
  { resource: "teams", label: "Teams", actions: [{ key: "view", label: "View" }, { key: "edit", label: "Edit" }] },
  { resource: "clients", label: "Clients", actions: [{ key: "view", label: "View" }, { key: "assign", label: "Assign" }] },
  { resource: "roles", label: "Roles", actions: [{ key: "view", label: "View" }, { key: "edit", label: "Edit" }] },
];

const EMPTY_PERMISSIONS: PermissionSet = {
  members: { actions: [], scope: "all" },
  teams: { actions: [], scope: "all" },
  clients: { actions: [], scope: "all" },
  roles: { actions: [], scope: "all" },
};

export function CreateCustomRoleWizard({ open, onOpenChange, onCreated }: CreateCustomRoleWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionSet>(EMPTY_PERMISSIONS);

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
        [resource]: { actions: nextActions, scope: "all" },
      };
    });
  };

  const reset = () => {
    setStep(1);
    setName("");
    setDescription("");
    setPermissions(EMPTY_PERMISSIONS);
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createRole({
      name: name.trim(),
      description: description.trim() || null,
      permissions,
    });
    toast({ title: "Role created", description: `"${name.trim()}" is ready to assign.` });
    onCreated();
    handleClose(false);
  };

  const previewLines = describePermissions(permissions);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Basic Information" : "Select services & permissions"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto pr-1">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Campaign Manager"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Role Description</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What can this role do? (optional)"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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
          </div>
        )}
        </div>

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Previous
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!name.trim()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate}>Create role</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
