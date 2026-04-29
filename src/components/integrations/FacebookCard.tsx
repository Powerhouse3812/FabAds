import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/hooks/use-toast";
import ConnectFacebookButton from "./ConnectFacebookButton";
import DisconnectDialog from "./DisconnectDialog";
import type { FbConnectionSafe } from "@/hooks/use-fb-connection";
import { format } from "date-fns";

interface FacebookCardProps {
  connection: FbConnectionSafe | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function FacebookCard({ connection, loading, onRefresh }: FacebookCardProps) {
  const { role } = useAuth();
  const workspaceId = useWorkspace();
  const [syncing, setSyncing] = useState(false);
  const isAdmin = role === "owner" || role === "admin";

  const handleSync = async () => {
    if (!workspaceId) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fb-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ workspace_id: workspaceId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Sync failed");
      toast({
        title: "Sync complete",
        description: `${result.business_managers} Business Managers, ${result.ad_accounts} Ad Accounts imported.`,
      });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook</CardTitle>
          <CardDescription>Loading connection status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Not connected
  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook</CardTitle>
          <CardDescription>Connect your Facebook account to import Business Managers and Ad Accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <ConnectFacebookButton onConnected={onRefresh} />
          ) : (
            <p className="text-sm text-muted-foreground">No integrations connected. Ask an Owner or Admin to connect Facebook.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const isConnected = connection.status === "connected";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Facebook
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {connection.fb_user_name} · Connected {format(new Date(connection.connected_at), "MMM d, yyyy")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Last synced:</span>{" "}
            {connection.last_synced_at
              ? format(new Date(connection.last_synced_at), "MMM d, yyyy h:mm a")
              : "Never synced"}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {isConnected ? (
              <>
                <Button size="sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <DisconnectDialog onDisconnected={onRefresh} />
              </>
            ) : (
              <ConnectFacebookButton onConnected={onRefresh} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
