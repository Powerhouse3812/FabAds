import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HealthConfig {
  id: string;
  workspace_id: string;
  fb_ad_account_id: string;
  guardrail_mode: string;
  rejection_threshold: number;
  warning_threshold: number;
}

export interface HealthSnapshot {
  id: string;
  workspace_id: string;
  fb_ad_account_id: string;
  sync_status: string;
  approved_ads: number | null;
  rejected_ads: number | null;
  total_ads: number | null;
  rejection_ratio: number | null;
  health_state: string;
  last_synced_at: string | null;
  snapshot_at: string;
}

export interface HealthEvent {
  id: string;
  workspace_id: string;
  fb_ad_account_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useAccountHealthConfigs(workspaceId: string | null) {
  return useQuery({
    queryKey: ["account-health-configs", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<HealthConfig[]> => {
      const { data, error } = await (supabase as any)
        .from("account_health_config")
        .select("*")
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLatestHealthSnapshots(workspaceId: string | null) {
  return useQuery({
    queryKey: ["health-snapshots-latest", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<HealthSnapshot[]> => {
      // Fetch ordered by account + time desc, then dedupe to latest per account
      const { data, error } = await (supabase as any)
        .from("account_health_snapshots")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("fb_ad_account_id")
        .order("snapshot_at", { ascending: false });
      if (error) throw error;
      if (!data) return [];
      // Keep only the first (latest) per account
      const seen = new Set<string>();
      const result: HealthSnapshot[] = [];
      for (const row of data) {
        if (!seen.has(row.fb_ad_account_id)) {
          seen.add(row.fb_ad_account_id);
          result.push(row);
        }
      }
      return result;
    },
  });
}

export function useAccountHealthEvents(accountId: string | null, limit = 20) {
  return useQuery({
    queryKey: ["health-events", accountId, limit],
    enabled: !!accountId,
    queryFn: async (): Promise<HealthEvent[]> => {
      const { data, error } = await (supabase as any)
        .from("account_health_events")
        .select("*")
        .eq("fb_ad_account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpsertHealthConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      workspace_id: string;
      fb_ad_account_id: string;
      guardrail_mode: string;
      rejection_threshold: number;
      warning_threshold: number;
    }) => {
      const { error } = await (supabase as any)
        .from("account_health_config")
        .upsert(payload, { onConflict: "workspace_id,fb_ad_account_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account-health-configs"] }),
  });
}

export function getHealthBadge(snapshot?: HealthSnapshot | null): {
  label: string;
  variant: "default" | "destructive" | "secondary" | "outline";
} {
  if (!snapshot || snapshot.health_state === "unknown") {
    return { label: "Unknown", variant: "secondary" };
  }
  if (snapshot.health_state === "risk") {
    return { label: "Risk", variant: "destructive" };
  }
  return { label: "Safe", variant: "default" };
}

export function getCapacityHint(
  snapshot?: HealthSnapshot | null,
  config?: HealthConfig | null
): string | null {
  if (!snapshot || snapshot.rejection_ratio === null || !config) return null;
  const threshold = config.rejection_threshold ?? 1.0;
  const remaining = Math.max(0, threshold - snapshot.rejection_ratio);
  return `${remaining.toFixed(2)}% capacity remaining before threshold`;
}
