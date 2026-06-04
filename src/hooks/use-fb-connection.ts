import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";

export interface FbConnectionSafe {
  id: string;
  workspace_id: string;
  fb_user_id: string;
  fb_user_name: string;
  status: string;
  connected_by: string;
  connected_at: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface FbBusinessManager {
  id: string;
  fb_business_id: string;
  name: string;
  created_at: string;
}

export interface FbAdAccount {
  id: string;
  fb_account_id: string;
  name: string;
  currency: string | null;
  account_status: number | null;
  fb_business_manager_id: string | null;
  created_at: string;
  /**
   * IANA timezone for the account. The DB column is owned by the
   * reports/migration slice and is NOT applied live yet, so real rows won't
   * carry it — always resolve the effective tz via getAccountTimezone().
   */
  timezone?: string | null;
}

export function useFbConnection() {
  const workspaceId = useWorkspace();

  const connectionQuery = useQuery({
    queryKey: ["fb-connection", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      // Use the safe view to avoid token exposure
      const { data, error } = await (supabase as any)
        .from("fb_connections_safe")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .maybeSingle();
      if (error) throw error;
      return data as FbConnectionSafe | null;
    },
  });

  const businessManagersQuery = useQuery({
    queryKey: ["fb-business-managers", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fb_business_managers")
        .select("id, fb_business_id, name, created_at")
        .eq("workspace_id", workspaceId!);
      if (error) throw error;
      return (data || []) as FbBusinessManager[];
    },
  });

  const adAccountsQuery = useQuery({
    queryKey: ["fb-ad-accounts", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fb_ad_accounts")
        .select("id, fb_account_id, name, currency, account_status, fb_business_manager_id, created_at")
        .eq("workspace_id", workspaceId!);
      if (error) throw error;
      return (data || []) as FbAdAccount[];
    },
  });

  return {
    connection: connectionQuery.data ?? null,
    connectionLoading: connectionQuery.isLoading,
    businessManagers: businessManagersQuery.data ?? [],
    adAccounts: adAccountsQuery.data ?? [],
    dataLoading: businessManagersQuery.isLoading || adAccountsQuery.isLoading,
    refetchAll: () => {
      connectionQuery.refetch();
      businessManagersQuery.refetch();
      adAccountsQuery.refetch();
    },
  };
}
