import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

interface OfferFolderLink {
  offer_id: string;
  cl_folder_id: string;
}

export function useOfferFolderLinks() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["offer-folder-links", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<OfferFolderLink[]> => {
      const { data, error } = await (supabase as any)
        .from("offer_cl_folder_links")
        .select("offer_id, cl_folder_id")
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
