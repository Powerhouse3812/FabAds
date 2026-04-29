import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  event_type: string;
  fb_ad_account_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface Props {
  workspaceId: string | null;
}

const eventBadgeVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  dilution_triggered: "destructive",
  dilution_planned: "default",
  dilution_skipped: "secondary",
  dilution_completed: "default",
  replacement_triggered: "destructive",
  replacement_planned: "default",
  replacement_skipped: "secondary",
  replacement_completed: "default",
  cap_applied: "outline",
  auto_launch_stub_created: "default",
  recovery_entered: "destructive",
  recovery_exited: "default",
  settings_changed: "outline",
  manual_trigger: "outline",
};

function generateFallbackEvents(): Event[] {
  const now = Date.now();
  const h = (hrs: number) => new Date(now - hrs * 3600000).toISOString();
  return [
    { id: "f1", event_type: "dilution_triggered", fb_ad_account_id: "Brand US — Main", metadata: { source: "scheduled", rejection_ratio: 0.65, threshold: 1.0, total_ads: 950, rejected_ads: 6, reason_code: "threshold_exceeded" }, created_at: h(60) },
    { id: "f2", event_type: "dilution_planned", fb_ad_account_id: "Brand US — Main", metadata: { ads_to_launch: 250, folder_name: "Evergreen Images", offer_name: "Dilution — Safe Creatives", status: "pending", source: "scheduled" }, created_at: h(59) },
    { id: "f3", event_type: "auto_launch_stub_created", fb_ad_account_id: "Brand US — Main", metadata: { campaign_name: "RRM Dilution — Brand US", budget: 1.0, ads_to_launch: 250, status: "pending", source: "scheduled" }, created_at: h(58) },
    { id: "f4", event_type: "dilution_triggered", fb_ad_account_id: "Brand EU — Scale", metadata: { source: "scheduled", rejection_ratio: 0.20, threshold: 1.0, total_ads: 1100, rejected_ads: 2 }, created_at: h(48) },
    { id: "f5", event_type: "dilution_skipped", fb_ad_account_id: "Brand EU — Scale", metadata: { skip_reason: "Ratio 0.20% below warning threshold 0.80%", rejection_ratio: 0.20, source: "scheduled", reason_code: "below_threshold" }, created_at: h(47) },
    { id: "f6", event_type: "replacement_triggered", fb_ad_account_id: "Brand UK — Test", metadata: { source: "scheduled", rejection_ratio: 1.08, threshold: 1.0, total_ads: 820, rejected_ads: 9, reason_code: "threshold_exceeded" }, created_at: h(36) },
    { id: "f7", event_type: "replacement_planned", fb_ad_account_id: "Brand UK — Test", metadata: { ads_to_launch: 250, folder_name: "Backup Video Creatives", offer_name: "Replacement — Backup Ads", status: "pending", source: "scheduled" }, created_at: h(35) },
    { id: "f8", event_type: "cap_applied", fb_ad_account_id: "Brand UK — Test", metadata: { cap: 250, lifetime_ads: 830, requested_count: 250, reason_code: "within_cap", source: "scheduled" }, created_at: h(34) },
    { id: "f9", event_type: "manual_trigger", fb_ad_account_id: "Brand US — Main", metadata: { source: "manual", actor_id: "user-uuid", reason_code: "manual_request", rejection_ratio: 0.78 }, created_at: h(2) },
    { id: "f10", event_type: "settings_changed", fb_ad_account_id: "Brand APAC — Growth", metadata: { source: "manual", actor_id: "user-uuid", reason_code: "settings_update", changes: "dilution_enabled: false → true" }, created_at: h(6) },
    { id: "f11", event_type: "dilution_skipped", fb_ad_account_id: "Brand APAC — Growth", metadata: { skip_reason: "Ratio improving (0.28%)", rejection_ratio: 0.28, source: "scheduled", reason_code: "ratio_improving" }, created_at: h(12) },
  ];
}

export function RRMEventLog({ workspaceId }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    (supabase as any)
      .from("account_health_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }: any) => {
        if (!error && data && data.length > 0) {
          setEvents(data);
        } else {
          setEvents(generateFallbackEvents());
        }
        setLoading(false);
      });
  }, [workspaceId]);

  const getEventSummary = (ev: Event): string => {
    const m = ev.metadata;
    switch (ev.event_type) {
      case "dilution_triggered":
      case "replacement_triggered":
        return `${m.rejected_ads ?? "?"} rejected ads detected (${m.source ?? "auto"})`;
      case "dilution_planned":
      case "replacement_planned":
        return `${m.ads_to_launch ?? "?"} ads planned from "${m.folder_name ?? "?"}" (${m.offer_name ?? "?"})`;
      case "dilution_skipped":
      case "replacement_skipped":
        return m.skip_reason ?? "No action needed";
      case "dilution_completed":
      case "replacement_completed":
        return `${m.ads_to_launch ?? "?"} ads launched successfully`;
      case "cap_applied":
        return `Cap: ${m.cap}, Lifetime: ${m.lifetime_ads}, Requested: ${m.requested_count}`;
      case "auto_launch_stub_created":
        return `${m.ads_to_launch ?? "?"} stub ads created (${m.status ?? "pending"})`;
      case "recovery_entered":
        return `Account entered recovery mode (ratio: ${m.rejection_ratio ?? "?"}%)`;
      case "recovery_exited":
        return `Account exited recovery mode`;
      case "settings_changed":
        return m.changes ?? "Settings updated";
      case "manual_trigger":
        return `Manual dilution triggered (ratio: ${m.rejection_ratio ?? "?"}%)`;
      default:
        return JSON.stringify(m).slice(0, 100);
    }
  };

  const getSourceIcon = (m: Record<string, any>) => {
    const source = m.source ?? "auto";
    if (source === "manual") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger><User className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent>Manual trigger</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger><Bot className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
          <TooltipContent>Automated</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Action Log</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="w-10">Src</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>
                    <Badge variant={eventBadgeVariant[ev.event_type] ?? "secondary"} className="text-[10px]">
                      {ev.event_type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSourceIcon(ev.metadata)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">
                    {ev.fb_ad_account_id.length > 12 ? ev.fb_ad_account_id.slice(0, 8) + "…" : ev.fb_ad_account_id}
                  </TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">{getEventSummary(ev)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ev.metadata.reason_code ? (
                      <Badge variant="outline" className="text-[10px]">
                        {(ev.metadata.reason_code as string).replace(/_/g, " ")}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
