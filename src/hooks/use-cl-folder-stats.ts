import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

export interface ClFolderStats {
  mediaCount: number;
  adgroupCount: number;
  linkedCuCount: number;
}

export function useClFolderStats() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["cl-folder-stats", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<Record<string, ClFolderStats>> => {
      const [itemsRes, linksRes] = await Promise.all([
        (supabase as any)
          .from("cl_folder_items")
          .select("folder_id, item_type")
          .eq("workspace_id", workspaceId),
        (supabase as any)
          .from("campaign_url_cl_folder_links")
          .select("cl_folder_id")
          .eq("workspace_id", workspaceId),
      ]);

      const stats: Record<string, ClFolderStats> = {};

      const getOrCreate = (id: string) => {
        if (!stats[id]) stats[id] = { mediaCount: 0, adgroupCount: 0, linkedCuCount: 0 };
        return stats[id];
      };

      for (const row of (itemsRes.data || []) as any[]) {
        const s = getOrCreate(row.folder_id);
        if (row.item_type === "media") s.mediaCount++;
        else if (row.item_type === "adgroup") s.adgroupCount++;
      }

      for (const row of (linksRes.data || []) as any[]) {
        getOrCreate(row.cl_folder_id).linkedCuCount++;
      }

      return stats;
    },
  });
}
