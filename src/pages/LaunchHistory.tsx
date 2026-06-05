import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Rocket, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LaunchHistoryTable } from "@/components/launch/LaunchHistoryTable";
import { LaunchDetailDrawer } from "@/components/launch/LaunchDetailDrawer";
import { useLaunches, useRelaunchDraft, type LaunchWithCounts } from "@/hooks/use-launch";
import { useDeleteLaunch, useRenameLaunch } from "@/hooks/use-launch-mutations";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePlan } from "@/contexts/PlanContext";
import { LaunchUpsellPage } from "@/components/upsell/LaunchUpsellPage";

export default function LaunchHistory() {
  const { plan } = usePlan();
  // AI plan: managed launches sit on Growth. Page-takeover upsell so the
  // user never sees a half-broken table querying mutations they can't run.
  if (plan === "ai") {
    return <LaunchUpsellPage />;
  }

  const navigate = useNavigate();
  const { data: launches, isLoading } = useLaunches();
  const relaunch = useRelaunchDraft();
  const deleteLaunch = useDeleteLaunch();
  const renameLaunch = useRenameLaunch();
  const { user } = useAuth();
  const workspaceId = useWorkspace();
  const [detailLaunch, setDetailLaunch] = useState<LaunchWithCounts | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLaunches = launches?.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRelaunch = async (launchId: string) => {
    try {
      const newLaunch = await relaunch.mutateAsync(launchId);
      // Log activity
      if (workspaceId && user) {
        await (supabase as any).from("activity_logs").insert({
          workspace_id: workspaceId, user_id: user.id, action: "launch_relaunched",
          target_email: user.email || "", metadata: { source_launch_id: launchId, new_launch_id: newLaunch.id },
        });
      }
      toast({ title: "Draft created from relaunch" });
      navigate(`/launch/${newLaunch.id}`);
    } catch {
      toast({ title: "Relaunch failed", variant: "destructive" });
    }
  };

  const handleDelete = async (launchId: string) => {
    try {
      // Log before deleting
      if (workspaceId && user) {
        const launch = launches?.find(l => l.id === launchId);
        await (supabase as any).from("activity_logs").insert({
          workspace_id: workspaceId, user_id: user.id, action: "launch_deleted",
          target_email: user.email || "", metadata: { launch_id: launchId, launch_name: launch?.name },
        });
      }
      await deleteLaunch.mutateAsync({ launchId });
      toast({ title: "Draft deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleRename = async (launchId: string, name: string) => {
    try {
      await renameLaunch.mutateAsync({ launchId, name });
      toast({ title: "Launch renamed" });
    } catch {
      toast({ title: "Rename failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search launches..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
        <Button variant="outline" className="ml-auto" onClick={() => navigate("/launch/new?mode=catalogue")}><Plus className="mr-2 h-4 w-4" /> New Catalogue Ads</Button>
        <Button variant="outline" onClick={() => navigate("/launch2")}><Rocket className="mr-2 h-4 w-4" /> New Launch 2.0 <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Beta</Badge></Button>
        <Button onClick={() => navigate("/launch/new")}><Plus className="mr-2 h-4 w-4" /> New Launch</Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm py-12 text-center">Loading launches...</div>
      ) : !filteredLaunches?.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Rocket className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold text-foreground">{searchQuery ? "No matching launches" : "No launches yet"}</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            {searchQuery ? "Try a different search term." : "Create your first Facebook ad launch to get started."}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate("/launch/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Launch
            </Button>
          )}
        </div>
      ) : (
        <LaunchHistoryTable
          launches={filteredLaunches}
          onViewDetails={setDetailLaunch}
          onRelaunch={handleRelaunch}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      )}

      <LaunchDetailDrawer
        launch={detailLaunch}
        open={!!detailLaunch}
        onOpenChange={(open) => !open && setDetailLaunch(null)}
      />
    </div>
  );
}
