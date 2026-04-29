import type { LaunchFull, LaunchCampaign, LaunchAdset, LaunchAd, LaunchAdAccount } from "@/hooks/use-launch-data";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  valid: boolean;
  fieldErrors: Record<string, string>;
  errors: string[];
}

// ─── Step 1 ───

export function validateStep1(data: {
  name: string;
  selectedAccounts: string[];
  strategy: { campaigns: number; adsets: number; ads: number };
  setupConfigs: Record<string, Record<string, unknown>>;
}): FieldValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (!data.name.trim()) fieldErrors["launch-name"] = "Launch name is required";
  if (data.selectedAccounts.length === 0) fieldErrors["ad-accounts"] = "Select at least one ad account";
  if (data.strategy.campaigns < 1) fieldErrors["strategy-campaigns"] = "At least 1 campaign required";
  if (data.strategy.adsets < 1) fieldErrors["strategy-adsets"] = "At least 1 adset required";
  if (data.strategy.ads < 1) fieldErrors["strategy-ads"] = "At least 1 ad required";

  for (const accId of data.selectedAccounts) {
    const config = data.setupConfigs[accId];
    if (!config?.website_url || !(config.website_url as string).trim()) {
      fieldErrors[`website-url-${accId}`] = "Website URL is required";
    }
  }

  const errors = Object.values(fieldErrors);
  return { valid: errors.length === 0, fieldErrors, errors };
}

// ─── Step 2 ───

export function validateStep2(campaigns: LaunchCampaign[], adsets: LaunchAdset[]): FieldValidationResult {
  const fieldErrors: Record<string, string> = {};

  for (const camp of campaigns) {
    if (!camp.objective) fieldErrors[`objective-${camp.id}`] = "Objective is required";

    const isCBO = camp.budget_type === "cbo" || camp.budget_type === "CBO";
    if (isCBO && (!camp.budget_value || camp.budget_value <= 0)) {
      fieldErrors[`budget-${camp.id}`] = "Budget is required (CBO)";
    }

    const campAdsets = adsets.filter((a) => a.campaign_id === camp.id);
    for (const adset of campAdsets) {
      const targeting = adset.targeting as Record<string, any> | null;

      // Schedule start only required if scheduling is enabled
      if (targeting?.scheduling_enabled && !adset.schedule_start) {
        fieldErrors[`schedule-start-${adset.id}`] = "Schedule start is required";
      }

      const locations = targeting?.locations;
      if (!locations || (Array.isArray(locations) && locations.length === 0)) {
        fieldErrors[`locations-${adset.id}`] = "At least 1 location required";
      }

      if (!isCBO && (!adset.budget_value || adset.budget_value <= 0)) {
        fieldErrors[`adset-budget-${adset.id}`] = "Budget is required (ABO)";
      }
    }
  }

  const errors = Object.values(fieldErrors);
  return { valid: errors.length === 0, fieldErrors, errors };
}

// ─── Step 3 ───

export function validateStep3(ads: LaunchAd[]): FieldValidationResult {
  const fieldErrors: Record<string, string> = {};

  for (const ad of ads) {
    const missing: string[] = [];
    if (!ad.primary_text?.trim()) { missing.push("Primary Text"); fieldErrors[`primary-text-${ad.id}`] = "Required"; }
    if (!ad.headline?.trim()) { missing.push("Headline"); fieldErrors[`headline-${ad.id}`] = "Required"; }
    if (!ad.cta) { missing.push("CTA"); fieldErrors[`cta-${ad.id}`] = "Required"; }
    if (!ad.destination_url?.trim()) { missing.push("Destination URL"); fieldErrors[`destination-url-${ad.id}`] = "Required"; }
    if (!ad.media_urls?.length) { missing.push("Media"); fieldErrors[`media-${ad.id}`] = "At least 1 media file required"; }

    if (missing.length > 0) {
      fieldErrors[`ad-summary-${ad.id}`] = `Missing: ${missing.join(", ")}`;
    }
  }

  const errors = Object.values(fieldErrors).filter((v) => !v.startsWith("Required") && v !== "At least 1 media file required");
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors, errors };
}

// ─── Step 4 (aggregate) ───

export function validateStep4(launchData: LaunchFull): ValidationResult {
  const errors: string[] = [];

  const s1 = validateStep1({
    name: launchData.name,
    selectedAccounts: launchData.ad_accounts.map((a) => a.fb_ad_account_id),
    strategy: {
      campaigns: launchData.campaigns.length,
      adsets: launchData.adsets.length,
      ads: launchData.ads.length,
    },
    setupConfigs: Object.fromEntries(
      launchData.ad_accounts.map((a) => [a.fb_ad_account_id, (a.setup_config || {}) as Record<string, unknown>])
    ),
  });

  const s2 = validateStep2(launchData.campaigns, launchData.adsets);
  const s3 = validateStep3(launchData.ads);

  errors.push(...s1.errors, ...s2.errors);
  // For step 3, use summary errors
  for (const ad of launchData.ads) {
    const key = `ad-summary-${ad.id}`;
    if (s3.fieldErrors[key]) errors.push(`${ad.name}: ${s3.fieldErrors[key]}`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Scroll to first invalid field ───

export function scrollToFirstError(fieldErrors: Record<string, string>) {
  const firstKey = Object.keys(fieldErrors)[0];
  if (!firstKey) return;
  
  // Try to find element by data-field attribute first, then by id
  const el = document.querySelector(`[data-field="${firstKey}"]`) || document.getElementById(firstKey);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Try to focus the input within
    const input = el.querySelector("input, textarea, select, button") as HTMLElement;
    if (input) setTimeout(() => input.focus(), 300);
    else if ((el as HTMLElement).focus) setTimeout(() => (el as HTMLElement).focus(), 300);
  }
}
