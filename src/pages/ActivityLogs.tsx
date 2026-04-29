import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  target_email: string;
  user_email: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  invite_sent: { label: "Invite Sent", variant: "default" },
  invite_accepted: { label: "Invite Accepted", variant: "secondary" },
  invite_cancelled: { label: "Invite Cancelled", variant: "outline" },
  user_removed: { label: "User Removed", variant: "destructive" },
  workspace_created: { label: "Workspace Created", variant: "default" },
  user_self_deleted: { label: "Account Deleted", variant: "destructive" },
  user_removed_by_admin: { label: "Removed by Admin", variant: "destructive" },
  member_promoted: { label: "Member Promoted", variant: "secondary" },
  fb_connected: { label: "FB Connected", variant: "default" },
  fb_disconnected: { label: "FB Disconnected", variant: "outline" },
  fb_synced: { label: "FB Synced", variant: "secondary" },
  fb_sync_failed: { label: "FB Sync Failed", variant: "destructive" },
  launch_created: { label: "Launch Created", variant: "default" },
  launch_updated: { label: "Launch Updated", variant: "secondary" },
  launch_executed: { label: "Launch Executed", variant: "default" },
  launch_failed: { label: "Launch Failed", variant: "destructive" },
  auto_maintain_triggered: { label: "Auto-Maintain Triggered", variant: "default" },
  dilution_plan_created: { label: "Dilution Plan Created", variant: "secondary" },
  auto_action_stub_created: { label: "Auto Action Stub", variant: "outline" },
  launch_deleted: { label: "Launch Deleted", variant: "destructive" },
  launch_relaunched: { label: "Launch Relaunched", variant: "secondary" },
  bulk_ads_updated: { label: "Bulk Ads Updated", variant: "secondary" },
  bulk_adgroups_updated: { label: "Bulk Adgroups Updated", variant: "secondary" },
  campaign_added: { label: "Campaign Added", variant: "default" },
  campaign_deleted: { label: "Campaign Deleted", variant: "destructive" },
  campaign_duplicated: { label: "Campaign Duplicated", variant: "secondary" },
  adset_added: { label: "Adset Added", variant: "default" },
  adset_deleted: { label: "Adset Deleted", variant: "destructive" },
  adset_duplicated: { label: "Adset Duplicated", variant: "secondary" },
  ad_added: { label: "Ad Added", variant: "default" },
  ad_deleted: { label: "Ad Deleted", variant: "destructive" },
  ad_duplicated: { label: "Ad Duplicated", variant: "secondary" },
  launch_renamed: { label: "Launch Renamed", variant: "secondary" },
};

export default function ActivityLogs() {
  const workspaceId = useWorkspace();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    const { data: rawLogs } = await supabase
      .from("activity_logs")
      .select("id, action, target_email, user_id, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!rawLogs || rawLogs.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }

    // Get unique user_ids to resolve emails
    const userIds = [...new Set(rawLogs.map((l) => l.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const entries: LogEntry[] = rawLogs.map((l) => ({
      id: l.id,
      action: l.action,
      target_email: l.target_email,
      user_email: profiles?.find((p) => p.id === l.user_id)?.email ?? "System",
      metadata: (l.metadata as Record<string, unknown>) ?? {},
      created_at: l.created_at,
    }));

    setLogs(entries);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) fetchLogs();
  }, [workspaceId, fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const info = actionLabels[log.action];
    return (
      (info?.label || log.action).toLowerCase().includes(q) ||
      log.target_email.toLowerCase().includes(q) ||
      log.user_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No activity logs yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const info = actionLabels[log.action] ?? { label: log.action, variant: "outline" as const };
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={info.variant}>{info.label}</Badge>
                    </TableCell>
                    <TableCell>{log.target_email}</TableCell>
                    <TableCell className="text-muted-foreground">{log.user_email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
