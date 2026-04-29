import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import type { FolderAd } from "./use-folder-ads";

export interface Launch {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  platform: string;
  launch_config: Record<string, unknown>;
  created_by: string;
  last_modified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaunchWithCounts extends Launch {
  campaign_count: number;
  adset_count: number;
  ad_count: number;
  created_by_email: string;
  last_modified_by_email: string;
}

export function useLaunches() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["launches", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data: launches, error } = await (supabase as any)
        .from("launches")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Fetch counts for each launch
      const launchIds = (launches || []).map((l: Launch) => l.id);
      if (launchIds.length === 0) return [] as LaunchWithCounts[];

      const [campaigns, adsets, ads] = await Promise.all([
        (supabase as any).from("launch_campaigns").select("id, launch_id").in("launch_id", launchIds),
        (supabase as any).from("launch_adsets").select("id, launch_id").in("launch_id", launchIds),
        (supabase as any).from("launch_ads").select("id, launch_id").in("launch_id", launchIds),
      ]);

      const countBy = (items: { launch_id: string }[]) => {
        const map: Record<string, number> = {};
        (items || []).forEach((i) => { map[i.launch_id] = (map[i.launch_id] || 0) + 1; });
        return map;
      };

      const campCounts = countBy(campaigns.data || []);
      const adsetCounts = countBy(adsets.data || []);
      const adCounts = countBy(ads.data || []);

      // Fetch profiles for created_by and last_modified_by
      const allUserIds = [...new Set([
        ...(launches || []).map((l: Launch) => l.created_by),
        ...(launches || []).map((l: Launch) => l.last_modified_by).filter(Boolean),
      ])];
      const { data: profiles } = allUserIds.length
        ? await (supabase as any).from("profiles").select("id, email").in("id", allUserIds)
        : { data: [] };
      const emailMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { emailMap[p.id] = p.email; });

      return (launches || []).map((l: Launch) => ({
        ...l,
        campaign_count: campCounts[l.id] || 0,
        adset_count: adsetCounts[l.id] || 0,
        ad_count: adCounts[l.id] || 0,
        created_by_email: emailMap[l.created_by] || "—",
        last_modified_by_email: l.last_modified_by ? (emailMap[l.last_modified_by] || "—") : "—",
      })) as LaunchWithCounts[];
    },
  });
}

export function useCreateLaunch() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      adAccountIds: string[];
      setupConfigs: Record<string, Record<string, unknown>>;
      strategy: { campaigns: number; adsets: number; ads: number };
      folderAds?: FolderAd[];
    }) => {
      if (!workspaceId || !user) throw new Error("Not authenticated");

      // 1. Create the launch
      const { data: launch, error: launchErr } = await (supabase as any)
        .from("launches")
        .insert({
          workspace_id: workspaceId,
          name: params.name,
          status: "draft",
          platform: "facebook",
          created_by: user.id,
        })
        .select()
        .single();
      if (launchErr) throw launchErr;

      // 2. Create launch_ad_accounts
      const adAccountRows = params.adAccountIds.map((accId) => ({
        launch_id: launch.id,
        fb_ad_account_id: accId,
        workspace_id: workspaceId,
        setup_config: params.setupConfigs[accId] || {},
      }));
      const { error: accErr } = await (supabase as any)
        .from("launch_ad_accounts")
        .insert(adAccountRows);
      if (accErr) throw accErr;

      // 3. Generate hierarchy skeleton
      const { campaigns, adsets, ads } = params.strategy;
      for (let c = 0; c < campaigns; c++) {
        const { data: camp, error: campErr } = await (supabase as any)
          .from("launch_campaigns")
          .insert({
            launch_id: launch.id,
            workspace_id: workspaceId,
            name: `Campaign ${c + 1}`,
            sort_order: c,
          })
          .select()
          .single();
        if (campErr) throw campErr;

        for (let a = 0; a < adsets; a++) {
          const { data: adset, error: adsetErr } = await (supabase as any)
            .from("launch_adsets")
            .insert({
              launch_id: launch.id,
              campaign_id: camp.id,
              workspace_id: workspaceId,
              name: `Adset ${a + 1}`,
              sort_order: a,
            })
            .select()
            .single();
          if (adsetErr) throw adsetErr;

          const adRows = params.folderAds && params.folderAds.length > 0
            ? params.folderAds.map((fa, i) => ({
                launch_id: launch.id,
                adset_id: adset.id,
                workspace_id: workspaceId,
                name: fa.name,
                sort_order: i,
                primary_text: fa.primary_text,
                headline: fa.headline,
                description: fa.description,
                cta: fa.cta,
                destination_url: fa.destination_url,
                display_link: fa.display_link,
                media_urls: fa.media_urls,
                media_type: fa.media_type,
              }))
            : Array.from({ length: ads }, (_, i) => ({
                launch_id: launch.id,
                adset_id: adset.id,
                workspace_id: workspaceId,
                name: `Ad ${i + 1}`,
                sort_order: i,
              }));
          const { error: adsErr } = await (supabase as any)
            .from("launch_ads")
            .insert(adRows);
          if (adsErr) throw adsErr;
        }
      }

      // 4. Log activity
      await (supabase as any).from("activity_logs").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: "launch_created",
        target_email: user.email || "",
        metadata: { launch_id: launch.id, launch_name: params.name },
      });

      return launch as Launch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launches"] });
    },
  });
}

export function useRelaunchDraft() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sourceLaunchId: string) => {
      if (!workspaceId || !user) throw new Error("Not authenticated");

      // Fetch original launch
      const { data: source, error: srcErr } = await (supabase as any)
        .from("launches")
        .select("*")
        .eq("id", sourceLaunchId)
        .single();
      if (srcErr) throw srcErr;

      // Create new draft with completed_step = 3 (lands on Review)
      // Reset catalogue UI state to prevent stale entity ID references
      const sourceConfig = source.launch_config || {};
      const clonedConfig = {
        ...sourceConfig,
        ui_state: {
          ...(sourceConfig.ui_state || {}),
          catalogue_ads: { expanded: {}, selected_entity: null },
        },
      };

      const { data: newLaunch, error: newErr } = await (supabase as any)
        .from("launches")
        .insert({
          workspace_id: workspaceId,
          name: `${source.name} (copy)`,
          status: "draft",
          completed_step: 3,
          platform: source.platform,
          launch_config: clonedConfig,
          created_by: user.id,
        })
        .select()
        .single();
      if (newErr) throw newErr;

      // Clone ad accounts
      const { data: srcAccounts } = await (supabase as any)
        .from("launch_ad_accounts")
        .select("*")
        .eq("launch_id", sourceLaunchId);
      if (srcAccounts?.length) {
        await (supabase as any).from("launch_ad_accounts").insert(
          srcAccounts.map((a: any) => ({
            launch_id: newLaunch.id,
            fb_ad_account_id: a.fb_ad_account_id,
            workspace_id: workspaceId,
            setup_config: a.setup_config,
          }))
        );
      }

      // Clone campaigns -> adsets -> ads
      const { data: srcCampaigns } = await (supabase as any)
        .from("launch_campaigns").select("*").eq("launch_id", sourceLaunchId);
      for (const camp of srcCampaigns || []) {
        const { data: newCamp } = await (supabase as any).from("launch_campaigns")
          .insert({ ...camp, id: undefined, launch_id: newLaunch.id, workspace_id: workspaceId })
          .select().single();

        const { data: srcAdsets } = await (supabase as any)
          .from("launch_adsets").select("*").eq("campaign_id", camp.id);
        for (const adset of srcAdsets || []) {
          const { data: newAdset } = await (supabase as any).from("launch_adsets")
            .insert({ ...adset, id: undefined, launch_id: newLaunch.id, campaign_id: newCamp.id, workspace_id: workspaceId })
            .select().single();

          const { data: srcAds } = await (supabase as any)
            .from("launch_ads").select("*").eq("adset_id", adset.id);
          if (srcAds?.length) {
            await (supabase as any).from("launch_ads").insert(
              srcAds.map((ad: any) => ({ ...ad, id: undefined, launch_id: newLaunch.id, adset_id: newAdset.id, workspace_id: workspaceId }))
            );
          }
        }
      }

      return newLaunch as Launch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launches"] });
    },
  });
}
