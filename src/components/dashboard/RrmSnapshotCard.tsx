import { Link } from "react-router-dom";
import { ShieldAlert, ArrowRight, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLatestHealthSnapshots, useAccountHealthConfigs } from "@/hooks/use-account-health";

export function RrmSnapshotCard() {
  const workspaceId = useWorkspace();

  let snapshots: any[] = [];
  let configs: any[] = [];

  try {
    const snapshotQuery = useLatestHealthSnapshots(workspaceId);
    snapshots = snapshotQuery.data ?? [];
  } catch {
    snapshots = [];
  }

  try {
    const configQuery = useAccountHealthConfigs(workspaceId);
    configs = configQuery.data ?? [];
  } catch {
    configs = [];
  }

  const atRisk = snapshots.filter((s: any) => s.health_state === "risk").length;
  const recovery = snapshots.filter((s: any) => s.health_state === "recovery").length;
  const autoMaintain = snapshots.filter((s: any) => s.health_state === "auto_maintain" || s.health_state === "safe").length;

  const avgRejection = snapshots.length > 0
    ? (snapshots.reduce((sum: number, s: any) => sum + (s.rejection_ratio ?? 0), 0) / snapshots.length).toFixed(2)
    : "0.00";

  const avgThreshold = configs.length > 0
    ? (configs.reduce((sum: number, c: any) => sum + (c.rejection_threshold ?? 1), 0) / configs.length).toFixed(2)
    : "1.00";

  const stats = [
    { label: "At Risk", value: atRisk, icon: ShieldAlert, color: "text-destructive" },
    { label: "Recovery", value: recovery, icon: RefreshCw, color: "text-amber-500" },
    { label: "Auto-Maintain", value: autoMaintain, icon: Activity, color: "text-emerald-500" },
    { label: "Rejection %", value: `${avgRejection}%`, icon: AlertTriangle, color: "text-muted-foreground" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">RRM Snapshot</CardTitle>
          <Badge variant="outline" className="text-[10px]">Threshold: {avgThreshold}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div>
                <p className="text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/rrm"
          className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 pt-1"
        >
          Open RRM <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
