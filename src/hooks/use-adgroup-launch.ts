import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export interface AdgroupLaunchItem {
  id: string;
  type: "adgroup" | "media";
  primaryText?: string;
  headline?: string;
  description?: string;
  cta?: string;
  destinationUrl?: string;
  displayLink?: string;
  mediaUrls: string[];
  mediaType?: string;
}

interface CustomMapping {
  assignments: Record<string, string[]>;
  campaigns: number;
  adsetCounts: number[];
}

interface AdgroupLaunchParams {
  name: string;
  items: AdgroupLaunchItem[];
  adsPerAdset: number;
  campaigns: number;
  adsetsPerCampaign: number;
  customMapping?: CustomMapping;
  roundRobin?: boolean;
}

/** Fill ad rows for a single adset — each adset independently cycles items from index 0 */
export function buildAdRowsForAdset(
  items: AdgroupLaunchItem[],
  adsPerAdset: number,
  meta: { launch_id: string; adset_id: string; workspace_id: string }
): Record<string, any>[] {
  return Array.from({ length: adsPerAdset }, (_, slot) => {
    const item = items[slot % items.length];
    return {
      launch_id: meta.launch_id,
      adset_id: meta.adset_id,
      workspace_id: meta.workspace_id,
      name: `Ad ${slot + 1}`,
      sort_order: slot,
      primary_text: item.primaryText || null,
      headline: item.headline || null,
      description: item.description || null,
      cta: item.cta || null,
      destination_url: item.destinationUrl || null,
      display_link: item.displayLink || null,
      media_urls: item.mediaUrls.length > 0 ? item.mediaUrls : null,
      media_type: item.mediaType || null,
    };
  });
}

export function useAdgroupLaunch() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (params: AdgroupLaunchParams) => {
      if (!workspaceId || !user) throw new Error("Not authenticated");

      // 1. Create launch record
      const { data: launch, error: launchErr } = await (supabase as any)
        .from("launches")
        .insert({
          workspace_id: workspaceId,
          name: params.name,
          status: "draft",
          platform: "facebook",
          created_by: user.id,
          launch_config: {
            mode: "standard",
            source: "creative_library_adgroup_launch",
            source_creative_ids: params.items.map((i) => i.id),
          },
        })
        .select()
        .single();
      if (launchErr) throw launchErr;

      // 2. Generate hierarchy
      if (params.customMapping) {
        // Custom mapping mode
        const { assignments, campaigns: campCount, adsetCounts } = params.customMapping;
        const itemMap = new Map(params.items.map((i) => [i.id, i]));
        let globalSort = 0;

        for (let c = 0; c < campCount; c++) {
          const { data: camp, error: campErr } = await (supabase as any)
            .from("launch_campaigns")
            .insert({ launch_id: launch.id, workspace_id: workspaceId, name: `Campaign ${c + 1}`, sort_order: c })
            .select().single();
          if (campErr) throw campErr;

          const adsetCount = adsetCounts[c] || 1;
          for (let s = 0; s < adsetCount; s++) {
            const key = `${c}-${s}`;
            const itemIds = assignments[key] || [];

            const { data: adset, error: adsetErr } = await (supabase as any)
              .from("launch_adsets")
              .insert({ launch_id: launch.id, campaign_id: camp.id, workspace_id: workspaceId, name: `Adset ${s + 1}`, sort_order: s })
              .select().single();
            if (adsetErr) throw adsetErr;

            if (itemIds.length > 0) {
              const adRows = itemIds.map((itemId, idx) => {
                const item = itemMap.get(itemId);
                return {
                  launch_id: launch.id,
                  adset_id: adset.id,
                  workspace_id: workspaceId,
                  name: `Ad ${globalSort + 1}`,
                  sort_order: globalSort++,
                  primary_text: item?.primaryText || null,
                  headline: item?.headline || null,
                  description: item?.description || null,
                  cta: item?.cta || null,
                  destination_url: item?.destinationUrl || null,
                  display_link: item?.displayLink || null,
                  media_urls: item?.mediaUrls.length ? item.mediaUrls : null,
                  media_type: item?.mediaType || null,
                };
              });
              const { error: adsErr } = await (supabase as any).from("launch_ads").insert(adRows);
              if (adsErr) throw adsErr;
            }
          }
        }
      } else {
        // Default mode
        let globalAdsetIdx = 0;
        for (let c = 0; c < params.campaigns; c++) {
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

          for (let a = 0; a < params.adsetsPerCampaign; a++) {
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

            // Round robin: each adset gets only the item at its rotation index
            const itemsForAdset = params.roundRobin
              ? [params.items[globalAdsetIdx % params.items.length]]
              : params.items;

            const rows = buildAdRowsForAdset(
              itemsForAdset,
              params.roundRobin ? params.adsPerAdset : params.adsPerAdset,
              { launch_id: launch.id, adset_id: adset.id, workspace_id: workspaceId }
            );

            if (rows.length > 0) {
              const { error: adsErr } = await (supabase as any)
                .from("launch_ads")
                .insert(rows);
              if (adsErr) throw adsErr;
            }
            globalAdsetIdx++;
          }
        }
      }

      // 3. Log activity
      await (supabase as any).from("activity_logs").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: "launch_created",
        target_email: user.email || "",
        metadata: {
          launch_id: launch.id,
          launch_name: params.name,
          source: "creative_library_adgroup_launch",
          items_count: params.items.length,
        },
      });

      return launch;
    },
    onSuccess: (launch) => {
      queryClient.invalidateQueries({ queryKey: ["launches"] });
      toast({ title: "Launch draft created" });
      navigate(`/launch/${launch.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create launch", description: err.message, variant: "destructive" });
    },
  });
}
