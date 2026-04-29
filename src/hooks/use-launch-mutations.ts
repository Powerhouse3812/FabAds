import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

function useInvalidateLaunch() {
  const qc = useQueryClient();
  return (launchId: string) => {
    qc.invalidateQueries({ queryKey: ["launch-full", launchId] });
    qc.invalidateQueries({ queryKey: ["launches"] });
  };
}

// --- Campaign mutations ---

export function useUpdateCampaign() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ id, launchId, ...fields }: { id: string; launchId: string; [key: string]: any }) => {
      const { error } = await (supabase as any).from("launch_campaigns").update(fields).eq("id", id);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useAddCampaign() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ launchId, sortOrder }: { launchId: string; sortOrder: number }) => {
      // Create campaign
      const { data: camp, error: campErr } = await (supabase as any)
        .from("launch_campaigns")
        .insert({ launch_id: launchId, workspace_id: workspaceId, name: `Campaign ${sortOrder + 1}`, sort_order: sortOrder })
        .select().single();
      if (campErr) throw campErr;
      // Create default adset
      const { data: adset, error: adsetErr } = await (supabase as any)
        .from("launch_adsets")
        .insert({ launch_id: launchId, campaign_id: camp.id, workspace_id: workspaceId, name: "Adset 1", sort_order: 0 })
        .select().single();
      if (adsetErr) throw adsetErr;
      // Create default ad
      await (supabase as any).from("launch_ads").insert({ launch_id: launchId, adset_id: adset.id, workspace_id: workspaceId, name: "Ad 1", sort_order: 0 });
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useDeleteCampaign() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ id, launchId }: { id: string; launchId: string }) => {
      // Delete ads belonging to adsets of this campaign
      const { data: adsets } = await (supabase as any).from("launch_adsets").select("id").eq("campaign_id", id);
      const adsetIds = (adsets || []).map((a: any) => a.id);
      if (adsetIds.length) {
        await (supabase as any).from("launch_ads").delete().in("adset_id", adsetIds);
      }
      await (supabase as any).from("launch_adsets").delete().eq("campaign_id", id);
      const { error } = await (supabase as any).from("launch_campaigns").delete().eq("id", id);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useDuplicateCampaign() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ campaignId, launchId }: { campaignId: string; launchId: string }) => {
      const { data: src } = await (supabase as any).from("launch_campaigns").select("*").eq("id", campaignId).single();
      const { data: newCamp } = await (supabase as any).from("launch_campaigns")
        .insert({ ...src, id: undefined, name: `${src.name} (copy)`, sort_order: src.sort_order + 1, workspace_id: workspaceId })
        .select().single();

      const { data: srcAdsets } = await (supabase as any).from("launch_adsets").select("*").eq("campaign_id", campaignId);
      for (const adset of srcAdsets || []) {
        const { data: newAdset } = await (supabase as any).from("launch_adsets")
          .insert({ ...adset, id: undefined, campaign_id: newCamp.id, workspace_id: workspaceId })
          .select().single();
        const { data: srcAds } = await (supabase as any).from("launch_ads").select("*").eq("adset_id", adset.id);
        if (srcAds?.length) {
          await (supabase as any).from("launch_ads").insert(
            srcAds.map((ad: any) => ({ ...ad, id: undefined, adset_id: newAdset.id, workspace_id: workspaceId }))
          );
        }
      }
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

// --- Adset mutations ---

export function useUpdateAdset() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ id, launchId, ...fields }: { id: string; launchId: string; [key: string]: any }) => {
      const { error } = await (supabase as any).from("launch_adsets").update(fields).eq("id", id);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useAddAdset() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ launchId, campaignId, sortOrder }: { launchId: string; campaignId: string; sortOrder: number }) => {
      const { data: adset, error: adsetErr } = await (supabase as any)
        .from("launch_adsets")
        .insert({ launch_id: launchId, campaign_id: campaignId, workspace_id: workspaceId, name: `Adset ${sortOrder + 1}`, sort_order: sortOrder })
        .select().single();
      if (adsetErr) throw adsetErr;
      await (supabase as any).from("launch_ads").insert({ launch_id: launchId, adset_id: adset.id, workspace_id: workspaceId, name: "Ad 1", sort_order: 0 });
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useDeleteAdset() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ id, launchId }: { id: string; launchId: string }) => {
      await (supabase as any).from("launch_ads").delete().eq("adset_id", id);
      const { error } = await (supabase as any).from("launch_adsets").delete().eq("id", id);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useDuplicateAdset() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ adsetId, launchId }: { adsetId: string; launchId: string }) => {
      const { data: src } = await (supabase as any).from("launch_adsets").select("*").eq("id", adsetId).single();
      const { data: newAdset } = await (supabase as any).from("launch_adsets")
        .insert({ ...src, id: undefined, name: `${src.name} (copy)`, sort_order: src.sort_order + 1, workspace_id: workspaceId })
        .select().single();
      const { data: srcAds } = await (supabase as any).from("launch_ads").select("*").eq("adset_id", adsetId);
      if (srcAds?.length) {
        await (supabase as any).from("launch_ads").insert(
          srcAds.map((ad: any) => ({ ...ad, id: undefined, adset_id: newAdset.id, workspace_id: workspaceId }))
        );
      }
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

// --- Ad mutations ---

export function useUpdateAd() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ id, launchId, ...fields }: { id: string; launchId: string; [key: string]: any }) => {
      const { error } = await (supabase as any).from("launch_ads").update(fields).eq("id", id);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useAddAd() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ launchId, adsetId, sortOrder }: { launchId: string; adsetId: string; sortOrder: number }) => {
      await (supabase as any).from("launch_ads").insert({ launch_id: launchId, adset_id: adsetId, workspace_id: workspaceId, name: `Ad ${sortOrder + 1}`, sort_order: sortOrder });
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useDeleteAd() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ id, launchId }: { id: string; launchId: string }) => {
      const { error } = await (supabase as any).from("launch_ads").delete().eq("id", id);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useDuplicateAd() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ adId, launchId }: { adId: string; launchId: string }) => {
      const { data: src } = await (supabase as any).from("launch_ads").select("*").eq("id", adId).single();
      await (supabase as any).from("launch_ads")
        .insert({ ...src, id: undefined, name: `${src.name} (copy)`, sort_order: src.sort_order + 1, workspace_id: workspaceId });
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

export function useBulkUpdateAds() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ ids, launchId, fields }: { ids: string[]; launchId: string; fields: Record<string, any> }) => {
      // Filter out empty/null fields
      const cleanFields: Record<string, any> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== "" && v !== null && v !== undefined) cleanFields[k] = v;
      }
      if (Object.keys(cleanFields).length === 0) return { launchId };
      const { error } = await (supabase as any).from("launch_ads").update(cleanFields).in("id", ids);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

// --- Bulk update adsets (for adgroup bulk toolbar) ---

export function useBulkUpdateAdsets() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ ids, launchId, fields }: { ids: string[]; launchId: string; fields: Record<string, any> }) => {
      const cleanFields: Record<string, any> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v !== "" && v !== null && v !== undefined) cleanFields[k] = v;
      }
      if (Object.keys(cleanFields).length === 0) return { launchId };

      // For targeting-related fields, merge into existing targeting JSON
      const targetingKeys = ["gender", "age_min", "age_max", "location_type", "include_locations", "exclude_locations",
        "limit_to_people_in_location", "device_platforms", "network_connections", "custom_audiences"];
      const directKeys = ["placements", "budget_period", "budget_value", "bid_strategy", "bid_amount", "schedule_start", "schedule_end"];

      const targetingUpdate: Record<string, any> = {};
      const directUpdate: Record<string, any> = {};

      for (const [k, v] of Object.entries(cleanFields)) {
        if (targetingKeys.includes(k)) {
          targetingUpdate[k] = v;
        } else if (directKeys.includes(k)) {
          directUpdate[k] = v;
        } else {
          directUpdate[k] = v;
        }
      }

      for (const id of ids) {
        if (Object.keys(targetingUpdate).length > 0) {
          // Fetch current targeting and merge
          const { data: current } = await (supabase as any).from("launch_adsets").select("targeting").eq("id", id).single();
          const merged = { ...(current?.targeting || {}), ...targetingUpdate };
          await (supabase as any).from("launch_adsets").update({ targeting: merged }).eq("id", id);
        }
        if (Object.keys(directUpdate).length > 0) {
          await (supabase as any).from("launch_adsets").update(directUpdate).eq("id", id);
        }
      }
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

// --- Delete launch (drafts only) ---

export function useDeleteLaunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ launchId }: { launchId: string }) => {
      // Delete children in order: ads -> adsets -> campaigns -> ad_accounts -> launch
      const { data: adsets } = await (supabase as any).from("launch_adsets").select("id").eq("launch_id", launchId);
      const adsetIds = (adsets || []).map((a: any) => a.id);
      if (adsetIds.length) {
        await (supabase as any).from("launch_ads").delete().in("adset_id", adsetIds);
      }
      await (supabase as any).from("launch_adsets").delete().eq("launch_id", launchId);
      await (supabase as any).from("launch_campaigns").delete().eq("launch_id", launchId);
      await (supabase as any).from("launch_ad_accounts").delete().eq("launch_id", launchId);
      const { error } = await (supabase as any).from("launches").delete().eq("id", launchId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["launches"] });
    },
  });
}

// --- Rename launch ---

export function useRenameLaunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ launchId, name }: { launchId: string; name: string }) => {
      const { error } = await (supabase as any).from("launches").update({ name }).eq("id", launchId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["launches"] });
    },
  });
}

export function useSaveTargeting() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ launchId, campaigns, adsets }: { launchId: string; campaigns: any[]; adsets: any[] }) => {
      for (const c of campaigns) {
        const { id, ...fields } = c;
        await (supabase as any).from("launch_campaigns").update(fields).eq("id", id);
      }
      for (const a of adsets) {
        const { id, ...fields } = a;
        await (supabase as any).from("launch_adsets").update(fields).eq("id", id);
      }
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

// --- Update completed_step ---

export function useUpdateLaunchStep() {
  const invalidate = useInvalidateLaunch();
  return useMutation({
    mutationFn: async ({ launchId, step }: { launchId: string; step: number }) => {
      const { error } = await (supabase as any)
        .from("launches")
        .update({ completed_step: step })
        .eq("id", launchId);
      if (error) throw error;
      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}

// --- Update launch (Step 1 edit mode) ---

export function useUpdateLaunch() {
  const invalidate = useInvalidateLaunch();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({
      launchId,
      name,
      adAccountIds,
      setupConfigs,
    }: {
      launchId: string;
      name: string;
      adAccountIds: string[];
      setupConfigs: Record<string, Record<string, unknown>>;
    }) => {
      // Update launch name
      await (supabase as any).from("launches").update({ name }).eq("id", launchId);

      // Delete existing ad accounts and re-insert
      await (supabase as any).from("launch_ad_accounts").delete().eq("launch_id", launchId);
      if (adAccountIds.length > 0) {
        const rows = adAccountIds.map((accId) => ({
          launch_id: launchId,
          fb_ad_account_id: accId,
          workspace_id: workspaceId,
          setup_config: setupConfigs[accId] || {},
        }));
        const { error } = await (supabase as any).from("launch_ad_accounts").insert(rows);
        if (error) throw error;
      }

      return { launchId };
    },
    onSuccess: (d) => invalidate(d.launchId),
  });
}
