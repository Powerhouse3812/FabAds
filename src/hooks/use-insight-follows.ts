import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

export function useInsightFollows() {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const follows = useQuery({
    queryKey: ["insight-follows", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) return [];
      const { data, error } = await supabase
        .from("insight_follows")
        .select("*, insight_competitors(*)")
        .eq("workspace_id", wsId)
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const follow = useMutation({
    mutationFn: async (competitorId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_follows").insert({
        workspace_id: wsId,
        user_id: user.id,
        competitor_id: competitorId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-follows", wsId] }),
  });

  const unfollow = useMutation({
    mutationFn: async (competitorId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("insight_follows")
        .delete()
        .eq("user_id", user.id)
        .eq("competitor_id", competitorId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-follows", wsId] }),
  });

  const isFollowing = (competitorId: string) =>
    (follows.data ?? []).some((f: any) => f.competitor_id === competitorId);

  return { follows: follows.data ?? [], isLoading: follows.isLoading, follow, unfollow, isFollowing };
}
