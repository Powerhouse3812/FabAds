import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface SavedStrategy {
  id: string;
  workspace_id: string;
  created_by: string;
  brand_id: string | null;
  title: string;
  angle: string | null;
  hook: string | null;
  layout: string | null;
  visual_direction: string | null;
  is_custom: boolean;
  custom_prompt: string | null;
  tags: string[];
  created_at: string;
}

export function useSavedStrategies(brandId?: string | null) {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["saved-strategies", workspaceId, brandId],
    enabled: !!workspaceId,
    queryFn: async () => {
      let q = supabase
        .from("saved_strategies" as any)
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SavedStrategy[];
    },
  });
}

export function useCreateSavedStrategy() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async (input: Omit<SavedStrategy, "id" | "workspace_id" | "created_by" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !workspaceId) throw new Error("Not authenticated");
      const { error } = await supabase.from("saved_strategies" as any).insert({
        workspace_id: workspaceId,
        created_by: user.id,
        ...input,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-strategies"] }),
  });
}

export function useDeleteSavedStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_strategies" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-strategies"] }),
  });
}
