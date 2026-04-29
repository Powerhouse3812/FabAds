import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";

export interface GenieCategory {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  icon: string;
  niche: string | null;
  system_prompt: string | null;
  reference_urls: any;
  created_at: string;
  updated_at: string;
}

export function useGenieCategories() {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["genie-categories", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genie_categories")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as GenieCategory[];
    },
  });
}

export function useCreateGenieCategory() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (vals: { name: string; icon?: string; niche?: string }) => {
      if (!workspaceId || !user) throw new Error("Not ready");
      const { data, error } = await supabase
        .from("genie_categories")
        .insert({
          workspace_id: workspaceId,
          created_by: user.id,
          name: vals.name,
          icon: vals.icon || "📁",
          niche: vals.niche || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as GenieCategory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genie-categories"] }),
  });
}

export function useUpdateGenieCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: { id: string } & Partial<Omit<GenieCategory, "id" | "workspace_id" | "created_by" | "created_at" | "updated_at">>) => {
      const { error } = await supabase.from("genie_categories").update(vals).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genie-categories"] }),
  });
}

export function useDeleteGenieCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("genie_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genie-categories"] }),
  });
}
