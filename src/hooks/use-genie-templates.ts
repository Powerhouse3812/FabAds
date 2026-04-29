import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface GenieTemplate {
  id: string;
  workspace_id: string;
  created_by: string;
  image_url: string;
  tags: string[];
  name: string;
  created_at: string;
  brand_id: string | null;
  category_id: string | null;
}

export function useGenieTemplates() {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["genie-templates", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genie_templates" as any)
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as GenieTemplate[];
    },
  });
}

export function useDeleteGenieTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("genie_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genie-templates"] }),
  });
}

export function useUpdateGenieTemplateTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase.from("genie_templates" as any).update({ tags } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genie-templates"] }),
  });
}

export function useCreateGenieTemplate() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ image_url, tags, name, brand_id, category_id }: {
      image_url: string;
      tags: string[];
      name: string;
      brand_id?: string | null;
      category_id?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !workspaceId) throw new Error("Not authenticated");
      const { error } = await supabase.from("genie_templates" as any).insert({
        workspace_id: workspaceId,
        created_by: user.id,
        image_url,
        tags,
        name,
        brand_id: brand_id || null,
        category_id: category_id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["genie-templates"] }),
  });
}
