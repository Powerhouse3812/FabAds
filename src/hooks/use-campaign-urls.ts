import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignUrl {
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

export interface CampaignUrlWithCounts extends CampaignUrl {
  linked_accounts: number;
  linked_pages: number;
  ads_count: number;
  folders_count: number;
  assets_count: number;
  replacement_links_count: number;
}

export interface CampaignUrlAd {
  id: string;
  campaign_url_id: string;
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

export function useCampaignUrls(workspaceId: string | null) {
  return useQuery({
    queryKey: ["campaign-urls", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<CampaignUrlWithCounts[]> => {
      const { data: items, error } = await (supabase as any)
        .from("campaign_urls")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!items || items.length === 0) return [];

      const ids = items.map((o: CampaignUrl) => o.id);

      const [{ data: accLinks }, { data: pageLinks }, { data: adLinks }, { data: folderLinks }, { data: replacementLinks }] = await Promise.all([
        (supabase as any).from("campaign_url_ad_accounts").select("campaign_url_id").in("campaign_url_id", ids),
        (supabase as any).from("campaign_url_pages").select("campaign_url_id").in("campaign_url_id", ids),
        (supabase as any).from("campaign_url_ads").select("campaign_url_id").in("campaign_url_id", ids),
        (supabase as any).from("campaign_url_folders").select("id, campaign_url_id").in("campaign_url_id", ids),
        (supabase as any).from("campaign_url_replacement_links").select("campaign_url_id").in("campaign_url_id", ids),
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

      const folderIds = (folderLinks || []).map((f: any) => f.id);
      let assetCounts: Record<string, number> = {};
      if (folderIds.length > 0) {
        const { data: fitems } = await (supabase as any)
          .from("campaign_url_folder_items")
          .select("folder_id")
          .in("folder_id", folderIds);
        const folderToParent: Record<string, string> = {};
        for (const f of folderLinks || []) folderToParent[f.id] = f.campaign_url_id;
        for (const item of fitems || []) {
          const pid = folderToParent[item.folder_id];
          if (pid) assetCounts[pid] = (assetCounts[pid] || 0) + 1;
        }
      }

      return items.map((o: CampaignUrl) => ({
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

export function useCampaignUrl(campaignUrlId: string | null) {
  return useQuery({
    queryKey: ["campaign-url", campaignUrlId],
    enabled: !!campaignUrlId,
    queryFn: async () => {
      const { data: item, error } = await (supabase as any)
        .from("campaign_urls")
        .select("*")
        .eq("id", campaignUrlId)
        .single();
      if (error) throw error;

      const [{ data: accLinks }, { data: pageLinks }, { data: ads }] = await Promise.all([
        (supabase as any).from("campaign_url_ad_accounts").select("fb_ad_account_id").eq("campaign_url_id", campaignUrlId),
        (supabase as any).from("campaign_url_pages").select("page_id").eq("campaign_url_id", campaignUrlId),
        (supabase as any).from("campaign_url_ads").select("*").eq("campaign_url_id", campaignUrlId).order("sort_order"),
      ]);

      return {
        ...item,
        linked_account_ids: (accLinks || []).map((a: any) => a.fb_ad_account_id),
        linked_page_ids: (pageLinks || []).map((p: any) => p.page_id),
        campaign_url_ads: (ads || []) as CampaignUrlAd[],
      };
    },
  });
}

export function useCampaignUrlAds(campaignUrlId: string | null) {
  return useQuery({
    queryKey: ["campaign-url-ads", campaignUrlId],
    enabled: !!campaignUrlId,
    queryFn: async (): Promise<CampaignUrlAd[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_ads")
        .select("*")
        .eq("campaign_url_id", campaignUrlId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCampaignUrl() {
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

      const { linked_account_ids, linked_page_ids, ...cuData } = payload;
      const { data: cu, error } = await (supabase as any)
        .from("campaign_urls")
        .insert({ ...cuData, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      const promises: Promise<any>[] = [];
      if (linked_account_ids?.length) {
        promises.push(
          (supabase as any).from("campaign_url_ad_accounts").insert(
            linked_account_ids.map((id) => ({ campaign_url_id: cu.id, fb_ad_account_id: id, workspace_id: payload.workspace_id }))
          )
        );
      }
      if (linked_page_ids?.length) {
        promises.push(
          (supabase as any).from("campaign_url_pages").insert(
            linked_page_ids.map((id) => ({ campaign_url_id: cu.id, page_id: id, workspace_id: payload.workspace_id }))
          )
        );
      }
      await Promise.all(promises);
      return cu;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign-urls"] }),
  });
}

export function useUpdateCampaignUrl() {
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
      const { linked_account_ids, linked_page_ids, id, workspace_id, ...cuData } = payload;
      const { error } = await (supabase as any).from("campaign_urls").update(cuData).eq("id", id);
      if (error) throw error;

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
      qc.invalidateQueries({ queryKey: ["campaign-urls"] });
      qc.invalidateQueries({ queryKey: ["campaign-url"] });
    },
  });
}

export function useDeleteCampaignUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("campaign_urls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign-urls"] }),
  });
}

// ─── Campaign URL Ads CRUD ───

export function useCreateCampaignUrlAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CampaignUrlAd> & { campaign_url_id: string; workspace_id: string }) => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_ads")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as CampaignUrlAd;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-ads", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-url", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-urls"] });
    },
  });
}

export function useUpdateCampaignUrlAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; campaign_url_id: string } & Partial<CampaignUrlAd>) => {
      const { id, campaign_url_id, ...rest } = payload;
      const { error } = await (supabase as any).from("campaign_url_ads").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-ads", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-url", vars.campaign_url_id] });
    },
  });
}

export function useDeleteCampaignUrlAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; campaign_url_id: string }) => {
      const { error } = await (supabase as any).from("campaign_url_ads").delete().eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["campaign-url-ads", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-url", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["campaign-urls"] });
    },
  });
}
