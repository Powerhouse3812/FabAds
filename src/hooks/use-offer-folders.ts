import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Unified folder system: Campaign URL folders are now Creative Library folders (cl_folders)
 * linked via campaign_url_cl_folder_links.
 */

export interface OfferFolder {
  id: string;              // cl_folder id
  link_id: string;         // campaign_url_cl_folder_links id
  workspace_id: string;
  name: string;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  image_count?: number;
  video_count?: number;
  adgroup_count?: number;
  total_items?: number;
}

export interface OfferFolderItem {
  id: string;
  folder_id: string;
  workspace_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
  // Joined from creative_assets or cl_adgroups
  url?: string;
  file_name?: string;
  file_type?: string;
  width?: number | null;
  height?: number | null;
}

/** List cl_folders linked to a Campaign URL */
export function useOfferFolders(offerId: string | null) {
  return useQuery({
    queryKey: ["offer-folders", offerId],
    enabled: !!offerId,
    queryFn: async (): Promise<OfferFolder[]> => {
      // Get links + folder data via join
      const { data: links, error } = await (supabase as any)
        .from("campaign_url_cl_folder_links")
        .select("id, cl_folder_id, campaign_url_id, workspace_id, created_at, cl_folders!inner(id, name, description, tags, workspace_id, created_at, updated_at)")
        .eq("campaign_url_id", offerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!links?.length) return [];

      const folderIds = links.map((l: any) => l.cl_folder_id);

      // Get item counts from cl_folder_items
      const { data: items } = await (supabase as any)
        .from("cl_folder_items")
        .select("folder_id, item_type")
        .in("folder_id", folderIds);

      // Also get media types from creative_assets for image/video counts
      const mediaItemIds = (items || []).filter((i: any) => i.item_type === "media").map((i: any) => i.item_id);

      const counts: Record<string, { images: number; videos: number; adgroups: number; total: number }> = {};
      for (const item of items || []) {
        if (!counts[item.folder_id]) counts[item.folder_id] = { images: 0, videos: 0, adgroups: 0, total: 0 };
        counts[item.folder_id].total++;
        if (item.item_type === "adgroup") counts[item.folder_id].adgroups++;
        // We'll approximate: non-adgroup items counted below via asset lookup
      }

      // Get asset file_types for image/video breakdown
      if (mediaItemIds?.length) {
        const allMediaIds = (items || []).filter((i: any) => i.item_type === "media").map((i: any) => i.item_id);
        if (allMediaIds.length > 0) {
          const { data: assets } = await (supabase as any)
            .from("creative_assets")
            .select("id, file_type")
            .in("id", allMediaIds);
          const assetTypeMap: Record<string, string> = {};
          for (const a of assets || []) assetTypeMap[a.id] = a.file_type;
          for (const item of (items || []).filter((i: any) => i.item_type === "media")) {
            const ft = assetTypeMap[item.item_id];
            if (ft === "image") counts[item.folder_id].images++;
            else if (ft === "video") counts[item.folder_id].videos++;
          }
        }
      }

      return links.map((l: any) => ({
        id: l.cl_folders.id,
        link_id: l.id,
        workspace_id: l.cl_folders.workspace_id,
        name: l.cl_folders.name,
        description: l.cl_folders.description,
        tags: l.cl_folders.tags || [],
        created_at: l.cl_folders.created_at,
        updated_at: l.cl_folders.updated_at,
        image_count: counts[l.cl_folder_id]?.images || 0,
        video_count: counts[l.cl_folder_id]?.videos || 0,
        adgroup_count: counts[l.cl_folder_id]?.adgroups || 0,
        total_items: counts[l.cl_folder_id]?.total || 0,
      }));
    },
  });
}

/** List items in a cl_folder with asset details */
export function useOfferFolderItems(folderId: string | null) {
  return useQuery({
    queryKey: ["offer-folder-items", folderId],
    enabled: !!folderId,
    queryFn: async (): Promise<OfferFolderItem[]> => {
      const { data: items, error } = await (supabase as any)
        .from("cl_folder_items")
        .select("*")
        .eq("folder_id", folderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!items?.length) return [];

      // Get asset details for media items
      const mediaIds = items.filter((i: any) => i.item_type === "media").map((i: any) => i.item_id);
      let assetMap: Record<string, any> = {};
      if (mediaIds.length > 0) {
        const { data: assets } = await (supabase as any)
          .from("creative_assets")
          .select("id, url, file_name, file_type, width, height")
          .in("id", mediaIds);
        for (const a of assets || []) assetMap[a.id] = a;
      }

      return items.map((item: any) => {
        const asset = item.item_type === "media" ? assetMap[item.item_id] : null;
        return {
          ...item,
          url: asset?.url || null,
          file_name: asset?.file_name || null,
          file_type: asset?.file_type || null,
          width: asset?.width || null,
          height: asset?.height || null,
        };
      });
    },
  });
}

/** Link an existing cl_folder to a Campaign URL */
export function useLinkFolderToOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { workspace_id: string; campaign_url_id: string; cl_folder_id: string }) => {
      const { data, error } = await (supabase as any)
        .from("campaign_url_cl_folder_links")
        .insert({
          workspace_id: payload.workspace_id,
          campaign_url_id: payload.campaign_url_id,
          cl_folder_id: payload.cl_folder_id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folders", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["folder_linked_campaign_urls"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

/** Create a new cl_folder and link it to a Campaign URL */
export function useCreateAndLinkFolder() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { workspace_id: string; campaign_url_id: string; name: string; description?: string; tags?: string[] }) => {
      // 1. Create cl_folder
      const { data: folder, error: folderErr } = await (supabase as any)
        .from("cl_folders")
        .insert({
          workspace_id: payload.workspace_id,
          name: payload.name,
          description: payload.description || null,
          tags: payload.tags || [],
          created_by: user!.id,
        })
        .select()
        .single();
      if (folderErr) throw folderErr;

      // 2. Link to Campaign URL
      const { error: linkErr } = await (supabase as any)
        .from("campaign_url_cl_folder_links")
        .insert({
          workspace_id: payload.workspace_id,
          campaign_url_id: payload.campaign_url_id,
          cl_folder_id: folder.id,
        });
      if (linkErr) throw linkErr;

      return folder;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folders", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["cl_folders"] });
      qc.invalidateQueries({ queryKey: ["folder_linked_campaign_urls"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

/** Unlink a cl_folder from a Campaign URL (does NOT delete the folder) */
export function useUnlinkFolderFromOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { link_id: string; campaign_url_id: string }) => {
      const { error } = await (supabase as any)
        .from("campaign_url_cl_folder_links")
        .delete()
        .eq("id", payload.link_id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folders", vars.campaign_url_id] });
      qc.invalidateQueries({ queryKey: ["folder_linked_campaign_urls"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

/** Update a cl_folder name/description */
export function useUpdateOfferFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; name?: string; description?: string; offer_id: string }) => {
      const update: Record<string, any> = {};
      if (payload.name !== undefined) update.name = payload.name;
      if (payload.description !== undefined) update.description = payload.description;
      const { error } = await (supabase as any)
        .from("cl_folders")
        .update(update)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folders", vars.offer_id] });
      qc.invalidateQueries({ queryKey: ["cl_folders"] });
    },
  });
}

/** Add items to a cl_folder */
export function useAddFolderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      folder_id: string;
      workspace_id: string;
      items: { asset_id: string; media_type: string; metadata?: Record<string, unknown> }[];
    }) => {
      const rows = payload.items.map((item) => ({
        folder_id: payload.folder_id,
        workspace_id: payload.workspace_id,
        item_type: "media",
        item_id: item.asset_id,
      }));
      const { error } = await (supabase as any)
        .from("cl_folder_items")
        .upsert(rows, { onConflict: "folder_id,item_id", ignoreDuplicates: true });
      if (error) {
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          throw new Error("One or more assets are already in this folder");
        }
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folder-items", vars.folder_id] });
      qc.invalidateQueries({ queryKey: ["offer-folders"] });
      qc.invalidateQueries({ queryKey: ["cl_folder_items"] });
      qc.invalidateQueries({ queryKey: ["cl_folders"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

/** Skip-duplicates variant */
export function useAddFolderItemsSkipDuplicates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      folder_id: string;
      workspace_id: string;
      items: { asset_id: string; media_type: string; metadata?: Record<string, unknown> }[];
    }): Promise<{ added: number; skipped: number }> => {
      let added = 0;
      let skipped = 0;
      for (const item of payload.items) {
        const { error } = await (supabase as any)
          .from("cl_folder_items")
          .insert({
            folder_id: payload.folder_id,
            workspace_id: payload.workspace_id,
            item_type: "media",
            item_id: item.asset_id,
          });
        if (error) skipped++;
        else added++;
      }
      return { added, skipped };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folder-items", vars.folder_id] });
      qc.invalidateQueries({ queryKey: ["offer-folders"] });
      qc.invalidateQueries({ queryKey: ["cl_folder_items"] });
      qc.invalidateQueries({ queryKey: ["cl_folders"] });
      qc.invalidateQueries({ queryKey: ["creative-asset-usage-counts"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

/** Remove item from cl_folder */
export function useRemoveFolderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; folder_id: string }) => {
      const { error } = await (supabase as any)
        .from("cl_folder_items")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["offer-folder-items", vars.folder_id] });
      qc.invalidateQueries({ queryKey: ["offer-folders"] });
      qc.invalidateQueries({ queryKey: ["cl_folder_items"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}
