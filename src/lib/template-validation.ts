import type { CampaignFormData, AdsetFormData, AdsFormData } from "./step2-defaults";
import { scrollToFirstError } from "./launch-validation";

export function validateTargetingFields(data: {
  campaign: CampaignFormData;
  adset: AdsetFormData;
  ads: AdsFormData;
}): { valid: boolean; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  // Campaign
  if (!data.campaign.objective) {
    fieldErrors["objective"] = "Objective is required";
  }

  const isCBO = (data.campaign.budget_type || "CBO") === "CBO";
  if (isCBO && (!data.campaign.budget_value || data.campaign.budget_value <= 0)) {
    fieldErrors["budget"] = "Budget is required (CBO)";
  }

  // Adset
  const targeting = data.adset.targeting;
  if (!targeting.locations || targeting.locations.length === 0) {
    fieldErrors["locations"] = "At least 1 location required";
  }

  if (targeting.scheduling_enabled && !data.adset.schedule_start) {
    fieldErrors["schedule-start"] = "Schedule start is required";
  }

  if (!isCBO && (!data.adset.budget_value || data.adset.budget_value <= 0)) {
    fieldErrors["adset-budget"] = "Budget is required (ABO)";
  }

  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export { scrollToFirstError };
