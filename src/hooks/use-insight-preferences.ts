import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    mutationFn: async (brandName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const current = query.data?.followed_brands ?? [];
      const updated = current.includes(brandName)
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
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-preferences", wsId] }),
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    followedBrands: (query.data?.followed_brands ?? []) as string[],
    upsert,
    toggleFollowBrand,
  };
}
