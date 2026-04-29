import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  client_id: string;
  user_id: string;
  workspace_id: string;
  created_at: string;
}

export function useClients() {
  const { user } = useAuth();
  const workspaceId = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    const [{ data: clientsData }, { data: cuData }] = await Promise.all([
      supabase.from("clients").select("*").eq("workspace_id", workspaceId).order("name"),
      supabase.from("client_users").select("*").eq("workspace_id", workspaceId),
    ]);

    setClients((clientsData as Client[]) ?? []);
    setClientUsers((cuData as ClientUser[]) ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Clients assigned to the current user
  const myClients = clients.filter((c) =>
    clientUsers.some((cu) => cu.client_id === c.id && cu.user_id === user?.id)
  );

  return { clients, clientUsers, myClients, loading, refetch: fetchClients };
}
