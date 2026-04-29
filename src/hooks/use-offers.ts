import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Offer {
  id: string;
  workspace_id: string;
  name: string;
  tracking_url: string | null;
  pixel_id: string | null;
  targeting_template_id: string | null;
  campaign_config: Record<string, unknown>;
  adset_config: Record<string, unknown>;
  ads_config: Record<string, unknown>;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OfferWithCounts extends Offer {
  linked_accounts: number;
  linked_pages: number;
  ads_count: number;
  folders_count: number;
  assets_count: number;
  replacement_links_count: number;
}

export interface OfferAd {
  id: string;
  offer_id: string;
  workspace_id: string;
  sort_order: number;
  name: string;
  ad_format: string;
  primary_text: string | null;
  headline: string | null;
  description: string | null;
  cta: string | null;
  destination_url: string | null;
  display_link: string | null;
  media_type: string | null;
  media_urls: string[];
  carousel_cards: Record<string, unknown>[];
  collection_config: Record<string, unknown>;
  created_at: string | null;
}

export function useOffers(workspaceId: string | null) {
  return useQuery({
    queryKey: ["offers", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<OfferWithCounts[]> => {
      const { data: offers, error } = await (supabase as any)
        .from("campaign_urls")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!offers || offers.length === 0) return [];

      const offerIds = offers.map((o: Offer) => o.id);

      const [{ data: accLinks }, { data: pageLinks }, { data: adLinks }, { data: folderLinks }, { data: replacementLinks }] = await Promise.all([
        (supabase as any).from("campaign_url_ad_accounts").select("campaign_url_id").in("campaign_url_id", offerIds),
        (supabase as any).from("campaign_url_pages").select("campaign_url_id").in("campaign_url_id", offerIds),
        (supabase as any).from("campaign_url_ads").select("campaign_url_id").in("campaign_url_id", offerIds),
        (supabase as any).from("campaign_url_cl_folder_links").select("cl_folder_id, campaign_url_id").in("campaign_url_id", offerIds),
        (supabase as any).from("campaign_url_replacement_links").select("campaign_url_id").in("campaign_url_id", offerIds),
      ]);

      const accCounts: Record<string, number> = {};
      const pageCounts: Record<string, number> = {};
      const adCounts: Record<string, number> = {};
      const folderCounts: Record<string, number> = {};
      for (const a of accLinks || []) accCounts[a.campaign_url_id] = (accCounts[a.campaign_url_id] || 0) + 1;
      for (const p of pageLinks || []) pageCounts[p.campaign_url_id] = (pageCounts[p.campaign_url_id] || 0) + 1;
      for (const ad of adLinks || []) adCounts[ad.campaign_url_id] = (adCounts[ad.campaign_url_id] || 0) + 1;
      for (const f of folderLinks || []) folderCounts[f.campaign_url_id] = (folderCounts[f.campaign_url_id] || 0) + 1;
      const replacementCounts: Record<string, number> = {};
      for (const r of replacementLinks || []) replacementCounts[r.campaign_url_id] = (replacementCounts[r.campaign_url_id] || 0) + 1;

      // Get asset counts per cl_folder
      const folderIds = (folderLinks || []).map((f: any) => f.cl_folder_id);
      let assetCounts: Record<string, number> = {};
      if (folderIds.length > 0) {
        const { data: items } = await (supabase as any)
          .from("cl_folder_items")
          .select("folder_id")
          .in("folder_id", folderIds);
        const folderToOffer: Record<string, string> = {};
        for (const f of folderLinks || []) folderToOffer[f.cl_folder_id] = f.campaign_url_id;
        for (const item of items || []) {
          const oid = folderToOffer[item.folder_id];
          if (oid) assetCounts[oid] = (assetCounts[oid] || 0) + 1;
        }
      }

      return offers.map((o: Offer) => ({
        ...o,
        linked_accounts: accCounts[o.id] || 0,
        linked_pages: pageCounts[o.id] || 0,
        ads_count: adCounts[o.id] || 0,
        folders_count: folderCounts[o.id] || 0,
        assets_count: assetCounts[o.id] || 0,
        replacement_links_count: replacementCounts[o.id] || 0,
      }));
    },
  });
}

export function useOffer(offerId: string | null) {
  return useQuery({
    queryKey: ["offer", offerId],
    enabled: !!offerId,
    queryFn: async () => {
      const { data: offer, error } = await (supabase as any)
        .from("campaign_urls")
        .select("*")
        .eq("id", offerId)
        .single();
      if (error) throw error;

      const [{ data: accLinks }, { data: pageLinks }, { data: ads }] = await Promise.all([
        (supabase as any).from("campaign_url_ad_accounts").select("fb_ad_account_id").eq("campaign_url_id", offerId),
        (supabase as any).from("campaign_url_pages").select("page_id").eq("campaign_url_id", offerId),
        (supabase as any).from("campaign_url_ads").select("*").eq("campaign_url_id", offerId).order("sort_order"),
      ]);

      return {
        ...offer,
        linked_account_ids: (accLinks || []).map((a: any) => a.fb_ad_account_id),
        linked_page_ids: (pageLinks || []).map((p: any) => p.page_id),
        offer_ads: (ads || []) as OfferAd[],
      };
    },
  });
}

export function useOfferAds(offerId: string | null) {
  return useQuery({
    queryKey: ["offer-ads", offerId],
    enabled: !!offerId,
    queryFn: async (): Promise<OfferAd[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_ads")
        .select("*")
        .eq("campaign_url_id", offerId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      workspace_id: string;
      name: string;
      tracking_url?: string | null;
      pixel_id?: string | null;
      targeting_template_id?: string | null;
      campaign_config?: Record<string, unknown>;
      adset_config?: Record<string, unknown>;
      ads_config?: Record<string, unknown>;
      linked_account_ids?: string[];
      linked_page_ids?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { linked_account_ids, linked_page_ids, ...offerData } = payload;
      const { data: offer, error } = await (supabase as any)
        .from("campaign_urls")
        .insert({ ...offerData, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      const promises: Promise<any>[] = [];
      if (linked_account_ids?.length) {
        promises.push(
          (supabase as any).from("campaign_url_ad_accounts").insert(
            linked_account_ids.map((id) => ({ campaign_url_id: offer.id, fb_ad_account_id: id, workspace_id: payload.workspace_id }))
          )
        );
      }
      if (linked_page_ids?.length) {
        promises.push(
          (supabase as any).from("campaign_url_pages").insert(
            linked_page_ids.map((id) => ({ campaign_url_id: offer.id, page_id: id, workspace_id: payload.workspace_id }))
          )
        );
      }
      await Promise.all(promises);
      return offer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      workspace_id: string;
      name: string;
      tracking_url?: string | null;
      pixel_id?: string | null;
      targeting_template_id?: string | null;
      campaign_config?: Record<string, unknown>;
      adset_config?: Record<string, unknown>;
      ads_config?: Record<string, unknown>;
      linked_account_ids?: string[];
      linked_page_ids?: string[];
    }) => {
      const { linked_account_ids, linked_page_ids, id, workspace_id, ...offerData } = payload;
      const { error } = await (supabase as any).from("campaign_urls").update(offerData).eq("id", id);
      if (error) throw error;

      // Sync linked accounts + pages in parallel
      await Promise.all([
        (supabase as any).from("campaign_url_ad_accounts").delete().eq("campaign_url_id", id),
        (supabase as any).from("campaign_url_pages").delete().eq("campaign_url_id", id),
      ]);

      const inserts: Promise<any>[] = [];
      if (linked_account_ids?.length) {
        inserts.push(
          (supabase as any).from("campaign_url_ad_accounts").insert(
            linked_account_ids.map((accId) => ({ campaign_url_id: id, fb_ad_account_id: accId, workspace_id }))
          )
        );
      }
      if (linked_page_ids?.length) {
        inserts.push(
          (supabase as any).from("campaign_url_pages").insert(
            linked_page_ids.map((pageId) => ({ campaign_url_id: id, page_id: pageId, workspace_id }))
          )
        );
      }
      await Promise.all(inserts);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["offer"] });
    },
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("campaign_urls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });
}

// ─── Offer Ads CRUD ───

export function useCreateOfferAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<OfferAd> & { offer_id: string; workspace_id: string }) => {
      const { offer_id, ...rest } = payload;
      const { data, error } = await (supabase as any)
        .from("campaign_url_ads")
        .insert({ ...rest, campaign_url_id: offer_id })
        .select()
        .single();
      if (error) throw error;
      return data as OfferAd;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-ads", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offer", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useUpdateOfferAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; offer_id: string } & Partial<OfferAd>) => {
      const { id, offer_id, ...rest } = payload;
      const { error } = await (supabase as any).from("campaign_url_ads").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-ads", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offer", vars.offer_id] });
    },
  });
}

export function useDeleteOfferAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; offer_id: string }) => {
      const { error } = await (supabase as any).from("campaign_url_ads").delete().eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-ads", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offer", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}
