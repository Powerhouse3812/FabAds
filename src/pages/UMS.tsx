import { TeamMemberTable } from "@/components/ums/TeamMemberTable";
import { DeleteAccountDialog } from "@/components/ums/DeleteAccountDialog";
import { DeleteWorkspaceDialog } from "@/components/ums/DeleteWorkspaceDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function UMS() {
  const { role } = useAuth();
  const isAdmin = role === "owner" || role === "admin";

  return (
    <div className="space-y-6">
      <TeamMemberTable />

      {/* Danger Zone */}
      <div className="rounded-md border border-destructive/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <div className="flex flex-wrap gap-3">
          <DeleteAccountDialog />
          {isAdmin && <DeleteWorkspaceDialog />}
        </div>
      </div>
    </div>
  );
}
