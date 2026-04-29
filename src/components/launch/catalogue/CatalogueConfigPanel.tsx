import { ScrollArea } from "@/components/ui/scroll-area";
import { CatalogueAccountForm } from "./CatalogueAccountForm";
import { CatalogueCampaignForm } from "./CatalogueCampaignForm";
import { CatalogueAdsetForm } from "./CatalogueAdsetForm";
import { CatalogueAdForm } from "./CatalogueAdForm";
import { CatalogueBulkToolbar } from "./CatalogueBulkToolbar";
import type { SelectedEntity, EntityType } from "./CatalogueHierarchyPanel";
import type { LaunchFull } from "@/hooks/use-launch-data";
import { useFbConnection } from "@/hooks/use-fb-connection";

const DUMMY_ACCOUNT_NAMES = [
  "Ad-account_name_example_0",
  "Ad-account_name_example_1",
  "Ad-account_name_example_2",
  "Ad-account_name_example_3",
  "Ad-account_name_example_4",
];

interface Props {
  launchData: LaunchFull;
  selectedEntity: SelectedEntity | null;
  checkedType: EntityType | null;
  checkedCount: number;
  onFieldChange: (entityType: string, entityId: string, field: string, value: any) => void;
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
  fieldErrors: Record<string, string>;
}

const SUBTITLES: Record<EntityType, string> = {
  account: "Set on tracking settings and campaign, adset, ad configurations",
  campaign: "Configure campaign objective, budget, and catalogue settings",
  adset: "Configure targeting, product set, and placement settings",
  ad: "Configure ad copy, creative, and destination settings",
};

export function CatalogueConfigPanel({
  launchData,
  selectedEntity,
  checkedType,
  checkedCount,
  onFieldChange,
  onBulkAction,
  onClearSelection,
  fieldErrors,
}: Props) {
  const { adAccounts: fbAccounts } = useFbConnection();

  const resolveCatalogueId = (adsetId: string): string => {
    const adset = launchData.adsets.find((a) => a.id === adsetId);
    if (!adset) return "";
    const campaign = launchData.campaigns.find((c) => c.id === adset.campaign_id);
    const override = (campaign as any)?.catalogue_ads_override as Record<string, any> | null;
    if (override?.enabled && override.catalogue_id) return override.catalogue_id;
    const firstAcc = launchData.ad_accounts[0];
    const cfg = (firstAcc?.setup_config || {}) as Record<string, any>;
    return cfg.catalogue_ads_defaults?.catalogue_id || "";
  };

  const getEntityName = (): string => {
    if (!selectedEntity) return "";
    const { type, id } = selectedEntity;
    if (type === "account") {
      const accIndex = launchData.ad_accounts.findIndex((a) => a.id === id);
      const acc = launchData.ad_accounts[accIndex];
      if (!acc) return "Ad Account";
      const fbAcc = fbAccounts.find((a) => a.id === acc.fb_ad_account_id);
      return fbAcc?.name || DUMMY_ACCOUNT_NAMES[accIndex] || `Ad-account_name_example_${accIndex}`;
    }
    if (type === "campaign") return launchData.campaigns.find((c) => c.id === id)?.name || "Campaign";
    if (type === "adset") return launchData.adsets.find((a) => a.id === id)?.name || "Adset";
    if (type === "ad") return launchData.ads.find((a) => a.id === id)?.name || "Ad";
    return "";
  };

  const renderForm = () => {
    if (!selectedEntity) {
      return (
        <div className="flex items-center justify-center h-full text-center px-4">
          <div>
            <p className="text-sm font-medium text-foreground">Select an entity</p>
            <p className="text-xs text-muted-foreground mt-1">Click on an item in the hierarchy to configure it</p>
          </div>
        </div>
      );
    }

    const { type, id } = selectedEntity;

    if (type === "account") {
      const account = launchData.ad_accounts.find((a) => a.id === id);
      if (!account) return null;
      return (
        <CatalogueAccountForm
          account={account}
          onFieldChange={(field, value) => onFieldChange("launch_ad_accounts", id, field, value)}
          fieldErrors={fieldErrors}
        />
      );
    }

    if (type === "campaign") {
      const campaign = launchData.campaigns.find((c) => c.id === id);
      if (!campaign) return null;
      return (
        <CatalogueCampaignForm
          campaign={campaign}
          onFieldChange={(field, value) => onFieldChange("launch_campaigns", id, field, value)}
          fieldErrors={fieldErrors}
        />
      );
    }

    if (type === "adset") {
      const adset = launchData.adsets.find((a) => a.id === id);
      if (!adset) return null;
      return (
        <CatalogueAdsetForm
          adset={adset}
          catalogueId={resolveCatalogueId(id)}
          onFieldChange={(field, value) => onFieldChange("launch_adsets", id, field, value)}
          fieldErrors={fieldErrors}
        />
      );
    }

    if (type === "ad") {
      const ad = launchData.ads.find((a) => a.id === id);
      if (!ad) return null;
      return (
        <CatalogueAdForm
          ad={ad}
          onFieldChange={(field, value) => onFieldChange("launch_ads", id, field, value)}
          fieldErrors={fieldErrors}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Bulk toolbar */}
      {checkedType && checkedCount > 0 && (
        <CatalogueBulkToolbar
          checkedType={checkedType}
          checkedCount={checkedCount}
          onBulkAction={onBulkAction}
          onClearSelection={onClearSelection}
        />
      )}

      {/* Header */}
      {selectedEntity && (
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Setting up — {getEntityName()}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {SUBTITLES[selectedEntity.type]}
          </p>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderForm()}
        </div>
      </ScrollArea>
    </div>
  );
}
