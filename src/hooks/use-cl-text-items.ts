import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import {
  LIBRARY_HEADLINES,
  LIBRARY_PRIMARY_TEXTS,
  LIBRARY_DESCRIPTIONS,
  type LibraryTextItem,
} from "@/mocks/shared/library-items";

export type TextItemType = "headline" | "primary_text" | "description";

const TABLE_MAP: Record<TextItemType, string> = {
  headline: "cl_headlines",
  primary_text: "cl_primary_texts",
  description: "cl_descriptions",
};

const FALLBACK_BY_TYPE: Record<TextItemType, LibraryTextItem[]> = {
  headline: LIBRARY_HEADLINES,
  primary_text: LIBRARY_PRIMARY_TEXTS,
  description: LIBRARY_DESCRIPTIONS,
};

export interface ClTextItem {
  id: string;
  workspace_id: string;
  text: string;
  categories: string[];
  tags: string[];
  platforms: string[];
  is_favourite: boolean;
  created_by: string;
  created_at: string;
}

export function useTextItems(type: TextItemType) {
  const workspaceId = useWorkspace();
  const table = TABLE_MAP[type];

  return useQuery({
    queryKey: ["cl-text-items", type, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const real = (data ?? []) as ClTextItem[];
      if (real.length > 0) return real;
      // Dev / demo fallback — real items take priority when present
      return FALLBACK_BY_TYPE[type] as ClTextItem[];
    },
  });
}

export function useAddTextItem(type: TextItemType) {
  const workspaceId = useWorkspace();
  const qc = useQueryClient();
  const table = TABLE_MAP[type];

  return useMutation({
    mutationFn: async (item: { text: string; categories: string[]; tags: string[]; platforms: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!workspaceId) throw new Error("No workspace");

      const { data, error } = await (supabase as any)
        .from(table)
        .insert({
          workspace_id: workspaceId,
          text: item.text,
          categories: item.categories,
          tags: item.tags,
          platforms: item.platforms,
          created_by: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as ClTextItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl-text-items", type] });
    },
  });
}

export function useUpdateTextItem(type: TextItemType) {
  const qc = useQueryClient();
  const table = TABLE_MAP[type];

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; text?: string; categories?: string[]; tags?: string[]; platforms?: string[]; is_favourite?: boolean }) => {
      const { data, error } = await (supabase as any)
        .from(table)
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ClTextItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl-text-items", type] });
    },
  });
}

export function useDeleteTextItem(type: TextItemType) {
  const qc = useQueryClient();
  const table = TABLE_MAP[type];

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl-text-items", type] });
    },
  });
}
