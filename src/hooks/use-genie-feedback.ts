import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import { useAuth } from "@/contexts/AuthContext";

export interface GenieFeedback {
  id: string;
  workspace_id: string;
  user_id: string;
  feedback_type: "up" | "down";
  comment: string | null;
  target_type: string;
  target_id: string;
  strategy_angle: string | null;
  strategy_title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FeedbackStat {
  strategy_angle: string;
  likes: number;
  dislikes: number;
}

export function useMyFeedback(targetId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["genie-feedback", "mine", targetId],
    enabled: !!user && !!targetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genie_feedback")
        .select("*")
        .eq("user_id", user!.id)
        .eq("target_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return data as GenieFeedback | null;
    },
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      targetId: string;
      targetType: "result_card" | "strategy_card";
      feedbackType: "up" | "down";
      comment?: string;
      strategyAngle?: string;
      strategyTitle?: string;
    }) => {
      if (!workspaceId || !user) throw new Error("Not ready");

      // Upsert based on unique constraint (user_id, target_id, target_type)
      const { error } = await supabase.from("genie_feedback").upsert(
        {
          workspace_id: workspaceId,
          user_id: user.id,
          target_id: params.targetId,
          target_type: params.targetType,
          feedback_type: params.feedbackType,
          comment: params.comment || null,
          strategy_angle: params.strategyAngle || null,
          strategy_title: params.strategyTitle || null,
        },
        { onConflict: "user_id,target_id,target_type" }
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["genie-feedback", "mine", vars.targetId] });
      qc.invalidateQueries({ queryKey: ["genie-feedback", "stats"] });
    },
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("genie_feedback")
        .delete()
        .eq("user_id", user.id)
        .eq("target_id", targetId);
      if (error) throw error;
    },
    onSuccess: (_, targetId) => {
      qc.invalidateQueries({ queryKey: ["genie-feedback", "mine", targetId] });
      qc.invalidateQueries({ queryKey: ["genie-feedback", "stats"] });
    },
  });
}

export function useFeedbackStats() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["genie-feedback", "stats", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("genie_feedback")
        .select("strategy_angle, feedback_type")
        .eq("workspace_id", workspaceId!)
        .not("strategy_angle", "is", null);
      if (error) throw error;

      const map: Record<string, { likes: number; dislikes: number }> = {};
      for (const row of data || []) {
        const angle = (row as any).strategy_angle as string;
        if (!map[angle]) map[angle] = { likes: 0, dislikes: 0 };
        if ((row as any).feedback_type === "up") map[angle].likes++;
        else map[angle].dislikes++;
      }

      return Object.entries(map)
        .map(([strategy_angle, counts]) => ({ strategy_angle, ...counts }))
        .sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes)) as FeedbackStat[];
    },
  });
}
