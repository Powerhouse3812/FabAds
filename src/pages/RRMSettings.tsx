import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useFbConnection } from "@/hooks/use-fb-connection";
import {
  useRRMGlobalSettings,
  useRRMAccountSettings,
  useRRMCampaignUrls,
  useUpsertRRMSetting,
  useBulkUpsertRRMSettings,
} from "@/hooks/use-rrm-settings";
import { useAccountHealthConfigs } from "@/hooks/use-account-health";
import { RRMGlobalSettings } from "@/components/rrm/RRMGlobalSettings";
import { RRMBulkTable } from "@/components/rrm/RRMBulkTable";
import { RRMConfigDrawer } from "@/components/rrm/RRMConfigDrawer";
import { RRMCreateOfferModal } from "@/components/rrm/RRMCreateOfferModal";

export default function RRMSettings() {
  const workspaceId = useWorkspace();
  const { adAccounts, dataLoading } = useFbConnection();
  const { data: globalSettings } = useRRMGlobalSettings(workspaceId);
  const { data: accountSettings } = useRRMAccountSettings(workspaceId);
  const { data: offers } = useRRMCampaignUrls(workspaceId);
  const { data: healthConfigs } = useAccountHealthConfigs(workspaceId);
  const upsertSetting = useUpsertRRMSetting();
  const bulkUpsert = useBulkUpsertRRMSettings();

  const [configAccountId, setConfigAccountId] = useState<string | null>(null);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);

  const settings = accountSettings ?? [];
  const allOffers = offers ?? [];
  const offerList = allOffers.map((o) => ({ id: o.id, name: o.name }));
  const settingsMap = Object.fromEntries(settings.map((s) => [s.fb_ad_account_id, s]));
  const configMap = Object.fromEntries((healthConfigs ?? []).map((c) => [c.fb_ad_account_id, c]));
  const configAccount = adAccounts.find((a) => a.id === configAccountId);

  const handleToggle = (accountId: string, field: "dilution_enabled" | "replacement_enabled", enabled: boolean) => {
    if (!workspaceId) return;
    upsertSetting.mutate({
      workspace_id: workspaceId,
      fb_ad_account_id: accountId,
      [field]: enabled,
    });
  };

  const handleAssignOffer = (accountId: string, field: "dilution_campaign_url_id" | "replacement_campaign_url_id", offerId: string | null) => {
    if (!workspaceId) return;
    upsertSetting.mutate({
      workspace_id: workspaceId,
      fb_ad_account_id: accountId,
      [field]: offerId,
    });
  };

  const handleBulkAssign = (accountIds: string[], offerId: string, fields: { dilution: boolean; replacement: boolean }) => {
    if (!workspaceId) return;
    const rows = accountIds.map((id) => ({
      workspace_id: workspaceId,
      fb_ad_account_id: id,
      ...(fields.dilution ? { dilution_campaign_url_id: offerId, dilution_enabled: true } : {}),
      ...(fields.replacement ? { replacement_campaign_url_id: offerId, replacement_enabled: true } : {}),
    }));
    bulkUpsert.mutate(rows);
  };

  return (
    <div className="space-y-6">

      {workspaceId && (
        <RRMGlobalSettings
          workspaceId={workspaceId}
          settings={globalSettings ?? null}
          offers={offerList}
          onCreateOffer={() => setCreateOfferOpen(true)}
        />
      )}

      <RRMBulkTable
        accounts={adAccounts}
        settings={settings}
        offers={allOffers}
        loading={dataLoading}
        onToggle={handleToggle}
        onAssignOffer={handleAssignOffer}
        onBulkAssign={handleBulkAssign}
        onConfigureAccount={setConfigAccountId}
      />

      {configAccountId && (
        <RRMConfigDrawer
          open={!!configAccountId}
          onOpenChange={(open) => { if (!open) setConfigAccountId(null); }}
          accountId={configAccountId}
          accountName={configAccount?.name ?? "Account"}
          workspaceId={workspaceId ?? ""}
          config={configMap[configAccountId] ?? null}
          accountSetting={settingsMap[configAccountId] ?? null}
          offers={offerList}
        />
      )}

      {workspaceId && (
        <RRMCreateOfferModal
          open={createOfferOpen}
          onOpenChange={setCreateOfferOpen}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}
