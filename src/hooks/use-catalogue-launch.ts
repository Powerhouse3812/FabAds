import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "@/contexts/AuthContext";

export function useCreateCatalogueLaunch() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      adAccountIds: string[];
      setupConfigs: Record<string, Record<string, unknown>>;
      strategy: { campaigns: number; adsets: number; ads: number };
    }) => {
      if (!workspaceId || !user) throw new Error("Not authenticated");

      // 1. Create the launch with mode=catalogue
      const { data: launch, error: launchErr } = await (supabase as any)
        .from("launches")
        .insert({
          workspace_id: workspaceId,
          name: params.name,
          status: "draft",
          platform: "facebook",
          created_by: user.id,
          launch_config: {
            mode: "catalogue",
            ui_state: { catalogue_ads: { expanded: {}, selected_entity: null } },
          },
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
      const { error: accErr } = await (supabase as any).from("launch_ad_accounts").insert(adAccountRows);
      if (accErr) throw accErr;

      // 3. Generate hierarchy skeleton with product_set_id seeded from account defaults
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
          // Seed product_set_id from first account's defaults
          const firstConfig = params.setupConfigs[params.adAccountIds[0]] || {};
          const catDefaults = (firstConfig as any).catalogue_ads_defaults || {};
          const seedTargeting: Record<string, any> = {};
          if (catDefaults.product_set_id) {
            seedTargeting.product_set_id = catDefaults.product_set_id;
          }

          const { data: adset, error: adsetErr } = await (supabase as any)
            .from("launch_adsets")
            .insert({
              launch_id: launch.id,
              campaign_id: camp.id,
              workspace_id: workspaceId,
              name: `Adset ${a + 1}`,
              sort_order: a,
              targeting: seedTargeting,
            })
            .select()
            .single();
          if (adsetErr) throw adsetErr;

          const adRows = Array.from({ length: ads }, (_, i) => ({
            launch_id: launch.id,
            adset_id: adset.id,
            workspace_id: workspaceId,
            name: `Ad ${i + 1}`,
            sort_order: i,
          }));
          const { error: adsErr } = await (supabase as any).from("launch_ads").insert(adRows);
          if (adsErr) throw adsErr;
        }
      }

      // 4. Log activity
      await (supabase as any).from("activity_logs").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: "catalogue_launch_created",
        target_email: user.email || "",
        metadata: { launch_id: launch.id, launch_name: params.name },
      });

      return launch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["launches"] });
    },
  });
}
