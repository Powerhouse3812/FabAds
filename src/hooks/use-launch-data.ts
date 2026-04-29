import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface LaunchCampaign {
  id: string;
  launch_id: string;
  workspace_id: string;
  name: string;
  objective: string | null;
  budget_type: string | null;
  budget_period: string | null;
  budget_value: number | null;
  bid_strategy: string | null;
  delivery_type: string | null;
  special_ad_category: string[] | null;
  sort_order: number;
  status: string;
  catalogue_ads_override: Record<string, any> | null;
}

export interface LaunchAdset {
  id: string;
  launch_id: string;
  campaign_id: string;
  workspace_id: string;
  name: string;
  schedule_start: string | null;
  schedule_end: string | null;
  targeting: Record<string, any> | null;
  placements: Record<string, any> | null;
  performance_goal: string | null;
  budget_value: number | null;
  budget_period: string | null;
  bid_strategy: string | null;
  bid_amount: number | null;
  delivery_type: string | null;
  sort_order: number;
  status: string;
}

export interface LaunchAd {
  id: string;
  launch_id: string;
  adset_id: string;
  workspace_id: string;
  name: string;
  primary_text: string | null;
  headline: string | null;
  description: string | null;
  cta: string | null;
  destination_url: string | null;
  display_link: string | null;
  media_urls: string[] | null;
  media_type: string | null;
  sort_order: number;
  status: string;
}

export interface LaunchAdAccount {
  id: string;
  launch_id: string;
  fb_ad_account_id: string;
  workspace_id: string;
  setup_config: Record<string, any> | null;
}

export interface LaunchFull {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  platform: string;
  launch_config: Record<string, any> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_step: number;
  targeting_template_id: string | null;
  ad_accounts: LaunchAdAccount[];
  campaigns: LaunchCampaign[];
  adsets: LaunchAdset[];
  ads: LaunchAd[];
}

export function useLaunchFull(launchId: string | undefined) {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["launch-full", launchId],
    enabled: !!launchId && !!workspaceId,
    queryFn: async (): Promise<LaunchFull> => {
      const [launchRes, accountsRes, campaignsRes, adsetsRes, adsRes] = await Promise.all([
        (supabase as any).from("launches").select("*").eq("id", launchId).single(),
        (supabase as any).from("launch_ad_accounts").select("*").eq("launch_id", launchId),
        (supabase as any).from("launch_campaigns").select("*").eq("launch_id", launchId).order("sort_order"),
        (supabase as any).from("launch_adsets").select("*").eq("launch_id", launchId).order("sort_order"),
        (supabase as any).from("launch_ads").select("*").eq("launch_id", launchId).order("sort_order"),
      ]);

      if (launchRes.error) throw launchRes.error;

      return {
        ...launchRes.data,
        ad_accounts: accountsRes.data || [],
        campaigns: campaignsRes.data || [],
        adsets: adsetsRes.data || [],
        ads: adsRes.data || [],
      };
    },
  });
}
