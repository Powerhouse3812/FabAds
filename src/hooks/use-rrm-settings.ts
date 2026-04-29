import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RRMAccountSetting {
  id: string;
  workspace_id: string;
  fb_ad_account_id: string;
  dilution_enabled: boolean;
  dilution_campaign_url_id: string | null;
  replacement_enabled: boolean;
  replacement_campaign_url_id: string | null;
  auto_launch_override: boolean;
  auto_launch_enabled: boolean;
  ad_name_append: string | null;
  selected_page_ids: string[];
  ad_name_prefix_override: string | null;
  warning_threshold_override: number | null;
  rejection_threshold_override: number | null;
  recovery_threshold_override: number | null;
  pause_rate_override: number | null;
  dilution_links_source: string | null;
  replacement_links_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface RRMGlobalSettings {
  id: string;
  workspace_id: string;
  auto_launch_enabled: boolean;
  auto_launch_delay_minutes: number;
  ad_name_append: string;
  default_dilution_campaign_url_id: string | null;
  default_replacement_campaign_url_id: string | null;
  dilution_enabled: boolean;
  replacement_enabled: boolean;
  dilution_ad_name_prefix: string;
  replacement_ad_name_prefix: string;
  check_interval_minutes: number;
  warning_threshold: number;
  rejection_threshold: number;
  recovery_threshold: number;
  pause_rate: number;
  dilution_links_source: string;
  replacement_links_source: string;
  created_at: string;
  updated_at: string;
}

export interface RRMLink {
  id: string;
  workspace_id: string;
  link_type: string;
  url: string;
  label: string | null;
  created_at: string;
}

export interface RRMAccountLink extends RRMLink {
  fb_ad_account_id: string;
}

// ── Global Settings ──

export function useRRMGlobalSettings(workspaceId: string | null) {
  return useQuery({
    queryKey: ["rrm-global-settings", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<RRMGlobalSettings | null> => {
      const { data, error } = await (supabase as any)
        .from("rrm_global_settings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertRRMGlobalSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      workspace_id: string;
      auto_launch_enabled?: boolean;
      auto_launch_delay_minutes?: number;
      ad_name_append?: string;
      default_dilution_campaign_url_id?: string | null;
      default_replacement_campaign_url_id?: string | null;
      dilution_enabled?: boolean;
      replacement_enabled?: boolean;
      dilution_ad_name_prefix?: string;
      replacement_ad_name_prefix?: string;
      check_interval_minutes?: number;
      warning_threshold?: number;
      rejection_threshold?: number;
      recovery_threshold?: number;
      pause_rate?: number;
      dilution_links_source?: string;
      replacement_links_source?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("rrm_global_settings")
        .upsert(payload, { onConflict: "workspace_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-global-settings"] }),
  });
}

// ── Account Settings ──

export function useRRMAccountSettings(workspaceId: string | null) {
  return useQuery({
    queryKey: ["rrm-account-settings", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<RRMAccountSetting[]> => {
      const { data, error } = await (supabase as any)
        .from("rrm_account_settings")
        .select("*")
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpsertRRMSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      workspace_id: string;
      fb_ad_account_id: string;
      dilution_enabled?: boolean;
      dilution_campaign_url_id?: string | null;
      replacement_enabled?: boolean;
      replacement_campaign_url_id?: string | null;
      auto_launch_override?: boolean;
      auto_launch_enabled?: boolean;
      ad_name_append?: string | null;
      selected_page_ids?: string[];
      ad_name_prefix_override?: string | null;
      warning_threshold_override?: number | null;
      rejection_threshold_override?: number | null;
      recovery_threshold_override?: number | null;
      pause_rate_override?: number | null;
      dilution_links_source?: string | null;
      replacement_links_source?: string | null;
    }) => {
      const { error } = await (supabase as any)
        .from("rrm_account_settings")
        .upsert(payload, { onConflict: "workspace_id,fb_ad_account_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-account-settings"] }),
  });
}

export function useBulkUpsertRRMSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: {
      workspace_id: string;
      fb_ad_account_id: string;
      dilution_enabled?: boolean;
      dilution_campaign_url_id?: string | null;
      replacement_enabled?: boolean;
      replacement_campaign_url_id?: string | null;
    }[]) => {
      const { error } = await (supabase as any)
        .from("rrm_account_settings")
        .upsert(rows, { onConflict: "workspace_id,fb_ad_account_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-account-settings"] }),
  });
}

export function useResetAccountToGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { workspace_id: string; fb_ad_account_id: string }) => {
      const { error } = await (supabase as any)
        .from("rrm_account_settings")
        .update({
          ad_name_prefix_override: null,
          warning_threshold_override: null,
          rejection_threshold_override: null,
          recovery_threshold_override: null,
          pause_rate_override: null,
          dilution_links_source: null,
          replacement_links_source: null,
          auto_launch_override: false,
          ad_name_append: null,
        })
        .eq("workspace_id", payload.workspace_id)
        .eq("fb_ad_account_id", payload.fb_ad_account_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-account-settings"] }),
  });
}

// ── Global Links ──

export function useRRMGlobalLinks(workspaceId: string | null) {
  return useQuery({
    queryKey: ["rrm-global-links", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<RRMLink[]> => {
      const { data, error } = await (supabase as any)
        .from("rrm_global_links")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddRRMGlobalLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { workspace_id: string; link_type: string; url: string; label?: string }) => {
      const { error } = await (supabase as any)
        .from("rrm_global_links")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-global-links"] }),
  });
}

export function useDeleteRRMGlobalLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("rrm_global_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-global-links"] }),
  });
}

// ── Account Links ──

export function useRRMAccountLinks(workspaceId: string | null, fbAdAccountId: string | null) {
  return useQuery({
    queryKey: ["rrm-account-links", workspaceId, fbAdAccountId],
    enabled: !!workspaceId && !!fbAdAccountId,
    queryFn: async (): Promise<RRMAccountLink[]> => {
      const { data, error } = await (supabase as any)
        .from("rrm_account_links")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("fb_ad_account_id", fbAdAccountId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddRRMAccountLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { workspace_id: string; fb_ad_account_id: string; link_type: string; url: string; label?: string }) => {
      const { error } = await (supabase as any)
        .from("rrm_account_links")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-account-links"] }),
  });
}

export function useDeleteRRMAccountLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("rrm_account_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rrm-account-links"] }),
  });
}

// ── Campaign URLs (for RRM) ──

export interface RRMCampaignUrl {
  id: string;
  name: string;
  campaign_url_type: string;
  status: string;
  created_at: string;
  targeting_template_id: string | null;
  targeting_template_name: string | null;
  folders: { id: string; name: string }[];
}

export function useRRMCampaignUrls(workspaceId: string | null) {
  return useQuery({
    queryKey: ["rrm-campaign-urls", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<RRMCampaignUrl[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_urls")
        .select("id, name, campaign_url_type, status, created_at, targeting_template_id, targeting_templates(name), campaign_url_cl_folder_links(cl_folder_id, cl_folders!inner(id, name))")
        .eq("workspace_id", workspaceId)
        .in("campaign_url_type", ["rrm_dilution", "rrm_replacement"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        campaign_url_type: o.campaign_url_type,
        status: o.status,
        created_at: o.created_at,
        targeting_template_id: o.targeting_template_id,
        targeting_template_name: o.targeting_templates?.name ?? null,
        folders: (o.campaign_url_cl_folder_links || []).map((l: any) => l.cl_folders).filter(Boolean),
      }));
    },
  });
}
