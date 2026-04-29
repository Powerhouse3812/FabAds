import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignUrlTargetingLink {
  id: string;
  campaign_url_id: string;
  targeting_template_id: string;
  is_default: boolean;
  sort_order: number;
  workspace_id: string;
  created_at: string;
}

export function useCampaignUrlTargetingLinks(campaignUrlId: string | null) {
  return useQuery({
    queryKey: ["campaign-url-targeting-links", campaignUrlId],
    enabled: !!campaignUrlId,
    queryFn: async (): Promise<CampaignUrlTargetingLink[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_targeting_links")
        .select("*")
        .eq("campaign_url_id", campaignUrlId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddCampaignUrlTargetingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      campaign_url_id: string;
      targeting_template_id: string;
      workspace_id: string;
      is_default?: boolean;
    }) => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_targeting_links")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as CampaignUrlTargetingLink;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-targeting-links", vars.campaign_url_id] });
    },
  });
}

export function useRemoveCampaignUrlTargetingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; campaign_url_id: string }) => {
      const { error } = await (supabase as any)
        .from("campaign_url_targeting_links")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-targeting-links", vars.campaign_url_id] });
    },
  });
}

export function useSetDefaultTargetingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { campaign_url_id: string; link_id: string }) => {
      // Unset all defaults for this campaign URL
      await (supabase as any)
        .from("campaign_url_targeting_links")
        .update({ is_default: false })
        .eq("campaign_url_id", payload.campaign_url_id);

      // Set new default
      const { error } = await (supabase as any)
        .from("campaign_url_targeting_links")
        .update({ is_default: true })
        .eq("id", payload.link_id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-targeting-links", vars.campaign_url_id] });
    },
  });
}
