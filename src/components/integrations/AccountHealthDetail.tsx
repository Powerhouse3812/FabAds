import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountHealthEvents, useUpsertHealthConfig } from "@/hooks/use-account-health";
import type { HealthConfig, HealthSnapshot } from "@/hooks/use-account-health";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  accountId: string;
  workspaceId: string;
  snapshot?: HealthSnapshot | null;
  config?: HealthConfig | null;
}

export default function AccountHealthDetail({ accountId, workspaceId, snapshot, config }: Props) {
  const [mode, setMode] = useState(config?.guardrail_mode || "off");
  const [rejThreshold, setRejThreshold] = useState(config?.rejection_threshold ?? 1.0);
  const [warnThreshold, setWarnThreshold] = useState(config?.warning_threshold ?? 0.8);
  const upsert = useUpsertHealthConfig();
  const { data: events, isLoading: eventsLoading } = useAccountHealthEvents(accountId);
  const { role } = useAuth();
  const isOwnerOrAdmin = role === "owner" || role === "admin";
  const [dilutionLoading, setDilutionLoading] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setMode(config?.guardrail_mode || "off");
    setRejThreshold(config?.rejection_threshold ?? 1.0);
    setWarnThreshold(config?.warning_threshold ?? 0.8);
  }, [config]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        workspace_id: workspaceId,
        fb_ad_account_id: accountId,
        guardrail_mode: mode,
        rejection_threshold: rejThreshold,
        warning_threshold: warnThreshold,
      });
      toast({ title: "Guardrail config saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const handleRunDilution = async () => {
    setDilutionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dilution-check", {
        body: { workspace_id: workspaceId, fb_ad_account_id: accountId, source: "manual" },
      });
      if (error) throw error;

      const results = data?.results || [];
      const r = results[0];
      if (!r) {
        toast({ title: "No accounts processed" });
      } else if (r.status === "planned") {
        toast({
          title: "Dilution planned",
          description: `${r.ads_to_launch} ads planned from "${r.folder_name}" (${r.offer_name})`,
        });
      } else {
        toast({
          title: "Dilution skipped",
          description: r.reason || "No action needed",
        });
      }

      qc.invalidateQueries({ queryKey: ["health-events", accountId] });
    } catch (err: any) {
      toast({ title: "Dilution check failed", description: err.message, variant: "destructive" });
    } finally {
      setDilutionLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-5 bg-muted/30 border-t border-border">
      {/* Health Summary */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-1">Health Summary</h4>
        {snapshot && snapshot.rejection_ratio !== null ? (
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Approved:</span>{" "}
              <span className="font-medium">{snapshot.approved_ads ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rejected:</span>{" "}
              <span className="font-medium">{snapshot.rejected_ads ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">{snapshot.total_ads ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ratio:</span>{" "}
              <span className="font-medium">{snapshot.rejection_ratio}%</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not synced yet — health data unavailable. Sync to create initial snapshots.
          </p>
        )}
      </div>

      {/* Guardrail Mode */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Guardrail Mode</h4>
        <RadioGroup value={mode} onValueChange={setMode} className="space-y-2">
          <div className="flex items-start gap-2">
            <RadioGroupItem value="off" id={`mode-off-${accountId}`} />
            <Label htmlFor={`mode-off-${accountId}`} className="text-sm">
              <span className="font-medium">OFF</span>
              <span className="text-muted-foreground ml-1">— No monitoring</span>
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem value="monitor" id={`mode-monitor-${accountId}`} />
            <Label htmlFor={`mode-monitor-${accountId}`} className="text-sm">
              <span className="font-medium">Monitor-only</span>
              <span className="text-muted-foreground ml-1">— Track & alert, no auto-action</span>
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem value="auto_maintain" id={`mode-auto-${accountId}`} />
            <Label htmlFor={`mode-auto-${accountId}`} className="text-sm">
              <span className="font-medium">Auto-maintain</span>
              <span className="text-muted-foreground ml-1">— Automatic actions when thresholds crossed</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Thresholds */}
      {mode !== "off" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Warning threshold (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={warnThreshold}
              onChange={(e) => setWarnThreshold(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Rejection threshold (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={rejThreshold}
              onChange={(e) => setRejThreshold(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Save Config
        </Button>

        {mode === "auto_maintain" && isOwnerOrAdmin && (
          <Button size="sm" variant="outline" onClick={handleRunDilution} disabled={dilutionLoading}>
            {dilutionLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Run Dilution Check
          </Button>
        )}
      </div>

      {/* Recent Events */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Recent Events</h4>
        {eventsLoading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : events && events.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="text-sm font-medium">{ev.event_type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {JSON.stringify(ev.metadata)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ev.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No events recorded yet.</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Event types <code>ad_rejected</code>, <code>ad_deleted</code>, <code>ad_archived</code>,{" "}
          <code>ad_missing</code> will activate when per-ad inventory sync is available.
        </p>
      </div>
    </div>
  );
}
