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
    const strategy = getGlobalStrategy();
    const validation = validateStep1({ name, selectedAccounts, strategy, setupConfigs: setupConfigs as Record<string, Record<string, unknown>> });
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
      // Persist expand state in launch_config
      const launchConfig = {
        ...(launchData?.launch_config || {}),
        expandState: expandedAccounts,
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
          for (let c = 0; c < strategy.campaigns; c++) {
            const { data: camp } = await (supabase as any)
              .from("launch_campaigns")
              .insert({ launch_id: launchId, workspace_id: workspaceId, name: `Campaign ${c + 1}`, sort_order: c })
              .select().single();
            for (let a = 0; a < strategy.adsets; a++) {
              const { data: adset } = await (supabase as any)
                .from("launch_adsets")
                .insert({ launch_id: launchId, campaign_id: camp.id, workspace_id: workspaceId, name: `Adset ${a + 1}`, sort_order: a })
                .select().single();
              const adRows = Array.from({ length: strategy.ads }, (_, i) => ({
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
          strategy,
          folderAds: folderAds && folderAds.length > 0 ? folderAds : undefined,
        });

        // Persist expand state
        const { supabase } = await import("@/integrations/supabase/client");
        await (supabase as any).from("launches").update({
          launch_config: { expandState: expandedAccounts },
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
              />
            );
          })}
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
