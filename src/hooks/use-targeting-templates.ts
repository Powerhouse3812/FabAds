import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface TargetingTemplate {
  id: string;
  workspace_id: string;
  name: string;
  platform: string;
  template_payload: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useTargetingTemplates() {
  const workspaceId = useWorkspace();
  return useQuery({
    queryKey: ["targeting-templates", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<TargetingTemplate[]> => {
      const { data, error } = await (supabase as any)
        .from("targeting_templates")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTargetingTemplate() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  return useMutation({
    mutationFn: async ({ name, payload }: { name: string; payload: Record<string, any> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("targeting_templates")
        .insert({
          workspace_id: workspaceId,
          name,
          platform: "facebook",
          template_payload: payload,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["targeting-templates"] }),
  });
}

export function useUpdateTargetingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, payload }: { id: string; name: string; payload: Record<string, any> }) => {
      const { error } = await (supabase as any)
        .from("targeting_templates")
        .update({ name, template_payload: payload })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["targeting-templates"] }),
  });
}

export function useDeleteTargetingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("targeting_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["targeting-templates"] }),
  });
}
