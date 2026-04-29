import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface ClAdgroup {
  id: string;
  workspace_id: string;
  name: string;
  page_name: string;
  page_avatar_url: string | null;
  ad_type: string;
  primary_text_id: string | null;
  headline_id: string | null;
  description_id: string | null;
  media_ids: string[];
  destination_url: string | null;
  display_link: string | null;
  cta: string;
  is_favourite: boolean;
  created_by: string;
  created_at: string;
}

export function useClAdgroups() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["cl-adgroups", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cl_adgroups")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ClAdgroup[];
    },
  });
}

export function useCreateAdgroup() {
  const workspaceId = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      page_name: string;
      page_avatar_url?: string;
      ad_type?: string;
      primary_text_id?: string | null;
      headline_id?: string | null;
      description_id?: string | null;
      media_ids: string[];
      destination_url?: string;
      display_link?: string;
      cta?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!workspaceId) throw new Error("No workspace");

      const { data, error } = await (supabase as any)
        .from("cl_adgroups")
        .insert({
          workspace_id: workspaceId,
          name: input.name,
          page_name: input.page_name,
          page_avatar_url: input.page_avatar_url || null,
          ad_type: input.ad_type || "Static",
          primary_text_id: input.primary_text_id || null,
          headline_id: input.headline_id || null,
          description_id: input.description_id || null,
          media_ids: input.media_ids,
          destination_url: input.destination_url || null,
          display_link: input.display_link || null,
          cta: input.cta || "CTA button",
          created_by: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as ClAdgroup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl-adgroups"] });
    },
  });
}

export function useUpdateAdgroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClAdgroup> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("cl_adgroups")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ClAdgroup;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl-adgroups"] });
    },
  });
}

export function useDeleteAdgroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("cl_adgroups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cl-adgroups"] });
    },
  });
}
