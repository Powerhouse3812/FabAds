import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

export function useInsightQueue() {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const items = useQuery({
    queryKey: ["insight-queue", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_queue_items")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addToQueue = useMutation({
    mutationFn: async (values: { source_ad_id: string; action_type?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_queue_items").insert({
        workspace_id: wsId,
        source_ad_id: values.source_ad_id,
        action_type: values.action_type ?? "analyze",
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-queue", wsId] }),
  });

  const removeFromQueue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insight_queue_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-queue", wsId] }),
  });

  const clearQueue = useMutation({
    mutationFn: async () => {
      if (!wsId) throw new Error("No workspace");
      const { error } = await supabase.from("insight_queue_items").delete().eq("workspace_id", wsId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-queue", wsId] }),
  });

  return { items: items.data ?? [], isLoading: items.isLoading, addToQueue, removeFromQueue, clearQueue };
}
