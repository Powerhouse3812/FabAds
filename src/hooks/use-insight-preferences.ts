import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

export function useInsightPreferences() {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["insight-preferences", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) return null;
      const { data, error } = await supabase
        .from("insight_user_preferences")
        .select("*")
        .eq("workspace_id", wsId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: { industries: string[]; interests: string[]; followed_brands?: string[]; followed_tags?: string[]; onboarded?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const row = {
        workspace_id: wsId,
        user_id: user.id,
        industries: values.industries,
        interests: values.interests,
        followed_brands: values.followed_brands ?? query.data?.followed_brands ?? [],
        followed_tags: values.followed_tags ?? [],
        onboarded: values.onboarded ?? true,
      };
      if (query.data?.id) {
        const { error } = await supabase.from("insight_user_preferences").update(row).eq("id", query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insight_user_preferences").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-preferences", wsId] }),
  });

  const toggleFollowBrand = useMutation({
    // Returns the resolved action so `onSuccess` can render a precise toast
    // ("Following X" vs "Unfollowed X") without re-reading state — the
    // mutation body is the only place that knows whether the brand was in
    // `current` before the toggle.
    mutationFn: async (brandName: string): Promise<{ brand: string; action: "followed" | "unfollowed" }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const current = query.data?.followed_brands ?? [];
      const wasFollowing = current.includes(brandName);
      const updated = wasFollowing
        ? current.filter((b: string) => b !== brandName)
        : [...current, brandName];

      if (query.data?.id) {
        const { error } = await supabase.from("insight_user_preferences").update({ followed_brands: updated }).eq("id", query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insight_user_preferences").insert({
          workspace_id: wsId,
          user_id: user.id,
          followed_brands: updated,
          industries: [],
          interests: [],
          onboarded: false,
        });
        if (error) throw error;
      }
      return { brand: brandName, action: wasFollowing ? "unfollowed" : "followed" };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["insight-preferences", wsId] });
      // Plain sonner toast (not success/error) — follow is a routine
      // preference change, not an outcome. The verb in the copy carries
      // the meaning. Brand name in regular weight, action in muted prefix.
      if (result.action === "followed") {
        toast(`Following ${result.brand}`, {
          description: "New ads from this brand will appear in your feed.",
        });
      } else {
        toast(`Unfollowed ${result.brand}`, {
          description: "We'll stop surfacing this brand's ads.",
        });
      }
    },
    onError: () => {
      toast.error("Couldn't update follow state", {
        description: "Try again in a moment.",
      });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    followedBrands: (query.data?.followed_brands ?? []) as string[],
    upsert,
    toggleFollowBrand,
  };
}
