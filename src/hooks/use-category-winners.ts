import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { DEMO_MODE } from "@/lib/demo-mode";

function buildDemoWinners(categoryId: string): CategoryWinner[] {
  const tags = ["winner", "top-performer"];
  return [1, 2, 3, 4].map((i) => ({
    id: `demo-w-${categoryId}-${i}`,
    category_id: categoryId,
    workspace_id: "demo",
    image_url: `https://picsum.photos/seed/${categoryId.slice(0, 8)}${i}/200/200`,
    storage_path: "",
    tags,
    source: "demo",
    notes: null,
    is_cross_niche: i > 3,
    created_at: new Date().toISOString(),
  }));
}

export interface CategoryWinner {
  id: string;
  category_id: string;
  workspace_id: string;
  image_url: string;
  storage_path: string;
  tags: string[];
  source: string;
  notes: string | null;
  is_cross_niche: boolean;
  created_at: string;
}

export function useCategoryWinners(categoryId: string | null) {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["category-winners", categoryId],
    enabled: !!workspaceId && !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genie_category_winners")
        .select("*")
        .eq("category_id", categoryId!)
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const results = data as CategoryWinner[];
      if (results.length === 0 && DEMO_MODE) return buildDemoWinners(categoryId!);
      return results;
    },
  });
}

export function useCreateCategoryWinner() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();

  return useMutation({
    mutationFn: async (vals: { category_id: string; image_url: string; storage_path?: string; tags?: string[]; is_cross_niche?: boolean; notes?: string }) => {
      if (!workspaceId) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("genie_category_winners")
        .insert({ ...vals, workspace_id: workspaceId, storage_path: vals.storage_path || "" })
        .select()
        .single();
      if (error) throw error;
      return data as CategoryWinner;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["category-winners"] }),
  });
}

export function useDeleteCategoryWinner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("genie_category_winners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["category-winners"] }),
  });
}
