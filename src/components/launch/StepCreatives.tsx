import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LaunchPreviewModal } from "./LaunchPreviewModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StepCreativesToolbar } from "./StepCreativesToolbar";
import { AdAccountsTab } from "./AdAccountsTab";
import { CampaignsTableTab } from "./CampaignsTableTab";
import { AdGroupsTableTab } from "./AdGroupsTableTab";
import { AdsTableTab } from "./AdsTableTab";
import { AdBulkEditToolbar } from "./AdBulkEditToolbar";
import { AdGroupBulkToolbar } from "./AdGroupBulkToolbar";
import { LaunchStrategyBar } from "./LaunchStrategyBar";
import { LaunchDistributionPreview } from "./LaunchDistributionPreview";
import { LaunchConfirmDialog } from "./LaunchConfirmDialog";
import { useWorkspaceTexts } from "@/hooks/use-workspace-texts";
import { useBulkUpdateAds, useUpdateLaunchStep, useBulkUpdateAdsets, useDuplicateAd, useDeleteAd, useAddAd, useUpdateAdSchedules } from "@/hooks/use-launch-mutations";
import { validateStep3, scrollToFirstError } from "@/lib/launch-validation";
import { toast } from "@/hooks/use-toast";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { getAccountTimezone, DEFAULT_TIMEZONE } from "@/lib/timezones";
import { readAdSchedules, type AdScheduleEntry } from "@/lib/ad-schedule";
import { MissingFieldsSummary, type MissingFieldItem } from "./MissingFieldsSummary";
import type { LaunchFull } from "@/hooks/use-launch-data";
import { rollupSelection, type SelectionLevel } from "@/lib/launch-selection-rollup";
import { useLaunchDistribution, resolveLaunchCurrency } from "@/hooks/use-launch-distribution";
import { toDistAdsets } from "./distribution/distribution-view-helpers";

interface StepCreativesProps {
  launchData: LaunchFull;
  onBack: () => void;
}

export function StepCreatives({ launchData, onBack }: StepCreativesProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ads");
  const [search, setSearch] = useState("");
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [selectedAdGroups, setSelectedAdGroups] = useState<Set<string>>(new Set());
  // Lifted out of CampaignsTableTab / AdAccountsTab so the distribution bar can
  // roll selections up (and constrain account-level) across all tabs.
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [showLaunchPreview, setShowLaunchPreview] = useState(false);
  // Per-field validation errors keyed by `<field>-<adId>` (from validateStep3),
  // surfaced inline + as the MissingFieldsSummary at the top of the step.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Distribution surfaces (Slice 2).
  const [showDistPreview, setShowDistPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [overflowAsPausedOverride, setOverflowAsPausedOverride] = useState<boolean | null>(null);

  const { data: workspaceTexts } = useWorkspaceTexts();
  const bulkUpdate = useBulkUpdateAds();
  const bulkUpdateAdsets = useBulkUpdateAdsets();
  const updateSchedules = useUpdateAdSchedules();
  const dupAd = useDuplicateAd();
  const delAd = useDeleteAd();
  const addAd = useAddAd();
  const updateStep = useUpdateLaunchStep();
  const { adAccounts } = useFbConnection();

  const accountCount = launchData.ad_accounts.length;

  // Default scheduling timezone = the launch's PRIMARY (first) ad account,
  // resolved via getAccountTimezone (real rows lack the not-yet-live tz column).
  const primaryFbAccountId = launchData.ad_accounts[0]?.fb_ad_account_id;
  const defaultTimezone = primaryFbAccountId
    ? getAccountTimezone(adAccounts.find((a) => a.id === primaryFbAccountId))
    : DEFAULT_TIMEZONE;

  // ─── Distribution config + rollup ───────────────────────────────────────────
  const dist = useLaunchDistribution(launchData);
  const currency = useMemo(() => resolveLaunchCurrency(launchData), [launchData]);
  const distAdsets = useMemo(() => toDistAdsets(launchData, currency), [launchData, currency]);
  const overflowAsPaused = overflowAsPausedOverride ?? dist.overflowAsPaused;

  const rollup = useMemo(
    () =>
      rollupSelection(
        launchData,
        { accounts: selectedAccounts, campaigns: selectedCampaigns, adgroups: selectedAdGroups, ads: selectedAds },
        activeTab as SelectionLevel
      ),
    [launchData, selectedAccounts, selectedCampaigns, selectedAdGroups, selectedAds, activeTab]
  );

  // Show the bar when there is something to distribute, OR when the user is on the
  // Accounts tab with an account-level selection (so we can surface the constraint).
  const showStrategyBar = rollup.adIds.length > 0 || (activeTab === "accounts" && rollup.accountConstrained);

  // One summary row per incomplete ad → jumps to that ad's row anchor.
  // Built from the `ad-summary-<id>` entries (value = "Missing: <fields>").
  const missingItems = useMemo<MissingFieldItem[]>(() => {
    return launchData.ads
      .filter((ad) => fieldErrors[`ad-summary-${ad.id}`])
      .map((ad) => {
        const missing = fieldErrors[`ad-summary-${ad.id}`].replace(/^Missing:\s*/, "");
        return { key: `ad-${ad.id}`, label: `${ad.name} — Missing: ${missing}` };
      });
  }, [launchData.ads, fieldErrors]);

  const goToTab = (tab: string) => setActiveTab(tab);

  const handleBulkApply = (fields: Record<string, any>) => {
    bulkUpdate.mutate({ ids: Array.from(selectedAds), launchId: launchData.id, fields });
    setSelectedAds(new Set());
  };

  // Bulk schedule: status="scheduled" on every selected ad (normal status path)
  // + the date/time/timezone into launch_config.adSchedules per ad id.
  const handleBulkSchedule = (adIds: string[], entry: AdScheduleEntry) => {
    bulkUpdate.mutate({ ids: adIds, launchId: launchData.id, fields: { status: "scheduled" } });
    updateSchedules.mutate({
      launchId: launchData.id,
      updates: Object.fromEntries(adIds.map((id) => [id, entry])),
    });
    setSelectedAds(new Set());
  };

  const handleProceed = async () => {
    // Scheduled ads also need a date/time — pass the launch_config schedule map
    // so validateStep3 flags any "scheduled" ad without a scheduled_at.
    const schedules = readAdSchedules(launchData.launch_config);
    const validation = validateStep3(launchData.ads, schedules);
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      setActiveTab("ads");
      scrollToFirstError(validation.fieldErrors);

      // Build a SPECIFIC toast naming the incomplete ad(s), not a generic prompt.
      const incomplete = launchData.ads.filter((ad) => validation.fieldErrors[`ad-summary-${ad.id}`]);
      const n = incomplete.length;
      const description = incomplete
        .slice(0, 2)
        .map((ad) => `${ad.name}: ${validation.fieldErrors[`ad-summary-${ad.id}`].replace(/^Missing:\s*/, "")}`)
        .join(" · ") + (n > 2 ? ` · +${n - 2} more` : "");
      toast({
        title: `${n} ad${n > 1 ? "s" : ""} need required fields`,
        description,
        variant: "destructive",
      });
      return;
    }

    setFieldErrors({});
    try {
      await updateStep.mutateAsync({ launchId: launchData.id, step: 3 });
      toast({ title: "Creatives validated" });
      setShowLaunchPreview(true);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation summary — names every incomplete ad; each row jumps to it. */}
      <MissingFieldsSummary items={missingItems} />

      {/* Toolbar */}
      <StepCreativesToolbar launchData={launchData} search={search} onSearchChange={setSearch} />

      {/* Distribution strategy bar (sticky) — composes ABOVE per-level toolbars. */}
      {showStrategyBar && (
        <LaunchStrategyBar
          rollup={rollup}
          strategy={dist.strategy}
          targetPairs={dist.targetPairs}
          capacities={dist.capacities}
          distAdsets={distAdsets}
          configured={dist.configured}
          onPreview={() => setShowDistPreview(true)}
          onLaunch={() => setShowDistPreview(true)}
          onChangeStrategy={onBack}
          onChangePages={onBack}
          onReduceSelection={() => goToTab("ads")}
        />
      )}

      {/* Bulk toolbars (kept intact, rendered below the strategy bar) */}
      {activeTab === "ads" && selectedAds.size > 0 && (
        <AdBulkEditToolbar
          selectedCount={selectedAds.size}
          ads={launchData.ads.filter(a => selectedAds.has(a.id))}
          defaultTimezone={defaultTimezone}
          onApply={handleBulkApply}
          onSchedule={handleBulkSchedule}
          onDuplicate={(adId) => dupAd.mutate({ adId, launchId: launchData.id })}
          onDelete={(adId) => delAd.mutate({ id: adId, launchId: launchData.id })}
          onClear={() => setSelectedAds(new Set())}
          applying={bulkUpdate.isPending}
        />
      )}
      {activeTab === "adgroups" && selectedAdGroups.size > 0 && (
        <AdGroupBulkToolbar
          selectedCount={selectedAdGroups.size}
          totalCount={launchData.adsets.length}
          onClear={() => setSelectedAdGroups(new Set())}
          onBulkUpdate={(data, applyToAll) => {
            const ids = applyToAll
              ? launchData.adsets.map(a => a.id)
              : Array.from(selectedAdGroups);
            bulkUpdateAdsets.mutate({ ids, launchId: launchData.id, fields: data });
          }}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 rounded-none h-auto">
          <TabsTrigger value="accounts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Ad accounts <span className="ml-1 text-xs text-muted-foreground">({accountCount} selected)</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Campaigns <span className="ml-1 text-xs text-muted-foreground">for {accountCount} ad accounts</span>
          </TabsTrigger>
          <TabsTrigger value="adgroups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Ad groups <span className="ml-1 text-xs text-muted-foreground">for {accountCount} ad accounts</span>
          </TabsTrigger>
          <TabsTrigger value="ads" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Ads <span className="ml-1 text-xs text-muted-foreground">for {accountCount} ad accounts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <AdAccountsTab launchData={launchData} selectedAccounts={selectedAccounts} onSelectionChange={setSelectedAccounts} />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTableTab launchData={launchData} selectedCampaigns={selectedCampaigns} onSelectionChange={setSelectedCampaigns} />
        </TabsContent>

        <TabsContent value="adgroups" className="mt-4">
          <AdGroupsTableTab launchData={launchData} selectedAdGroups={selectedAdGroups} onSelectionChange={setSelectedAdGroups} />
        </TabsContent>

        <TabsContent value="ads" className="mt-4">
          <AdsTableTab
            launchData={launchData}
            search={search}
            selectedAds={selectedAds}
            onSelectionChange={setSelectedAds}
            workspaceTexts={workspaceTexts}
            fieldErrors={fieldErrors}
          />
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={() => navigate("/launch")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />Previous
          </Button>
          <Button onClick={handleProceed} disabled={updateStep.isPending}>
            {updateStep.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {updateStep.isPending ? "Validating..." : "Proceed"}
          </Button>
        </div>
      </div>

      {/* Launch Preview Modal (existing full-launch path) */}
      <LaunchPreviewModal
        open={showLaunchPreview}
        onClose={() => setShowLaunchPreview(false)}
        launchData={launchData}
      />

      {/* Distribution Preview (Slice 2) */}
      <LaunchDistributionPreview
        open={showDistPreview}
        onClose={() => setShowDistPreview(false)}
        rollup={rollup}
        strategy={dist.strategy}
        targetPairs={dist.targetPairs}
        capacities={dist.capacities}
        backendSupportsOverflow={dist.backendSupportsOverflow}
        overflowAsPaused={overflowAsPaused}
        onOverflowAsPausedChange={setOverflowAsPausedOverride}
        onConfirm={() => {
          setShowDistPreview(false);
          setShowConfirm(true);
        }}
        onChangeStrategy={() => {
          setShowDistPreview(false);
          onBack();
        }}
        onChangePages={() => {
          setShowDistPreview(false);
          onBack();
        }}
      />

      {/* Distribution Confirm (Slice 2) */}
      <LaunchConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        launch={launchData}
        rollup={rollup}
        strategy={dist.strategy}
        targetPairs={dist.targetPairs}
        capacities={dist.capacities}
        distAdsets={distAdsets}
        overflowAsPaused={overflowAsPaused}
      />
    </div>
  );
}
