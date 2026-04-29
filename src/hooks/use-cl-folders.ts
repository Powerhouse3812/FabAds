import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";

export interface ClFolder {
  id: string;
  workspace_id: string;
  name: string;
  tags: string[];
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export interface ClFolderItem {
  id: string;
  folder_id: string;
  workspace_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
}

// ─── List folders ───────────────────────────────────────────────────────────────

export function useClFolders() {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["cl_folders", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cl_folders" as any)
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ClFolder[];
    },
  });
}

// ─── Create folder ──────────────────────────────────────────────────────────────

export function useCreateClFolder() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { name: string; tags?: string[]; description?: string }) => {
      const { data, error } = await supabase
        .from("cl_folders" as any)
        .insert({
          workspace_id: workspaceId!,
          name: input.name,
          tags: input.tags || [],
          description: input.description || null,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ClFolder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cl_folders"] }),
  });
}

// ─── Update folder ──────────────────────────────────────────────────────────────

export function useUpdateClFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; tags?: string[]; description?: string | null }) => {
      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.description !== undefined) updates.description = input.description;
      const { error } = await supabase
        .from("cl_folders" as any)
        .update(updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cl_folders"] }),
  });
}

// ─── Delete folder ──────────────────────────────────────────────────────────────

export function useDeleteClFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cl_folders" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl_folders"] });
      qc.invalidateQueries({ queryKey: ["cl_folder_items"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

// ─── Folder items ───────────────────────────────────────────────────────────────

export function useClFolderItems(folderId: string | null) {
  return useQuery({
    queryKey: ["cl_folder_items", folderId],
    enabled: !!folderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cl_folder_items" as any)
        .select("*")
        .eq("folder_id", folderId!);
      if (error) throw error;
      return (data || []) as unknown as ClFolderItem[];
    },
  });
}

// ─── Add to folder ──────────────────────────────────────────────────────────────

export function useAddToFolder() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();

  return useMutation({
    mutationFn: async (input: { folderId: string; items: { itemId: string; itemType: "media" | "adgroup" }[] }) => {
      const rows = input.items.map((i) => ({
        folder_id: input.folderId,
        workspace_id: workspaceId!,
        item_type: i.itemType,
        item_id: i.itemId,
      }));

      const { data, error } = await supabase
        .from("cl_folder_items" as any)
        .upsert(rows as any, { onConflict: "folder_id,item_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      return (data || []) as unknown as ClFolderItem[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl_folder_items"] });
      qc.invalidateQueries({ queryKey: ["cl_folders"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

// ─── Remove from folder ─────────────────────────────────────────────────────────

export function useRemoveFromFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { folderId: string; itemId: string }) => {
      const { error } = await supabase
        .from("cl_folder_items" as any)
        .delete()
        .eq("folder_id", input.folderId)
        .eq("item_id", input.itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl_folder_items"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

// ─── Folder-CampaignUrl links ───────────────────────────────────────────────────

export interface FolderLinkedCampaignUrl {
  id: string;
  campaign_url_id: string;
  cl_folder_id: string;
  workspace_id: string;
  created_at: string;
  campaign_url: {
    id: string;
    name: string;
    status: string;
  };
  ad_accounts: { id: string; name: string; fb_account_id: string }[];
}

export function useFolderLinkedCampaignUrls(folderId: string | null) {
  return useQuery({
    queryKey: ["folder_linked_campaign_urls", folderId],
    enabled: !!folderId,
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("campaign_url_cl_folder_links" as any)
        .select("*, campaign_urls!inner(id, name, status)")
        .eq("cl_folder_id", folderId!);
      if (error) throw error;
      if (!links || links.length === 0) return [] as FolderLinkedCampaignUrl[];

      const cuIds = (links as any[]).map((l: any) => l.campaign_url_id);
      const { data: cuAccounts } = await supabase
        .from("campaign_url_ad_accounts" as any)
        .select("*, fb_ad_accounts!inner(id, name, fb_account_id)")
        .in("campaign_url_id", cuIds);

      const accountsByCu: Record<string, any[]> = {};
      for (const oa of (cuAccounts || []) as any[]) {
        if (!accountsByCu[oa.campaign_url_id]) accountsByCu[oa.campaign_url_id] = [];
        accountsByCu[oa.campaign_url_id].push({
          id: oa.fb_ad_accounts.id,
          name: oa.fb_ad_accounts.name,
          fb_account_id: oa.fb_ad_accounts.fb_account_id,
        });
      }

      return (links as any[]).map((l: any) => ({
        id: l.id,
        campaign_url_id: l.campaign_url_id,
        cl_folder_id: l.cl_folder_id,
        workspace_id: l.workspace_id,
        created_at: l.created_at,
        campaign_url: l.campaign_urls,
        ad_accounts: accountsByCu[l.campaign_url_id] || [],
      })) as FolderLinkedCampaignUrl[];
    },
  });
}

export function useUnlinkFolderFromCampaignUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("campaign_url_cl_folder_links" as any)
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folder_linked_campaign_urls"] });
      qc.invalidateQueries({ queryKey: ["cl-folder-stats"] });
    },
  });
}

// ─── Reorder folders ────────────────────────────────────────────────────────────

export function useReorderClFolders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const promises = items.map((item) =>
        supabase
          .from("cl_folders" as any)
          .update({ sort_order: item.sort_order } as any)
          .eq("id", item.id)
      );
      const results = await Promise.all(promises);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cl_folders"] }),
  });
}
