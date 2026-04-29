import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FakeLoginStep from "./FakeLoginStep";
import FetchingAccountsStep from "./FetchingAccountsStep";
import AccountSelectionStep, { type SimulatedBM } from "./AccountSelectionStep";

type Step = "login" | "fetching" | "selection" | "importing";

interface FacebookConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export default function FacebookConnectModal({ open, onOpenChange, onConnected }: FacebookConnectModalProps) {
  const workspaceId = useWorkspace();
  const [step, setStep] = useState<Step>("login");
  const [bmData, setBmData] = useState<SimulatedBM[]>([]);

  const reset = () => {
    setStep("login");
    setBmData([]);
  };

  const handleClose = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const fetchAccounts = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("fb-simulate-connect", {
      body: { workspace_id: workspaceId, dry_run: true },
    });
    if (error) throw error;
    return data;
  }, [workspaceId]);

  const handleFetched = (data: any) => {
    setBmData(data.business_managers_data || []);
    setStep("selection");
  };

  const handleImport = async (selectedIds: string[]) => {
    setStep("importing");
    try {
      const { data, error } = await supabase.functions.invoke("fb-simulate-connect", {
        body: {
          workspace_id: workspaceId,
          selected_ad_account_ids: selectedIds,
          business_managers_data: bmData,
        },
      });
      if (error) throw error;
      toast({
        title: "Facebook Connected",
        description: `Successfully imported ${data.ad_accounts} ad account${data.ad_accounts !== 1 ? "s" : ""}.`,
      });
      handleClose(false);
      onConnected?.();
    } catch (err: any) {
      console.error("Import failed:", err);
      toast({ title: "Import Failed", description: err.message || "Something went wrong.", variant: "destructive" });
      setStep("selection");
    }
  };

  const handleCancel = () => handleClose(false);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[85vh] p-6 gap-0 flex flex-col overflow-hidden">
        {step === "login" && <FakeLoginStep onLogin={() => setStep("fetching")} />}
        {step === "fetching" && (
          <FetchingAccountsStep fetchAccounts={fetchAccounts} onFetched={handleFetched} />
        )}
        {(step === "selection" || step === "importing") && (
          <AccountSelectionStep
            businessManagers={bmData}
            onImport={handleImport}
            onCancel={handleCancel}
            importing={step === "importing"}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
