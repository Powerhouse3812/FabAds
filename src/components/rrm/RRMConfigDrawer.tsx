import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw } from "lucide-react";
import { useUpsertHealthConfig, type HealthConfig } from "@/hooks/use-account-health";
import { useUpsertRRMSetting, useResetAccountToGlobal, type RRMAccountSetting, type RRMGlobalSettings } from "@/hooks/use-rrm-settings";
import { useToast } from "@/hooks/use-toast";

interface DummyPage {
  page_id: string;
  name: string;
  live_ads: number;
}

function getDummyPages(accountId: string, accountName: string): DummyPage[] {
  const seed = accountId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return [
    { page_id: `${accountId}_page_1`, name: `${accountName} - Main Page`, live_ads: 30 + (seed % 40) },
    { page_id: `${accountId}_page_2`, name: `${accountName} - Promo Page`, live_ads: 10 + (seed % 15) },
  ];
}

interface OfferOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountName: string;
  workspaceId: string;
  config: HealthConfig | null;
  accountSetting?: RRMAccountSetting | null;
  offers?: OfferOption[];
  globalSettings?: RRMGlobalSettings | null;
}

export function RRMConfigDrawer({ open, onOpenChange, accountId, accountName, workspaceId, config, accountSetting, offers, globalSettings }: Props) {
  const [mode, setMode] = useState(config?.guardrail_mode || "off");
  const [rejThreshold, setRejThreshold] = useState(config?.rejection_threshold ?? 1.0);
  const [warnThreshold, setWarnThreshold] = useState(config?.warning_threshold ?? 0.8);

  // Per-account overrides
  const [autoLaunchOverride, setAutoLaunchOverride] = useState(accountSetting?.auto_launch_override ?? false);
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(accountSetting?.auto_launch_enabled ?? false);
  const [adNameAppend, setAdNameAppend] = useState(accountSetting?.ad_name_append ?? "");
  const [dilutionOfferId, setDilutionOfferId] = useState(accountSetting?.dilution_campaign_url_id ?? "");
  const [dilutionEnabled, setDilutionEnabled] = useState(accountSetting?.dilution_enabled ?? false);
  const [replacementOfferId, setReplacementOfferId] = useState(accountSetting?.replacement_campaign_url_id ?? "");
  const [replacementEnabled, setReplacementEnabled] = useState(accountSetting?.replacement_enabled ?? false);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>(accountSetting?.selected_page_ids ?? []);

  // New override fields
  const [prefixOverride, setPrefixOverride] = useState(accountSetting?.ad_name_prefix_override ?? "");
  const [useGlobalWarning, setUseGlobalWarning] = useState(accountSetting?.warning_threshold_override === null || accountSetting?.warning_threshold_override === undefined);
  const [warningOverride, setWarningOverride] = useState(accountSetting?.warning_threshold_override ?? globalSettings?.warning_threshold ?? 0.8);
  const [useGlobalRejection, setUseGlobalRejection] = useState(accountSetting?.rejection_threshold_override === null || accountSetting?.rejection_threshold_override === undefined);
  const [rejectionOverride, setRejectionOverride] = useState(accountSetting?.rejection_threshold_override ?? globalSettings?.rejection_threshold ?? 1.0);
  const [useGlobalRecovery, setUseGlobalRecovery] = useState(accountSetting?.recovery_threshold_override === null || accountSetting?.recovery_threshold_override === undefined);
  const [recoveryOverride, setRecoveryOverride] = useState(accountSetting?.recovery_threshold_override ?? globalSettings?.recovery_threshold ?? 0.5);
  const [useGlobalPauseRate, setUseGlobalPauseRate] = useState(accountSetting?.pause_rate_override === null || accountSetting?.pause_rate_override === undefined);
  const [pauseRateOverride, setPauseRateOverride] = useState(accountSetting?.pause_rate_override ?? globalSettings?.pause_rate ?? 10);
  const [dilutionLinksSource, setDilutionLinksSource] = useState(accountSetting?.dilution_links_source ?? "");
  const [replacementLinksSource, setReplacementLinksSource] = useState(accountSetting?.replacement_links_source ?? "");

  const upsertHealth = useUpsertHealthConfig();
  const upsertRRM = useUpsertRRMSetting();
  const resetToGlobal = useResetAccountToGlobal();
  const { toast } = useToast();

  useEffect(() => {
    setMode(config?.guardrail_mode || "off");
    setRejThreshold(config?.rejection_threshold ?? 1.0);
    setWarnThreshold(config?.warning_threshold ?? 0.8);
    setAutoLaunchOverride(accountSetting?.auto_launch_override ?? false);
    setAutoLaunchEnabled(accountSetting?.auto_launch_enabled ?? false);
    setAdNameAppend(accountSetting?.ad_name_append ?? "");
    setDilutionOfferId(accountSetting?.dilution_campaign_url_id ?? "");
    setDilutionEnabled(accountSetting?.dilution_enabled ?? false);
    setReplacementOfferId(accountSetting?.replacement_campaign_url_id ?? "");
    setReplacementEnabled(accountSetting?.replacement_enabled ?? false);
    setSelectedPageIds(accountSetting?.selected_page_ids ?? []);
    setPrefixOverride(accountSetting?.ad_name_prefix_override ?? "");
    setUseGlobalWarning(accountSetting?.warning_threshold_override == null);
    setWarningOverride(accountSetting?.warning_threshold_override ?? globalSettings?.warning_threshold ?? 0.8);
    setUseGlobalRejection(accountSetting?.rejection_threshold_override == null);
    setRejectionOverride(accountSetting?.rejection_threshold_override ?? globalSettings?.rejection_threshold ?? 1.0);
    setUseGlobalRecovery(accountSetting?.recovery_threshold_override == null);
    setRecoveryOverride(accountSetting?.recovery_threshold_override ?? globalSettings?.recovery_threshold ?? 0.5);
    setUseGlobalPauseRate(accountSetting?.pause_rate_override == null);
    setPauseRateOverride(accountSetting?.pause_rate_override ?? globalSettings?.pause_rate ?? 10);
    setDilutionLinksSource(accountSetting?.dilution_links_source ?? "");
    setReplacementLinksSource(accountSetting?.replacement_links_source ?? "");
  }, [config, accountSetting, accountId, globalSettings]);

  const hasOverrides = !!(
    accountSetting?.ad_name_prefix_override ||
    accountSetting?.warning_threshold_override != null ||
    accountSetting?.rejection_threshold_override != null ||
    accountSetting?.recovery_threshold_override != null ||
    accountSetting?.pause_rate_override != null ||
    accountSetting?.dilution_links_source ||
    accountSetting?.replacement_links_source ||
    accountSetting?.auto_launch_override ||
    accountSetting?.ad_name_append
  );

  const handleSave = async () => {
    try {
      await Promise.all([
        upsertHealth.mutateAsync({
          workspace_id: workspaceId,
          fb_ad_account_id: accountId,
          guardrail_mode: mode,
          rejection_threshold: rejThreshold,
          warning_threshold: warnThreshold,
        }),
        upsertRRM.mutateAsync({
          workspace_id: workspaceId,
          fb_ad_account_id: accountId,
          auto_launch_override: autoLaunchOverride,
          auto_launch_enabled: autoLaunchEnabled,
          ad_name_append: adNameAppend || null,
          dilution_campaign_url_id: dilutionOfferId || null,
          dilution_enabled: dilutionEnabled,
          replacement_campaign_url_id: replacementOfferId || null,
          replacement_enabled: replacementEnabled,
          selected_page_ids: selectedPageIds,
          ad_name_prefix_override: prefixOverride || null,
          warning_threshold_override: useGlobalWarning ? null : warningOverride,
          rejection_threshold_override: useGlobalRejection ? null : rejectionOverride,
          recovery_threshold_override: useGlobalRecovery ? null : recoveryOverride,
          pause_rate_override: useGlobalPauseRate ? null : pauseRateOverride,
          dilution_links_source: dilutionLinksSource || null,
          replacement_links_source: replacementLinksSource || null,
        }),
      ]);
      toast({ title: "Configuration saved" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const handleResetToGlobal = async () => {
    try {
      await resetToGlobal.mutateAsync({ workspace_id: workspaceId, fb_ad_account_id: accountId });
      toast({ title: "Reset to global settings" });
    } catch (err: any) {
      toast({ title: "Failed to reset", description: err.message, variant: "destructive" });
    }
  };

  const saving = upsertHealth.isPending || upsertRRM.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="space-y-5 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure — {accountName}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Reset to Global */}
          {hasOverrides && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <RotateCcw className="h-3 w-3" />
                  Reset to Global Settings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Global Settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all per-account overrides. The account will inherit all settings from the global configuration.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToGlobal}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Guardrail Mode */}
          <div className="space-y-3">
            <Label>Guardrail Mode</Label>
            <RadioGroup value={mode} onValueChange={setMode} className="space-y-2">
              {[
                { value: "off", label: "OFF", desc: "No monitoring" },
                { value: "monitor", label: "Monitor-only", desc: "Track & alert, no auto-action" },
                { value: "auto_maintain", label: "Auto-maintain", desc: "Automatic dilution when thresholds crossed" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-start gap-2">
                  <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} />
                  <Label htmlFor={`mode-${opt.value}`} className="font-normal">
                    <span className="font-medium">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">— {opt.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {mode !== "off" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Warning Threshold (%)</Label>
                <Input type="number" step="0.01" value={warnThreshold} onChange={(e) => setWarnThreshold(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Rejection Threshold (%)</Label>
                <Input type="number" step="0.01" value={rejThreshold} onChange={(e) => setRejThreshold(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          )}

          <Separator />

          {/* Threshold Overrides */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Threshold Overrides</Label>

            <OverrideField
              label="Warning Threshold (%)"
              useGlobal={useGlobalWarning}
              onUseGlobalChange={setUseGlobalWarning}
              value={warningOverride}
              onValueChange={setWarningOverride}
              globalValue={globalSettings?.warning_threshold ?? 0.8}
            />
            <OverrideField
              label="Rejection Threshold (%)"
              useGlobal={useGlobalRejection}
              onUseGlobalChange={setUseGlobalRejection}
              value={rejectionOverride}
              onValueChange={setRejectionOverride}
              globalValue={globalSettings?.rejection_threshold ?? 1.0}
            />
            <OverrideField
              label="Recovery Threshold (%)"
              useGlobal={useGlobalRecovery}
              onUseGlobalChange={setUseGlobalRecovery}
              value={recoveryOverride}
              onValueChange={setRecoveryOverride}
              globalValue={globalSettings?.recovery_threshold ?? 0.5}
            />
            <OverrideField
              label="Pause Rate (%/hr)"
              useGlobal={useGlobalPauseRate}
              onUseGlobalChange={setUseGlobalPauseRate}
              value={pauseRateOverride}
              onValueChange={setPauseRateOverride}
              globalValue={globalSettings?.pause_rate ?? 10}
            />
          </div>

          <Separator />

          {/* Ad Name Prefix Override */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Ad Name Prefix Override</Label>
            <Input
              value={prefixOverride}
              onChange={(e) => setPrefixOverride(e.target.value)}
              placeholder="Leave empty to use global"
            />
            <p className="text-xs text-muted-foreground">
              {prefixOverride ? "" : "(inherited from global)"}
            </p>
          </div>

          {/* Links Source Override */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dilution Links Source</Label>
              <Select value={dilutionLinksSource || "__inherit__"} onValueChange={(v) => setDilutionLinksSource(v === "__inherit__" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__inherit__">Inherit Global</SelectItem>
                  <SelectItem value="global">Global Links</SelectItem>
                  <SelectItem value="offer">From Offer</SelectItem>
                  <SelectItem value="account">Per-Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Replacement Links Source</Label>
              <Select value={replacementLinksSource || "__inherit__"} onValueChange={(v) => setReplacementLinksSource(v === "__inherit__" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__inherit__">Inherit Global</SelectItem>
                  <SelectItem value="global">Global Links</SelectItem>
                  <SelectItem value="offer">From Offer</SelectItem>
                  <SelectItem value="account">Per-Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dilution & Replacement offers */}
          {offers && offers.length > 0 && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Dilution</Label>
                <Select value={dilutionOfferId || "__none__"} onValueChange={(v) => setDilutionOfferId(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select offer..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {offers.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch checked={dilutionEnabled} onCheckedChange={setDilutionEnabled} />
                  <span className="text-sm text-muted-foreground">Enabled</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Replacement</Label>
                <Select value={replacementOfferId || "__none__"} onValueChange={(v) => setReplacementOfferId(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select offer..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {offers.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch checked={replacementEnabled} onCheckedChange={setReplacementEnabled} />
                  <span className="text-sm text-muted-foreground">Enabled</span>
                </div>
              </div>

              <Separator />

              {/* Pages for Dilution */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Pages for Dilution</Label>
                <p className="text-xs text-muted-foreground">Select which pages under this ad account should be used for dilution ads.</p>
                <div className="space-y-2">
                  {getDummyPages(accountId, accountName).map((page) => {
                    const isSelected = selectedPageIds.includes(page.page_id);
                    return (
                      <label
                        key={page.page_id}
                        className={`flex items-center gap-3 cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50 ${isSelected ? "border-primary/50 bg-primary/5" : "border-border"}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {
                            setSelectedPageIds((prev) =>
                              prev.includes(page.page_id)
                                ? prev.filter((id) => id !== page.page_id)
                                : [...prev, page.page_id]
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{page.name}</p>
                          <p className="text-xs text-muted-foreground">Live ads: {page.live_ads}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Per-account overrides */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Launch Overrides</Label>
            <div className="flex items-center gap-2">
              <Switch checked={autoLaunchOverride} onCheckedChange={setAutoLaunchOverride} />
              <span className="text-sm">Override global auto-launch</span>
            </div>
            {autoLaunchOverride && (
              <div className="flex items-center gap-2 pl-4">
                <Switch checked={autoLaunchEnabled} onCheckedChange={setAutoLaunchEnabled} />
                <span className="text-sm text-muted-foreground">Auto-launch for this account</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Ad Name Suffix (override)</Label>
              <Input
                value={adNameAppend}
                onChange={(e) => setAdNameAppend(e.target.value)}
                placeholder="Leave empty to use global"
              />
              <p className="text-xs text-muted-foreground">
                {adNameAppend ? "" : "(inherited from global)"}
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function OverrideField({
  label,
  useGlobal,
  onUseGlobalChange,
  value,
  onValueChange,
  globalValue,
}: {
  label: string;
  useGlobal: boolean;
  onUseGlobalChange: (v: boolean) => void;
  value: number;
  onValueChange: (v: number) => void;
  globalValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1.5">
          <Checkbox
            checked={useGlobal}
            onCheckedChange={(c) => onUseGlobalChange(!!c)}
            id={`use-global-${label}`}
          />
          <Label htmlFor={`use-global-${label}`} className="text-xs text-muted-foreground font-normal">Use global</Label>
        </div>
      </div>
      {useGlobal ? (
        <div className="flex items-center gap-2">
          <Input type="number" value={globalValue} disabled className="opacity-60" />
          <Badge variant="outline" className="text-[10px] shrink-0">inherited</Badge>
        </div>
      ) : (
        <Input type="number" step="0.01" value={value} onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)} />
      )}
    </div>
  );
}
