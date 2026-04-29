import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useWorkspace() {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workspace_users")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        setWorkspaceId(data?.workspace_id ?? null);
      });
  }, [user]);

  return workspaceId;
}
