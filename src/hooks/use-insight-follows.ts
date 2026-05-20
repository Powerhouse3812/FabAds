import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

/**
 * Mutation variable shape for follow/unfollow. The `name` is carried
 * through purely so `onSuccess` can render a precise toast ("Following
 * Mamaearth") without an extra round-trip to look it up. Falls back to a
 * generic copy if name is missing.
 */
export interface FollowMutationVars {
  id: string;
  name?: string;
}

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
    // Back-compat: accept a plain string id (legacy callers) OR the
    // new {id, name} variable shape. New callers should pass the object
    // so `onSuccess` can render a precise toast naming the brand.
    mutationFn: async (vars: FollowMutationVars | string) => {
      const id = typeof vars === "string" ? vars : vars.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_follows").insert({
        workspace_id: wsId,
        user_id: user.id,
        competitor_id: id,
      });
      if (error) throw error;
      return typeof vars === "string" ? { id } : vars;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["insight-follows", wsId] });
      // Plain sonner toast — preference change is routine, not an
      // outcome event. Description carries the consequence so the user
      // knows what changed without reading the brand twice.
      toast(result.name ? `Following ${result.name}` : "Brand followed", {
        description: "We'll surface this brand's new ads in your feed.",
      });
    },
    onError: () => {
      toast.error("Couldn't follow", { description: "Try again in a moment." });
    },
  });

  const unfollow = useMutation({
    mutationFn: async (vars: FollowMutationVars | string) => {
      const id = typeof vars === "string" ? vars : vars.id;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("insight_follows")
        .delete()
        .eq("user_id", user.id)
        .eq("competitor_id", id);
      if (error) throw error;
      return typeof vars === "string" ? { id } : vars;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["insight-follows", wsId] });
      toast(result.name ? `Unfollowed ${result.name}` : "Brand unfollowed", {
        description: "We'll stop surfacing this brand's ads.",
      });
    },
    onError: () => {
      toast.error("Couldn't unfollow", { description: "Try again in a moment." });
    },
  });

  const isFollowing = (competitorId: string) =>
    (follows.data ?? []).some((f: any) => f.competitor_id === competitorId);

  return { follows: follows.data ?? [], isLoading: follows.isLoading, follow, unfollow, isFollowing };
}
