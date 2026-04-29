import type { LaunchAdAccount, LaunchCampaign, LaunchAdset, LaunchAd } from "@/hooks/use-launch-data";

export interface CatalogueValidationResult {
  valid: boolean;
  errors: Array<{ entityType: string; entityId: string; field: string; message: string }>;
}

export function validateCatalogueLaunch(
  accounts: LaunchAdAccount[],
  campaigns: LaunchCampaign[],
  adsets: LaunchAdset[],
  ads: LaunchAd[],
): CatalogueValidationResult {
  const errors: CatalogueValidationResult["errors"] = [];

  // Account validation
  for (const acc of accounts) {
    const cfg = (acc.setup_config || {}) as Record<string, any>;
    if (!cfg.website_url) {
      errors.push({ entityType: "account", entityId: acc.id, field: "website_url", message: "Website URL is required" });
    }
    const catDefaults = cfg.catalogue_ads_defaults || {};
    if (!catDefaults.catalogue_id) {
      errors.push({ entityType: "account", entityId: acc.id, field: "catalogue_id", message: "Catalogue is required" });
    }
  }

  // Campaign validation
  for (const camp of campaigns) {
    if (!camp.objective) {
      errors.push({ entityType: "campaign", entityId: camp.id, field: "objective", message: "Objective is required" });
    }
    const override = (camp as any).catalogue_ads_override as Record<string, any> | null;
    if (override?.enabled && !override.catalogue_id) {
      errors.push({ entityType: "campaign", entityId: camp.id, field: "catalogue_override_id", message: "Override catalogue is required" });
    }
  }

  // Adset validation
  for (const adset of adsets) {
    const targeting = (adset.targeting || {}) as Record<string, any>;
    if (!targeting.product_set_id) {
      errors.push({ entityType: "adset", entityId: adset.id, field: "product_set_id", message: "Product Set is required" });
    }
    const locations = targeting.locations || [];
    if (!locations.length) {
      errors.push({ entityType: "adset", entityId: adset.id, field: "locations", message: "At least one location is required" });
    }
  }

  // Ad validation
  for (const ad of ads) {
    if (!ad.primary_text) errors.push({ entityType: "ad", entityId: ad.id, field: "primary_text", message: "Primary text is required" });
    if (!ad.headline) errors.push({ entityType: "ad", entityId: ad.id, field: "headline", message: "Headline is required" });
    if (!ad.cta) errors.push({ entityType: "ad", entityId: ad.id, field: "cta", message: "CTA is required" });
    if (!ad.destination_url) errors.push({ entityType: "ad", entityId: ad.id, field: "destination_url", message: "Destination URL is required" });
  }

  return { valid: errors.length === 0, errors };
}
