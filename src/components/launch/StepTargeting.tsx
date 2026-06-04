import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampaignCard } from "./CampaignCard";
import { AdsetCard } from "./AdsetCard";
import { MissingFieldsSummary, type MissingFieldItem } from "./MissingFieldsSummary";
import { TemplateSelectModal } from "./TemplateSelectModal";
import { useSaveTargeting, useUpdateLaunchStep } from "@/hooks/use-launch-mutations";
import { useCreateTargetingTemplate } from "@/hooks/use-targeting-templates";
import { useCampaignUrlTargetingLinks, useAddCampaignUrlTargetingLink } from "@/hooks/use-campaign-url-targeting";
import { useOffers } from "@/hooks/use-offers";
import { toast } from "@/hooks/use-toast";
import { validateStep2, scrollToFirstError } from "@/lib/launch-validation";
import { STEP2_DEFAULTS } from "@/lib/step2-defaults";
import type { LaunchFull } from "@/hooks/use-launch-data";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StepTargetingProps {
  launchData: LaunchFull;
  onNext: () => void;
  onBack: () => void;
  campaignUrlId?: string | null;
  templateId?: string | null;
}

function applyPayloadToCampaigns(campaigns: any[], payload: Record<string, any>) {
  const cp = payload.campaign || {};
  return campaigns.map((c) => ({
    ...c,
    objective: cp.objective ?? c.objective,
    budget_type: cp.budget_type ?? c.budget_type,
    budget_period: cp.budget_period ?? c.budget_period,
    budget_value: cp.budget_value ?? c.budget_value,
    bid_strategy: cp.bid_strategy ?? c.bid_strategy,
    delivery_type: cp.delivery_type ?? c.delivery_type,
    special_ad_category: cp.special_ad_category ?? c.special_ad_category,
  }));
}

function applyPayloadToAdsets(adsets: any[], payload: Record<string, any>) {
  const ap = payload.adset || {};
  return adsets.map((a) => ({
    ...a,
    targeting: ap.targeting ?? a.targeting,
    placements: ap.placements ?? a.placements,
    performance_goal: ap.performance_goal ?? a.performance_goal,
    budget_value: ap.budget_value ?? a.budget_value,
    budget_period: ap.budget_period ?? a.budget_period,
    bid_strategy: ap.bid_strategy ?? a.bid_strategy,
    bid_amount: ap.bid_amount ?? a.bid_amount,
    delivery_type: ap.delivery_type ?? a.delivery_type,
    schedule_start: ap.schedule_start ?? a.schedule_start,
    schedule_end: ap.schedule_end ?? a.schedule_end,
  }));
}

export function StepTargeting({ launchData, onNext, onBack, campaignUrlId, templateId }: StepTargetingProps) {
  const saveTargeting = useSaveTargeting();
  const updateStep = useUpdateLaunchStep();
  const createTemplate = useCreateTargetingTemplate();
  const addTargetingLink = useAddCampaignUrlTargetingLink();
  const { data: campaignUrls } = useOffers(launchData.workspace_id);
  const { data: targetingLinks } = useCampaignUrlTargetingLinks(campaignUrlId || null);

  const campaignUrlName = campaignUrlId ? (campaignUrls || []).find((c) => c.id === campaignUrlId)?.name : null;

  const launchConfig = (launchData.launch_config || {}) as Record<string, any>;
  const isInitialized = !!launchConfig.step2_initialized;

  const [showModal, setShowModal] = useState(!isInitialized);
  const [campaigns, setCampaigns] = useState(launchData.campaigns);
  const [adsets, setAdsets] = useState(launchData.adsets);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    (launchData as any).targeting_template_id || null
  );
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const isSaving = saveTargeting.isPending || updateStep.isPending;

  // ── Friendly labels for the missing-fields summary ──────────────────────────
  // Resolve campaign/adset display indices (1-based, matching how cards nest) so
  // a fieldErrors key like `objective-<campId>` reads as "Campaign 1 — Objective".
  const campIndexById = new Map(campaigns.map((c, i) => [c.id, i + 1]));
  const campBudgetTypeById = new Map(campaigns.map((c) => [c.id, c.budget_type]));
  // Adset index is per-campaign (2nd adset of its campaign → "Adset 2").
  const adsetMetaById = new Map<string, { campId: string; index: number }>();
  for (const camp of campaigns) {
    adsets
      .filter((a) => a.campaign_id === camp.id)
      .forEach((a, i) => adsetMetaById.set(a.id, { campId: camp.id, index: i + 1 }));
  }

  const campLabel = (campId: string) => `Campaign ${campIndexById.get(campId) ?? "?"}`;
  const adsetLabel = (adsetId: string) => {
    const meta = adsetMetaById.get(adsetId);
    return meta ? `Adset ${meta.index}` : "Adset";
  };

  // Build the "what's missing" rows from the live fieldErrors. Keys stay identical
  // to fieldErrors so the summary's scroll anchors line up with the field anchors.
  const missingFields: MissingFieldItem[] = Object.keys(fieldErrors).map((key) => {
    if (key.startsWith("objective-")) {
      return { key, label: `${campLabel(key.slice("objective-".length))} — Objective` };
    }
    if (key.startsWith("budget-")) {
      return { key, label: `${campLabel(key.slice("budget-".length))} — Budget (CBO)` };
    }
    if (key.startsWith("adset-budget-")) {
      const adsetId = key.slice("adset-budget-".length);
      const campId = adsetMetaById.get(adsetId)?.campId;
      const isABO = campId ? campBudgetTypeById.get(campId) !== "CBO" && campBudgetTypeById.get(campId) !== "cbo" : true;
      return { key, label: `${adsetLabel(adsetId)} — Budget (${isABO ? "ABO" : "CBO"})` };
    }
    if (key.startsWith("locations-")) {
      return { key, label: `${adsetLabel(key.slice("locations-".length))} — Location` };
    }
    if (key.startsWith("schedule-start-")) {
      return { key, label: `${adsetLabel(key.slice("schedule-start-".length))} — Schedule start` };
    }
    return { key, label: fieldErrors[key] };
  });

  // If returning to a step2-initialized launch, ensure we have the data from DB
  useEffect(() => {
    setCampaigns(launchData.campaigns);
    setAdsets(launchData.adsets);
  }, [launchData.id]);

  const handleTemplateSelect = (payload: Record<string, any>, templateId?: string) => {
    setCampaigns(applyPayloadToCampaigns(launchData.campaigns, payload));
    setAdsets(applyPayloadToAdsets(launchData.adsets, payload));
    setSelectedTemplateId(templateId || null);
    setShowModal(false);
  };

  const handleSkip = () => {
    const defaults = { campaign: STEP2_DEFAULTS.campaign, adset: STEP2_DEFAULTS.adset };
    setCampaigns(applyPayloadToCampaigns(launchData.campaigns, defaults));
    setAdsets(applyPayloadToAdsets(launchData.adsets, defaults));
    setSelectedTemplateId(null);
    setShowModal(false);
  };

  const updateCampaign = (id: string, fields: Record<string, any>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
  };

  const updateAdset = (id: string, fields: Record<string, any>) => {
    setAdsets((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  };

  const handleSaveAndContinue = async () => {
    const validation = validateStep2(campaigns, adsets);
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      scrollToFirstError(validation.fieldErrors);
      const count = Object.keys(validation.fieldErrors).length;
      toast({
        title: `${count} targeting field${count === 1 ? "" : "s"} missing`,
        description: "Fix the highlighted fields to continue.",
        variant: "destructive",
      });
      return;
    }
    setFieldErrors({});

    try {
      // 1. Bulk save campaigns + adsets
      await saveTargeting.mutateAsync({ launchId: launchData.id, campaigns, adsets });

      // 2. Update launch: step2_initialized + targeting_template_id
      await (supabase as any)
        .from("launches")
        .update({
          targeting_template_id: selectedTemplateId,
          launch_config: { ...launchConfig, step2_initialized: true },
        })
        .eq("id", launchData.id);

      // 3. Update completed_step
      await updateStep.mutateAsync({ launchId: launchData.id, step: 2 });

      // 4. Optionally save as template
      if (saveAsTemplate && templateName.trim()) {
        const payload = {
          campaign: {
            objective: campaigns[0]?.objective,
            budget_type: campaigns[0]?.budget_type,
            budget_period: campaigns[0]?.budget_period,
            budget_value: campaigns[0]?.budget_value,
            bid_strategy: campaigns[0]?.bid_strategy,
            delivery_type: campaigns[0]?.delivery_type,
            special_ad_category: campaigns[0]?.special_ad_category,
          },
          adset: {
            targeting: adsets[0]?.targeting,
            placements: adsets[0]?.placements,
            performance_goal: adsets[0]?.performance_goal,
            budget_value: adsets[0]?.budget_value,
            budget_period: adsets[0]?.budget_period,
            bid_strategy: adsets[0]?.bid_strategy,
            bid_amount: adsets[0]?.bid_amount,
            delivery_type: adsets[0]?.delivery_type,
            schedule_start: adsets[0]?.schedule_start,
            schedule_end: adsets[0]?.schedule_end,
          },
        };
        await createTemplate.mutateAsync({ name: templateName.trim(), payload });
      }

      toast({ title: "Targeting saved" });
      onNext();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Template modal */}
      <TemplateSelectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleTemplateSelect}
        onSkip={handleSkip}
        campaignUrlId={campaignUrlId}
        targetingLinks={targetingLinks}
        campaignUrlName={campaignUrlName}
        onLinkTemplate={async (tplId) => {
          if (!campaignUrlId) return;
          try {
            await addTargetingLink.mutateAsync({ campaign_url_id: campaignUrlId, targeting_template_id: tplId, workspace_id: launchData.workspace_id });
            toast({ title: "Template linked to Campaign URL" });
          } catch {}
        }}
      />

      {/* Header with Change Template */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Targeting</h2>
          <p className="text-sm text-muted-foreground">
            Manage campaign objectives, budget strategy, and audience targeting.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Change template
        </Button>
      </div>

      {/* Missing-fields summary — precise "what's missing" panel. Each row scrolls
          to its campaign/adset field via the shared anchors. */}
      {missingFields.length > 0 && <MissingFieldsSummary items={missingFields} />}

      {/* Campaign + Adset forms */}
      {campaigns.map((camp) => (
        // Per-campaign scroll anchors. CampaignCard's internal objective/budget
        // anchors are static (not camp-scoped), so wrap the card to give the
        // `objective-<id>` / `budget-<id>` summary rows a target to scroll to.
        <div
          key={camp.id}
          className="space-y-3"
          data-field={`objective-${camp.id}`}
          id={`objective-${camp.id}`}
        >
          <span data-field={`budget-${camp.id}`} id={`budget-${camp.id}`} className="sr-only" />
          <CampaignCard
            campaign={camp}
            onChange={(fields) => updateCampaign(camp.id, fields)}
            fieldErrors={fieldErrors}
          />
          <div className="ml-6 space-y-3">
            {adsets
              .filter((a) => a.campaign_id === camp.id)
              .map((adset) => (
                <AdsetCard
                  key={adset.id}
                  adset={adset}
                  budgetType={camp.budget_type}
                  onChange={(fields) => updateAdset(adset.id, fields)}
                  fieldErrors={fieldErrors}
                />
              ))}
          </div>
        </div>
      ))}

      {/* Save as template */}
      <div className="flex items-center gap-3 pt-2">
        <Checkbox
          id="save-template"
          checked={saveAsTemplate}
          onCheckedChange={(v) => setSaveAsTemplate(!!v)}
        />
        <Label htmlFor="save-template" className="text-sm">Save this targeting as template</Label>
        {saveAsTemplate && (
          <Input
            placeholder="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="max-w-xs"
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link to="/launch" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to History
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />Previous
          </Button>
          <Button onClick={handleSaveAndContinue} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
