import { useMemo, useState } from "react";
import { useRoles, type Role } from "@/hooks/use-roles";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Plus } from "lucide-react";
import { CreateCustomRoleWizard } from "./CreateCustomRoleWizard";
import { EditRoleDialog } from "./EditRoleDialog";
import { useMembersSnapshot, deleteRole } from "./ums-store";

export default function RolesTab() {
  const { toast } = useToast();
  const { systemRoles, customRoles, refetch } = useRoles();
  const members = useMembersSnapshot();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const memberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of members) {
      if (m.roleId) counts[m.roleId] = (counts[m.roleId] ?? 0) + 1;
    }
    return counts;
  }, [members]);

  const handleDelete = () => {
    if (!deletingRole) return;
    deleteRole(deletingRole.id);
    toast({ title: "Role deleted" });
    setDeletingRole(null);
  };

  const renderRow = (role: Role) => (
    <TableRow key={role.id}>
      <TableCell className="font-medium text-foreground max-w-[240px] truncate" title={role.name}>{role.name}</TableCell>
      <TableCell>
        <Badge variant={role.isSystem ? "secondary" : "outline"}>
          {role.isSystem ? "Default" : "Custom"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{memberCounts[role.id] ?? 0}</TableCell>
      <TableCell className="w-[80px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Role actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingRole(role)}>
              View / Edit
            </DropdownMenuItem>
            {!role.isSystem && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletingRole(role)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create custom role
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Default Roles</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{systemRoles.map(renderRow)}</TableBody>
          </Table>
        </div>
      </div>

      {customRoles.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Custom Roles</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{customRoles.map(renderRow)}</TableBody>
            </Table>
          </div>
        </div>
      )}

      <CreateCustomRoleWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={refetch}
      />

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => {
            if (!open) setEditingRole(null);
          }}
          onUpdated={refetch}
        />
      )}

      <AlertDialog
        open={!!deletingRole}
        onOpenChange={(open) => {
          if (!open) setDeletingRole(null);
        }}
      >
        <AlertDialogContent>
          {deletingRole && (memberCounts[deletingRole.id] ?? 0) > 0 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Role in use</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium">"{deletingRole.name}"</span> is
                  assigned to {memberCounts[deletingRole.id]} member
                  {memberCounts[deletingRole.id] === 1 ? "" : "s"}. Reassign
                  them to another role before deleting this one.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete role?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete{" "}
                  <span className="font-medium">"{deletingRole?.name}"</span>?
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
