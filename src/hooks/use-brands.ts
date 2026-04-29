import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Brand {
  id: string;
  workspace_id: string;
  client_id: string | null;
  name: string;
  website: string | null;
  category: string | null;
  industry: string | null;
  colors: string[];
  logo_url: string | null;
  guidelines: string | null;
  tone: string | null;
  typography: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useBrands(clientId?: string | null) {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["brands", workspaceId, clientId],
    queryFn: async () => {
      if (!workspaceId) return [];
      let q = supabase
        .from("brands")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name");

      if (clientId) {
        q = q.eq("client_id", clientId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Brand[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateBrand() {
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      website?: string;
      category?: string;
      industry?: string;
      colors?: string[];
      logo_url?: string;
      guidelines?: string;
      tone?: string;
      client_id?: string;
    }) => {
      if (!workspaceId || !user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("brands")
        .insert({
          workspace_id: workspaceId,
          created_by: user.id,
          name: params.name,
          website: params.website || null,
          category: params.category || null,
          industry: params.industry || null,
          colors: params.colors || [],
          logo_url: params.logo_url || null,
          guidelines: params.guidelines || null,
          tone: params.tone || null,
          client_id: params.client_id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Brand;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string } & Partial<Omit<Brand, "id" | "workspace_id" | "created_by" | "created_at">>) => {
      const { id, ...rest } = params;
      const { error } = await supabase
        .from("brands")
        .update(rest as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand deleted");
    },
    onError: () => toast.error("Failed to delete brand"),
  });
}
