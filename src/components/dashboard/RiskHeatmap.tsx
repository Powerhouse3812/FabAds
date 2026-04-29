import { useState } from "react";
import { Grid3X3, List, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, AlertOctagon, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLatestHealthSnapshots, useAccountHealthConfigs } from "@/hooks/use-account-health";
import { useFbConnection } from "@/hooks/use-fb-connection";

function getStatusInfo(state: string) {
  switch (state) {
    case "warning":
      return { label: "Warning", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" };
    case "risk":
      return { label: "Risk", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10" };
    case "critical":
      return { label: "Critical", icon: AlertOctagon, color: "text-red-700", bg: "bg-red-700/15" };
    case "blocked":
      return { label: "Blocked", icon: Ban, color: "text-slate-500", bg: "bg-slate-500/10" };
    case "recovery":
      return { label: "Recovery", icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-500/10" };
    default:
      return { label: "Safe", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  }
}

export function RiskHeatmap() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const workspaceId = useWorkspace();
  const { adAccounts } = useFbConnection();

  let snapshots: any[] = [];
  let configs: any[] = [];

  try {
    const sq = useLatestHealthSnapshots(workspaceId);
    snapshots = sq.data ?? [];
  } catch { snapshots = []; }

  try {
    const cq = useAccountHealthConfigs(workspaceId);
    configs = cq.data ?? [];
  } catch { configs = []; }

  const configMap = new Map(configs.map((c: any) => [c.fb_ad_account_id, c]));
  const adAccountMap = new Map(adAccounts.map((a) => [a.id, a.name]));

  const items = snapshots.map((s: any) => {
    const cfg = configMap.get(s.fb_ad_account_id);
    const ratio = s.rejection_ratio ?? 0;
    const threshold = cfg?.rejection_threshold ?? 1;
    const delta = +(ratio - threshold).toFixed(2);
    return {
      id: s.fb_ad_account_id,
      name: adAccountMap.get(s.fb_ad_account_id) || s.fb_ad_account_id.slice(0, 12),
      ratio,
      threshold,
      delta,
      state: s.health_state,
    };
  });

  const dummyItems = [
    { id: "1",  name: "ShopMax Direct",  ratio: 0.12, threshold: 1.00, delta: -0.88, state: "safe" },
    { id: "2",  name: "Acme Corp EU",    ratio: 0.38, threshold: 1.00, delta: -0.62, state: "safe" },
    { id: "3",  name: "BrandX Global",   ratio: 0.82, threshold: 1.00, delta: -0.18, state: "warning" },
    { id: "4",  name: "NovaBuy US",      ratio: 0.78, threshold: 1.00, delta: -0.22, state: "recovery" },
    { id: "5",  name: "TrendWave Media", ratio: 1.15, threshold: 1.00, delta: 0.15,  state: "risk" },
    { id: "6",  name: "Apex Digital",    ratio: 1.42, threshold: 1.00, delta: 0.42,  state: "risk" },
    { id: "7",  name: "Pulse Ads UK",    ratio: 2.35, threshold: 1.00, delta: 1.35,  state: "critical" },
    { id: "8",  name: "Summit Growth",   ratio: 0.65, threshold: 0.80, delta: -0.15, state: "recovery" },
    { id: "9",  name: "FreshCart APAC",  ratio: 0.45, threshold: 1.20, delta: -0.75, state: "safe" },
    { id: "10", name: "Vortex Ads ME",   ratio: 0.00, threshold: 1.00, delta: -1.00, state: "blocked" },
  ];

  const displayItems = items.length > 0 ? items : dummyItems;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Risk Heatmap</CardTitle>
          <div className="flex gap-1 border border-border rounded-md p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1 rounded", view === "grid" ? "bg-secondary" : "hover:bg-secondary/50")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1 rounded", view === "list" ? "bg-secondary" : "hover:bg-secondary/50")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === "grid" ? (
          <div className="grid grid-cols-2 gap-2">
            {displayItems.map((item) => {
              const info = getStatusInfo(item.state);
              return (
                 <div key={item.id} className={cn("rounded-lg p-2.5 border border-border", info.bg)}>
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className={cn("text-base font-bold", info.color)}>{item.ratio}%</p>
                  <p className="text-[10px] text-muted-foreground">Δ {item.delta > 0 ? "+" : ""}{item.delta}%</p>
                </div>
              );
            })}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Account</TableHead>
                <TableHead className="text-xs text-right">Ratio</TableHead>
                <TableHead className="text-xs text-right">Threshold</TableHead>
                <TableHead className="text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayItems.map((item) => {
                const info = getStatusInfo(item.state);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{item.name}</TableCell>
                    <TableCell className="text-sm text-right">{item.ratio}%</TableCell>
                    <TableCell className="text-sm text-right">{item.threshold}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.state === "risk" || item.state === "critical" ? "destructive" : item.state === "blocked" ? "outline" : "secondary"} className="text-[10px]">
                        {info.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
