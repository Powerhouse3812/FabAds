import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OfferReplacementLink {
  id: string;
  offer_id: string;
  workspace_id: string;
  url: string;
  created_at: string;
}

export function useOfferReplacementLinks(offerId: string | null) {
  return useQuery({
    queryKey: ["offer-replacement-links", offerId],
    enabled: !!offerId,
    queryFn: async (): Promise<OfferReplacementLink[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_replacement_links")
        .select("*")
        .eq("campaign_url_id", offerId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((d: any) => ({ ...d, offer_id: d.campaign_url_id }));
    },
  });
}

export function useAddOfferReplacementLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { offer_id: string; workspace_id: string; url: string }) => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_replacement_links")
        .insert({ campaign_url_id: payload.offer_id, workspace_id: payload.workspace_id, url: payload.url })
        .select()
        .single();
      if (error) throw error;
      return { ...data, offer_id: data.campaign_url_id } as OfferReplacementLink;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-replacement-links", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useDeleteOfferReplacementLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; offer_id: string }) => {
      const { error } = await (supabase as any)
        .from("campaign_url_replacement_links")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-replacement-links", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}
