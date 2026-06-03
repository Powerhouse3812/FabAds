import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdAccountMultiSelect } from "./AdAccountMultiSelect";
import { AccountSetupCard } from "./AccountSetupCard";
import { AccountBulkToolbar } from "./AccountBulkToolbar";
import { FieldError } from "./FieldError";
import { useCreateLaunch } from "@/hooks/use-launch";
import { useUpdateLaunch, useUpdateLaunchStep } from "@/hooks/use-launch-mutations";
import { useFolderAds } from "@/hooks/use-folder-ads";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { useWorkspace } from "@/hooks/use-workspace";
import { useOffers } from "@/hooks/use-offers";
import { useAccountHealthConfigs, useLatestHealthSnapshots, getHealthBadge, getCapacityHint } from "@/hooks/use-account-health";
import { toast } from "@/hooks/use-toast";
import { validateStep1, scrollToFirstError } from "@/lib/launch-validation";
import { Loader2 } from "lucide-react";
import type { LaunchFull } from "@/hooks/use-launch-data";
import type { AccountSetupConfig, AccountStrategy } from "./AccountSetupCard";
import { RadioGroup } from "@/components/ui/radio-group";
import { DistributionSummary } from "./distribution/DistributionSummary";
import { DistributionAllocation } from "./distribution/DistributionAllocation";
import { StrategyCard } from "./distribution/StrategyCard";
import { getMockCapacities } from "./distribution/mock-page-capacity";
import { getMockPagesForAccount } from "./distribution/mock-pages";
import {
  splitByStatus,
  validateStrategy,
  budgetByCurrency,
  distribute,
  computeOutputCount,
} from "@/lib/launch-distribution";
import type {
  LaunchStrategy,
  TargetPair,
  DistAd,
  DistAdset,
} from "@/lib/launch-distribution";

const STRATEGIES: LaunchStrategy[] = ["fill_first", "equal", "duplicate"];

/**
 * Persisted into the existing launch_config JSON (no new DB columns).
 * `target_pairs` is the single source of truth for every (account -> page)
 * destination across all accounts.
 */
interface DistributionConfig {
  version: 1;
  strategy: LaunchStrategy;
  target_pairs: TargetPair[];
  overflowAsPaused?: boolean;
  backendSupportsOverflow?: boolean;
}
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StepAccountSetupProps {
  launchId?: string;
  launchData?: LaunchFull;
  onCreated: (id: string) => void;
  onNext: () => void;
  folderId?: string | null;
  campaignUrlId?: string | null;
}

export function StepAccountSetup({ launchId, launchData, onCreated, onNext, folderId, campaignUrlId }: StepAccountSetupProps) {
  const { adAccounts, businessManagers, dataLoading } = useFbConnection();
  const workspaceId = useWorkspace();
  const { data: campaignUrls } = useOffers(workspaceId);
  const { data: healthConfigs } = useAccountHealthConfigs(workspaceId);
  const { data: healthSnapshots } = useLatestHealthSnapshots(workspaceId);
  const createLaunch = useCreateLaunch();
  const updateLaunch = useUpdateLaunch();
  const updateStep = useUpdateLaunchStep();
  const { data: folderAds } = useFolderAds(folderId || null);
  const folderAdCount = folderAds?.length || 0;

  const [selectedCampaignUrlId, setSelectedCampaignUrlId] = useState<string>(campaignUrlId || "");

  const [name, setName] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<Record<string, AccountStrategy>>({});
  const [setupConfigs, setSetupConfigs] = useState<Record<string, AccountSetupConfig>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [checkedAccounts, setCheckedAccounts] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  // ── Distribution (persisted in launch_config.distribution v1) ────────────────
  const [strategy, setStrategy] = useState<LaunchStrategy>("fill_first");
  const [targetPairs, setTargetPairs] = useState<TargetPair[]>([]);

  // Pre-fill from launchData when editing
  useEffect(() => {
    if (launchData && launchId) {
      setName(launchData.name);
      const accIds = launchData.ad_accounts.map((a) => a.fb_ad_account_id);
      setSelectedAccounts(accIds);
      setSetupConfigs(
        Object.fromEntries(
          launchData.ad_accounts.map((a) => [a.fb_ad_account_id, (a.setup_config || {}) as AccountSetupConfig])
        )
      );

      // Derive per-account strategy from hierarchy (global for now)
      const campCount = launchData.campaigns.length || 1;
      const adsetCount = launchData.adsets.length ? Math.round(launchData.adsets.length / campCount) : 1;
      const adCount = launchData.ads.length && launchData.adsets.length
        ? Math.round(launchData.ads.length / launchData.adsets.length)
        : 1;
      const strat: AccountStrategy = { campaigns: campCount, adsets: Math.max(1, adsetCount), ads: Math.max(1, adCount) };
      setStrategies(Object.fromEntries(accIds.map((id) => [id, strat])));

      // Restore expand state from launch_config
      const savedExpand = (launchData.launch_config as any)?.expandState;
      if (savedExpand) {
        setExpandedAccounts(savedExpand);
      } else {
        // Default: first account expanded
        setExpandedAccounts(Object.fromEntries(accIds.map((id, i) => [id, i === 0])));
      }
    }
  }, [launchData?.id]);

  // Hydrate distribution (strategy + target_pairs) on edit-load. Depends on
  // adAccounts too, because the legacy single-page mapping needs account names
  // and the mock page directory to resolve a real fb_page_id.
  useEffect(() => {
    if (!launchData || !launchId || adAccounts.length === 0) return;
    const dist = (launchData.launch_config as any)?.distribution as DistributionConfig | undefined;

    if (dist?.target_pairs || dist?.strategy) {
      if (dist.strategy) setStrategy(dist.strategy);
      setTargetPairs(Array.isArray(dist.target_pairs) ? dist.target_pairs : []);
      return;
    }

    // Legacy hydration: no distribution block yet. For each account, if the old
    // single `setup_config.page` exists, convert it to ONE TargetPair using the
    // account's mock page directory. If neither, the account contributes none.
    const hydrated: TargetPair[] = [];
    for (const acc of launchData.ad_accounts) {
      const accId = acc.fb_ad_account_id;
      const fbAcc = adAccounts.find((a) => a.id === accId);
      if (!fbAcc) continue;
      const legacyPage = (acc.setup_config as any)?.page as string | undefined;
      if (!legacyPage) continue;
      const pages = getMockPagesForAccount(accId, fbAcc.name);
      // Old values were "page-1"/"page-2" (index-based) — map onto the directory.
      const idx = legacyPage === "page-2" ? 1 : 0;
      const page = pages[idx] ?? pages[0];
      if (page) {
        hydrated.push({
          ad_account_id: accId,
          account_name: fbAcc.name,
          page_id: page.page_id,
          fb_page_id: page.fb_page_id,
          page_name: page.page_name,
        });
      }
    }
    setTargetPairs(hydrated);
  }, [launchData?.id, adAccounts.length]);

  // Drop target_pairs for accounts that are no longer selected.
  useEffect(() => {
    setTargetPairs((prev) => {
      const allowed = new Set(selectedAccounts);
      const next = prev.filter((p) => allowed.has(p.ad_account_id));
      return next.length === prev.length ? prev : next;
    });
  }, [selectedAccounts]);

  // Auto-expand newly added accounts
  useEffect(() => {
    setExpandedAccounts((prev) => {
      const next = { ...prev };
      selectedAccounts.forEach((id) => {
        if (next[id] === undefined) next[id] = true;
      });
      return next;
    });
    // Init strategy for new accounts
    setStrategies((prev) => {
      const next = { ...prev };
      selectedAccounts.forEach((id) => {
        if (!next[id]) next[id] = { campaigns: 1, adsets: 1, ads: folderAdCount || 1 };
      });
      return next;
    });
  }, [selectedAccounts, folderAdCount]);

  // When folder ads load, update ads count in all strategies
  useEffect(() => {
    if (folderId && folderAdCount > 0) {
      setStrategies((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = { ...next[id], ads: folderAdCount };
        });
        return next;
      });
    }
  }, [folderAdCount, folderId]);

  const isEditing = !!launchId && !!launchData;
  const isSaving = createLaunch.isPending || updateLaunch.isPending || updateStep.isPending;
  const selectedCount = checkedAccounts.size;

  // Get the "global" strategy (use first account's strategy for hierarchy generation)
  const getGlobalStrategy = (): AccountStrategy => {
    if (selectedAccounts.length === 0) return { campaigns: 1, adsets: 1, ads: 1 };
    return strategies[selectedAccounts[0]] || { campaigns: 1, adsets: 1, ads: 1 };
  };

  const strategyChanged = () => {
    if (!launchData) return false;
    const campCount = launchData.campaigns.length;
    const adsetPerCamp = launchData.adsets.length ? Math.round(launchData.adsets.length / campCount) : 1;
    const adPerAdset = launchData.ads.length && launchData.adsets.length
      ? Math.round(launchData.ads.length / launchData.adsets.length)
      : 1;
    const s = getGlobalStrategy();
    return s.campaigns !== campCount || s.adsets !== adsetPerCamp || s.ads !== adPerAdset;
  };

  const handleSave = async (forceRegen = false) => {
    // Hierarchy structure (campaigns:adsets:ads) — distinct from the distribution
    // `strategy` (LaunchStrategy) state used by the strategy cards.
    const hierarchyStrategy = getGlobalStrategy();
    const validation = validateStep1({ name, selectedAccounts, strategy: hierarchyStrategy, setupConfigs: setupConfigs as Record<string, Record<string, unknown>> });
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      scrollToFirstError(validation.fieldErrors);
      return;
    }
    setFieldErrors({});

    if (isEditing && strategyChanged() && !forceRegen) {
      setShowRegenConfirm(true);
      return;
    }

    setPendingSave(true);
    try {
      // Persist expand state + distribution (v1) in launch_config.
      const distribution: DistributionConfig = {
        version: 1,
        strategy,
        target_pairs: targetPairs,
        overflowAsPaused: (launchData?.launch_config as any)?.distribution?.overflowAsPaused ?? false,
        backendSupportsOverflow: (launchData?.launch_config as any)?.distribution?.backendSupportsOverflow ?? false,
      };
      const launchConfig = {
        ...(launchData?.launch_config || {}),
        expandState: expandedAccounts,
        distribution,
      };

      if (isEditing) {
        await updateLaunch.mutateAsync({
          launchId: launchId!,
          name: name.trim(),
          adAccountIds: selectedAccounts,
          setupConfigs: setupConfigs as Record<string, Record<string, unknown>>,
        });

        // Also persist launch_config with expand state
        const { supabase } = await import("@/integrations/supabase/client");
        await (supabase as any).from("launches").update({ launch_config: launchConfig }).eq("id", launchId);

        if (forceRegen && strategyChanged()) {
          const existingAdsetIds = launchData!.adsets.map((a) => a.id);
          if (existingAdsetIds.length) {
            await (supabase as any).from("launch_ads").delete().in("adset_id", existingAdsetIds);
          }
          await (supabase as any).from("launch_adsets").delete().eq("launch_id", launchId);
          await (supabase as any).from("launch_campaigns").delete().eq("launch_id", launchId);

          const workspaceId = launchData!.workspace_id;
          for (let c = 0; c < hierarchyStrategy.campaigns; c++) {
            const { data: camp } = await (supabase as any)
              .from("launch_campaigns")
              .insert({ launch_id: launchId, workspace_id: workspaceId, name: `Campaign ${c + 1}`, sort_order: c })
              .select().single();
            for (let a = 0; a < hierarchyStrategy.adsets; a++) {
              const { data: adset } = await (supabase as any)
                .from("launch_adsets")
                .insert({ launch_id: launchId, campaign_id: camp.id, workspace_id: workspaceId, name: `Adset ${a + 1}`, sort_order: a })
                .select().single();
              const adRows = Array.from({ length: hierarchyStrategy.ads }, (_, i) => ({
                launch_id: launchId, adset_id: adset.id, workspace_id: workspaceId, name: `Ad ${i + 1}`, sort_order: i,
              }));
              await (supabase as any).from("launch_ads").insert(adRows);
            }
          }
        }

        await updateStep.mutateAsync({ launchId: launchId!, step: 1 });
        toast({ title: "Step 1 saved" });
        onNext();
      } else {
        const launch = await createLaunch.mutateAsync({
          name: name.trim(),
          adAccountIds: selectedAccounts,
          setupConfigs: setupConfigs as Record<string, Record<string, unknown>>,
          strategy: hierarchyStrategy,
          folderAds: folderAds && folderAds.length > 0 ? folderAds : undefined,
        });

        // Persist expand state + distribution (v1).
        const { supabase } = await import("@/integrations/supabase/client");
        await (supabase as any).from("launches").update({
          launch_config: { expandState: expandedAccounts, distribution },
        }).eq("id", launch.id);

        await updateStep.mutateAsync({ launchId: launch.id, step: 1 });
        toast({ title: "Draft saved" });
        onCreated(launch.id);
      }
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setPendingSave(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheck = (id: string) => {
    setCheckedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeAccount = (id: string) => {
    setSelectedAccounts((prev) => prev.filter((a) => a !== id));
    setCheckedAccounts((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkEdit = (_field: string) => {
    toast({ title: `Bulk edit "${_field}" — coming soon` });
  };

  const handleBulkDelete = () => {
    const remaining = selectedAccounts.filter((id) => !checkedAccounts.has(id));
    setSelectedAccounts(remaining);
    setCheckedAccounts(new Set());
  };

  const bmMap = Object.fromEntries(businessManagers.map((bm) => [bm.id, bm.name]));

  // ── Derived distribution values ──────────────────────────────────────────────
  // Step 1 runs BEFORE the Step-3 ads table, so the count is an ESTIMATE — but a
  // LIVE one. The authoritative source pre-Step-3 is the hierarchy the user is
  // editing right here (campaigns x adsets x ads); when EDITING an existing launch
  // we use its real ads instead. Driving the summary/allocation/budget from this
  // live state (not the empty launchData.ads of a brand-new launch) is what makes
  // everything react in real time as accounts, pages, structure, and strategy change.
  const hierarchy = getGlobalStrategy();
  const structureAdCount = Math.max(
    0,
    hierarchy.campaigns * hierarchy.adsets * hierarchy.ads,
  );
  const realAds = launchData?.ads ?? [];
  const estimatedAds: DistAd[] = realAds.length
    ? realAds.map((a) => ({ id: a.id, status: a.status, adset_id: a.adset_id }))
    : Array.from({ length: structureAdCount }, (_, i) => ({
        id: `est-${i}`,
        status: "active",
        adset_id: `est-adset-${i % Math.max(1, hierarchy.adsets)}`,
      }));
  // pending = these are estimates (no real ads yet); flips false when editing a
  // launch that already has ads. Drives the "Estimated" badge + note.
  const pending = realAds.length === 0;

  // Currency comes from the owning ad account (adsets don't carry it); use the
  // first selected account's currency as the launch-level currency.
  const currencyByAccount = new Map(adAccounts.map((a) => [a.id, a.currency || "USD"]));
  const fallbackCurrency =
    (selectedAccounts.length > 0 ? currencyByAccount.get(selectedAccounts[0]) : undefined) || "USD";
  const estimatedAdsets: DistAdset[] = (launchData?.adsets ?? []).map((a) => ({
    id: a.id,
    budget_value: a.budget_value,
    currency: fallbackCurrency,
  }));

  const estimatedSplit = splitByStatus(estimatedAds);
  const capacities = getMockCapacities(targetPairs);
  const pairCount = targetPairs.length;
  // Live per-(account -> page) allocation for the SELECTED strategy, plus the
  // resulting output count. Empty when no pages are chosen yet.
  const allocation = pairCount > 0 ? distribute(strategy, estimatedSplit, targetPairs, capacities) : [];
  const outputCount = computeOutputCount(strategy, estimatedAds.length, pairCount);
  const distributionBudgets = budgetByCurrency(estimatedAds, estimatedAdsets, strategy, pairCount);

  return (
    <div className="space-y-6">
      {/* Campaign URL (optional) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Campaign URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Select value={selectedCampaignUrlId || "__none__"} onValueChange={(v) => setSelectedCampaignUrlId(v === "__none__" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a Campaign URL..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {(campaignUrls || []).map((cu) => (
              <SelectItem key={cu.id} value={cu.id}>{cu.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Associate this launch with a Campaign URL to auto-filter templates in the next step.</p>
      </div>

      {/* Launch Name */}
      <div className="space-y-1.5" data-field="launch-name" id="launch-name">
        <Label className="text-sm font-medium">Launch name</Label>
        <Input
          placeholder="Add to launch name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldErrors["launch-name"] ? "border-destructive" : ""}
        />
        <FieldError error={fieldErrors["launch-name"]} />
      </div>

      {/* Ad Accounts */}
      <div className="space-y-1.5" data-field="ad-accounts" id="ad-accounts">
        <Label className="text-sm font-medium">Ad accounts</Label>
        <AdAccountMultiSelect
          adAccounts={adAccounts}
          businessManagers={businessManagers}
          selectedIds={selectedAccounts}
          onChange={setSelectedAccounts}
        />
        <FieldError error={fieldErrors["ad-accounts"]} />
      </div>

      {/* Tracking & Setup section */}
      {selectedAccounts.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Tracking & Setup</Label>

          {/* Bulk toolbar */}
          {selectedCount > 0 && (
            <AccountBulkToolbar
              selectedCount={selectedCount}
              onBulkEdit={handleBulkEdit}
              onBulkDelete={handleBulkDelete}
              onClose={() => setCheckedAccounts(new Set())}
            />
          )}

          {/* Account cards */}
          {selectedAccounts.map((accId) => {
            const acc = adAccounts.find((a) => a.id === accId);
            if (!acc) return null;
            const snapshot = (healthSnapshots || []).find((s) => s.fb_ad_account_id === accId);
            const config = (healthConfigs || []).find((c) => c.fb_ad_account_id === accId);
            const badge = getHealthBadge(snapshot);
            const hint = getCapacityHint(snapshot, config);
            return (
              <AccountSetupCard
                key={accId}
                accountId={accId}
                accountName={acc.name}
                bmName={acc.fb_business_manager_id ? bmMap[acc.fb_business_manager_id] : undefined}
                config={(setupConfigs[accId] || {}) as AccountSetupConfig}
                strategy={strategies[accId] || { campaigns: 1, adsets: 1, ads: folderAdCount || 1 }}
                isExpanded={!!expandedAccounts[accId]}
                isChecked={checkedAccounts.has(accId)}
                onToggleExpand={() => toggleExpand(accId)}
                onToggleCheck={() => toggleCheck(accId)}
                onConfigChange={(c) => setSetupConfigs((prev) => ({ ...prev, [accId]: c }))}
                onStrategyChange={(strat) => setStrategies((prev) => ({ ...prev, [accId]: strat }))}
                onRemove={() => removeAccount(accId)}
                fieldErrors={fieldErrors}
                adsLocked={!!folderId && folderAdCount > 0}
                healthState={badge.label.toLowerCase() as "safe" | "risk" | "unknown"}
                capacityHint={hint}
                targetPairs={targetPairs}
                onTargetPairsChange={setTargetPairs}
              />
            );
          })}
        </div>
      )}

      {/* Distribution: summary + strategy selection */}
      {selectedAccounts.length > 0 && (
        <div className="space-y-3" data-field="distribution" id="distribution">
          <Label className="text-base font-semibold">Distribution</Label>

          <DistributionSummary
            statusSplit={estimatedSplit}
            targetPairs={targetPairs}
            capacities={capacities}
            selectedAds={estimatedAds}
            adsets={estimatedAdsets}
            strategy={strategy}
            outputCount={outputCount}
            pending={pending}
          />

          <RadioGroup
            value={strategy}
            onValueChange={(v) => setStrategy(v as LaunchStrategy)}
            className="grid gap-3 md:grid-cols-3"
          >
            {STRATEGIES.map((s) => {
              // Validate against the LIVE estimate so availability + the disabled
              // reason reflect the real ad count (kept non-blocking / "estimated"
              // — Next still saves; the hard gate is at Preview).
              const validation = validateStrategy(s, estimatedSplit, targetPairs, capacities);
              const budget =
                s === "duplicate"
                  ? budgetByCurrency(estimatedAds, estimatedAdsets, s, targetPairs.length)
                  : [];
              return (
                <StrategyCard
                  key={s}
                  strategy={s}
                  selected={strategy === s}
                  onSelect={setStrategy}
                  validation={validation}
                  budget={budget}
                  pending={pending}
                />
              );
            })}
          </RadioGroup>

          {/* Live per-destination allocation for the selected strategy — answers
              "kis page pe kitni ads" + how budget multiplies, reacting to every
              account / page / structure / strategy change. */}
          <DistributionAllocation
            strategy={strategy}
            allocation={allocation}
            budgets={distributionBudgets}
            outputCount={outputCount}
            pairCount={pairCount}
            pending={pending}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button onClick={() => handleSave()} disabled={isSaving || pendingSave}>
          {(isSaving || pendingSave) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isSaving || pendingSave ? "Saving..." : "Next"}
        </Button>
      </div>

      {/* Regen Confirmation */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Hierarchy?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the strategy will regenerate all campaigns, adsets, and ads. Existing configurations will be lost. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowRegenConfirm(false); handleSave(true); }}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
