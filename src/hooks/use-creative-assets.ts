import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface CreativeAsset {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  storage_path: string;
  url: string;
  thumbnail_url: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface CreativeFolder {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

const DEFAULT_FOLDER_NAME = "Offer Uploads";

export function useCreativeAssets(folderId?: string | null) {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["creative-assets", workspaceId, folderId],
    enabled: !!workspaceId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("creative_assets")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (folderId) {
        query = query.eq("folder_id", folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CreativeAsset[];
    },
  });
}

export function useCreativeFolders() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["creative-folders", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("creative_folders")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name");
      if (error) throw error;
      return (data || []) as CreativeFolder[];
    },
  });
}

/** Ensure the default "Offer Uploads" folder exists, return its id */
async function ensureDefaultFolder(workspaceId: string): Promise<string> {
  const { data: existing } = await (supabase as any)
    .from("creative_folders")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", DEFAULT_FOLDER_NAME)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await (supabase as any)
    .from("creative_folders")
    .insert({ workspace_id: workspaceId, name: DEFAULT_FOLDER_NAME })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

export function useUploadCreativeAsset() {
  const workspaceId = useWorkspace();
  const qc = useQueryClient();
  const [progress, setProgress] = useState<Record<string, number>>({});

  const mutation = useMutation({
    mutationFn: async ({ files, folderId }: { files: File[]; folderId?: string }) => {
      if (!workspaceId) throw new Error("No workspace");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const targetFolderId = folderId || await ensureDefaultFolder(workspaceId);
      const results: CreativeAsset[] = [];

      for (const file of files) {
        const fileId = `${Date.now()}-${file.name}`;
        setProgress((p) => ({ ...p, [fileId]: 0 }));

        const storagePath = `${workspaceId}/${targetFolderId}/${Date.now()}_${file.name}`;
        const isVideo = file.type.startsWith("video/");
        const fileType = isVideo ? "video" : "image";

        const { error: uploadError } = await supabase.storage
          .from("creative-assets")
          .upload(storagePath, file, { upsert: true });

        if (uploadError) throw uploadError;
        setProgress((p) => ({ ...p, [fileId]: 70 }));

        const { data: urlData } = supabase.storage
          .from("creative-assets")
          .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;

        let width: number | null = null;
        let height: number | null = null;
        if (!isVideo) {
          try {
            const dims = await getImageDimensions(file);
            width = dims.width;
            height = dims.height;
          } catch { /* ignore */ }
        }

        setProgress((p) => ({ ...p, [fileId]: 90 }));

        const { data: asset, error: insertError } = await (supabase as any)
          .from("creative_assets")
          .insert({
            workspace_id: workspaceId,
            folder_id: targetFolderId,
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            width,
            height,
            storage_path: storagePath,
            url: publicUrl,
            uploaded_by: user.id,
          })
          .select("*")
          .single();

        if (insertError) throw insertError;
        setProgress((p) => ({ ...p, [fileId]: 100 }));
        results.push(asset as CreativeAsset);
      }

      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative-assets"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
      setProgress({});
    },
    onError: () => {
      setProgress({});
    },
  });

  const totalProgress = Object.values(progress);
  const avgProgress = totalProgress.length > 0
    ? Math.round(totalProgress.reduce((a, b) => a + b, 0) / totalProgress.length)
    : 0;

  return {
    upload: mutation.mutateAsync,
    uploading: mutation.isPending,
    progress: avgProgress,
  };
}

export function useDeleteCreativeAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: { id: string; storage_path: string }) => {
      // 1. Delete folder links
      await (supabase as any)
        .from("offer_folder_items")
        .delete()
        .eq("asset_id", asset.id);
      // 2. Delete storage object
      await supabase.storage.from("creative-assets").remove([asset.storage_path]);
      // 3. Delete DB record
      const { error } = await (supabase as any)
        .from("creative_assets")
        .delete()
        .eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative-assets"] });
      qc.invalidateQueries({ queryKey: ["offer-folder-items"] });
      qc.invalidateQueries({ queryKey: ["offer-folders"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

/** Returns a map of asset_id -> number of offer folders it's used in */
export function useCreativeAssetUsageCounts() {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["creative-asset-usage", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await (supabase as any)
        .from("offer_folder_items")
        .select("asset_id")
        .eq("workspace_id", workspaceId)
        .not("asset_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.asset_id] = (counts[row.asset_id] || 0) + 1;
      }
      return counts;
    },
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
