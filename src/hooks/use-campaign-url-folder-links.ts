import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

interface CampaignUrlFolderLink {
  campaign_url_id: string;
  cl_folder_id: string;
}

export function useCampaignUrlFolderLinks() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["campaign-url-folder-links", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<CampaignUrlFolderLink[]> => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_cl_folder_links")
        .select("campaign_url_id, cl_folder_id")
        .eq("workspace_id", workspaceId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFilteredFolderItemIds(folderIds: string[]) {
  return useQuery({
    queryKey: ["cl-folder-item-ids", folderIds],
    enabled: folderIds.length > 0,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await (supabase as any)
        .from("cl_folder_items")
        .select("item_id")
        .in("folder_id", folderIds);
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.item_id));
    },
  });
}
