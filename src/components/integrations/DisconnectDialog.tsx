import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DisconnectDialogProps {
  onDisconnected: () => void;
}

export default function DisconnectDialog({ onDisconnected }: DisconnectDialogProps) {
  const workspaceId = useWorkspace();
  const [open, setOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!workspaceId) return;
    setIsDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fb-disconnect`,
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
      if (!res.ok) throw new Error(result.error || "Disconnect failed");
      toast({ title: "Facebook disconnected" });
      setOpen(false);
      onDisconnected();
    } catch (err: any) {
      toast({ title: "Disconnect failed", description: err.message, variant: "destructive" });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!isDisconnecting) setOpen(v); }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Disconnect</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Facebook?</AlertDialogTitle>
          <AlertDialogDescription>
            This will revoke the token. Historical data (Business Managers, Ad Accounts) will be preserved. You can reconnect later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting…
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}