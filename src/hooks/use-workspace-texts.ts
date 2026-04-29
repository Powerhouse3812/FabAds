import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface WorkspaceTexts {
  primaryTexts: string[];
  headlines: string[];
  descriptions: string[];
}

export function useWorkspaceTexts() {
  const workspaceId = useWorkspace();

  return useQuery({
    queryKey: ["workspace-texts", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<WorkspaceTexts> => {
      const [ptRes, hlRes, descRes] = await Promise.all([
        (supabase as any).from("cl_primary_texts").select("text").eq("workspace_id", workspaceId),
        (supabase as any).from("cl_headlines").select("text").eq("workspace_id", workspaceId),
        (supabase as any).from("cl_descriptions").select("text").eq("workspace_id", workspaceId),
      ]);

      return {
        primaryTexts: (ptRes.data || []).map((r: any) => r.text),
        headlines: (hlRes.data || []).map((r: any) => r.text),
        descriptions: (descRes.data || []).map((r: any) => r.text),
      };
    },
  });
}
