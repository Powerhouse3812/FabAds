import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface SavedConcept {
  id: string;
  workspace_id: string;
  created_by: string;
  category_id: string | null;
  title: string;
  scene: string | null;
  composition: string | null;
  background: string | null;
  lighting: string | null;
  is_custom: boolean;
  custom_prompt: string | null;
  tags: string[];
  created_at: string;
}

export function useSavedConcepts(categoryId?: string | null) {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["saved-concepts", workspaceId, categoryId],
    enabled: !!workspaceId,
    queryFn: async () => {
      let q = supabase
        .from("saved_concepts" as any)
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SavedConcept[];
    },
  });
}

export function useCreateSavedConcept() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async (input: Omit<SavedConcept, "id" | "workspace_id" | "created_by" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !workspaceId) throw new Error("Not authenticated");
      const { error } = await supabase.from("saved_concepts" as any).insert({
        workspace_id: workspaceId,
        created_by: user.id,
        ...input,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-concepts"] }),
  });
}

export function useDeleteSavedConcept() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_concepts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-concepts"] }),
  });
}
