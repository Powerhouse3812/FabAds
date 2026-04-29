import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignUrlReplacementLink {
  id: string;
  campaign_url_id: string;
  workspace_id: string;
  url: string;
  created_at: string;
}

export function useCampaignUrlReplacementLinks(campaignUrlId: string | null) {
  return useQuery({
    queryKey: ["campaign-url-replacement-links", campaignUrlId],
    enabled: !!campaignUrlId,
    queryFn: async (): Promise<CampaignUrlReplacementLink[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_replacement_links")
        .select("*")
        .eq("campaign_url_id", campaignUrlId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddCampaignUrlReplacementLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { campaign_url_id: string; workspace_id: string; url: string }) => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_replacement_links")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as CampaignUrlReplacementLink;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-replacement-links", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-urls"] });
    },
  });
}

export function useDeleteCampaignUrlReplacementLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; campaign_url_id: string }) => {
      const { error } = await (supabase as any)
        .from("campaign_url_replacement_links")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-replacement-links", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-urls"] });
    },
  });
}
