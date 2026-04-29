import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Settings, X, Link as LinkIcon, AlertCircle } from "lucide-react";
import {
  useUpsertRRMGlobalSettings,
  useRRMGlobalLinks,
  useAddRRMGlobalLink,
  useDeleteRRMGlobalLink,
  type RRMGlobalSettings as GlobalSettingsType,
} from "@/hooks/use-rrm-settings";
import { useToast } from "@/hooks/use-toast";

interface OfferOption {
  id: string;
  name: string;
}

interface Props {
  workspaceId: string;
  settings: GlobalSettingsType | null;
  offers: OfferOption[];
  onCreateOffer: () => void;
}

export function RRMGlobalSettings({ workspaceId, settings, offers, onCreateOffer }: Props) {
  const [autoLaunch, setAutoLaunch] = useState(settings?.auto_launch_enabled ?? false);
  const [delayMinutes, setDelayMinutes] = useState(settings?.auto_launch_delay_minutes ?? 0);
  const [adNameAppend, setAdNameAppend] = useState(settings?.ad_name_append ?? "");
  const [defaultDilutionId, setDefaultDilutionId] = useState(settings?.default_dilution_campaign_url_id ?? "");
  const [defaultReplacementId, setDefaultReplacementId] = useState(settings?.default_replacement_campaign_url_id ?? "");

  // New fields
  const [dilutionEnabled, setDilutionEnabled] = useState(settings?.dilution_enabled ?? false);
  const [replacementEnabled, setReplacementEnabled] = useState(settings?.replacement_enabled ?? false);
  const [dilutionPrefix, setDilutionPrefix] = useState(settings?.dilution_ad_name_prefix ?? "[DILUTION]");
  const [replacementPrefix, setReplacementPrefix] = useState(settings?.replacement_ad_name_prefix ?? "[RECOVERY]");
  const [checkInterval, setCheckInterval] = useState(settings?.check_interval_minutes ?? 60);
  const [warningThreshold, setWarningThreshold] = useState(settings?.warning_threshold ?? 0.8);
  const [rejectionThreshold, setRejectionThreshold] = useState(settings?.rejection_threshold ?? 1.0);
  const [recoveryThreshold, setRecoveryThreshold] = useState(settings?.recovery_threshold ?? 0.5);
  const [pauseRate, setPauseRate] = useState(settings?.pause_rate ?? 10.0);
  const [dilutionLinksSource, setDilutionLinksSource] = useState(settings?.dilution_links_source ?? "global");
  const [replacementLinksSource, setReplacementLinksSource] = useState(settings?.replacement_links_source ?? "global");

  // Links
  const { data: globalLinks } = useRRMGlobalLinks(workspaceId);
  const addLink = useAddRRMGlobalLink();
  const deleteLink = useDeleteRRMGlobalLink();
  const [newDilutionUrl, setNewDilutionUrl] = useState("");
  const [newReplacementUrl, setNewReplacementUrl] = useState("");

  const upsert = useUpsertRRMGlobalSettings();
  const { toast } = useToast();

  const dilutionLinks = (globalLinks ?? []).filter((l) => l.link_type === "dilution");
  const replacementLinks = (globalLinks ?? []).filter((l) => l.link_type === "replacement");

  useEffect(() => {
    setAutoLaunch(settings?.auto_launch_enabled ?? false);
    setDelayMinutes(settings?.auto_launch_delay_minutes ?? 0);
    setAdNameAppend(settings?.ad_name_append ?? "");
    setDefaultDilutionId(settings?.default_dilution_campaign_url_id ?? "");
    setDefaultReplacementId(settings?.default_replacement_campaign_url_id ?? "");
    setDilutionEnabled(settings?.dilution_enabled ?? false);
    setReplacementEnabled(settings?.replacement_enabled ?? false);
    setDilutionPrefix(settings?.dilution_ad_name_prefix ?? "[DILUTION]");
    setReplacementPrefix(settings?.replacement_ad_name_prefix ?? "[RECOVERY]");
    setCheckInterval(settings?.check_interval_minutes ?? 60);
    setWarningThreshold(settings?.warning_threshold ?? 0.8);
    setRejectionThreshold(settings?.rejection_threshold ?? 1.0);
    setRecoveryThreshold(settings?.recovery_threshold ?? 0.5);
    setPauseRate(settings?.pause_rate ?? 10.0);
    setDilutionLinksSource(settings?.dilution_links_source ?? "global");
    setReplacementLinksSource(settings?.replacement_links_source ?? "global");
  }, [settings]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        workspace_id: workspaceId,
        auto_launch_enabled: autoLaunch,
        auto_launch_delay_minutes: delayMinutes,
        ad_name_append: adNameAppend,
        default_dilution_campaign_url_id: defaultDilutionId || null,
        default_replacement_campaign_url_id: defaultReplacementId || null,
        dilution_enabled: dilutionEnabled,
        replacement_enabled: replacementEnabled,
        dilution_ad_name_prefix: dilutionPrefix,
        replacement_ad_name_prefix: replacementPrefix,
        check_interval_minutes: checkInterval,
        warning_threshold: warningThreshold,
        rejection_threshold: rejectionThreshold,
        recovery_threshold: recoveryThreshold,
        pause_rate: pauseRate,
        dilution_links_source: dilutionLinksSource,
        replacement_links_source: replacementLinksSource,
      });
      toast({ title: "Global settings saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const handleAddLink = async (type: "dilution" | "replacement") => {
    const url = type === "dilution" ? newDilutionUrl : newReplacementUrl;
    if (!url.trim()) return;
    try {
      await addLink.mutateAsync({ workspace_id: workspaceId, link_type: type, url: url.trim() });
      if (type === "dilution") setNewDilutionUrl("");
      else setNewReplacementUrl("");
    } catch (err: any) {
      toast({ title: "Failed to add link", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Global RRM Settings
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onCreateOffer}>
          <Plus className="h-3 w-3" />
          New RRM Offer
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Dilution Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Dilution</Label>
            <Switch checked={dilutionEnabled} onCheckedChange={setDilutionEnabled} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ad Name Prefix</Label>
              <Input value={dilutionPrefix} onChange={(e) => setDilutionPrefix(e.target.value)} placeholder="[DILUTION]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Default Offer</Label>
              <Select value={defaultDilutionId || "__none__"} onValueChange={(v) => setDefaultDilutionId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {offers.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Links Source</Label>
              <Select value={dilutionLinksSource} onValueChange={setDilutionLinksSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Links</SelectItem>
                  <SelectItem value="offer">From Offer</SelectItem>
                  <SelectItem value="account">Per-Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dilution Links */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Dilution Links</Label>
            <div className="flex items-center gap-2">
              <Input
                value={newDilutionUrl}
                onChange={(e) => setNewDilutionUrl(e.target.value)}
                placeholder="https://example.com/landing-page"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddLink("dilution")}
              />
              <Button size="sm" variant="outline" onClick={() => handleAddLink("dilution")} disabled={!newDilutionUrl.trim() || addLink.isPending}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {dilutionLinks.length > 0 && (
              <div className="space-y-1">
                {dilutionLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-2 p-2 rounded-md border text-sm">
                    <span className="truncate text-xs">{link.url}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteLink.mutate(link.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>Ads will use the OG image from these URLs. Ad copies will be AI-generated.</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Replacement Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Replacement</Label>
            <Switch checked={replacementEnabled} onCheckedChange={setReplacementEnabled} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ad Name Prefix</Label>
              <Input value={replacementPrefix} onChange={(e) => setReplacementPrefix(e.target.value)} placeholder="[RECOVERY]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Default Offer</Label>
              <Select value={defaultReplacementId || "__none__"} onValueChange={(v) => setDefaultReplacementId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {offers.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Links Source</Label>
              <Select value={replacementLinksSource} onValueChange={setReplacementLinksSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Links</SelectItem>
                  <SelectItem value="offer">From Offer</SelectItem>
                  <SelectItem value="account">Per-Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Replacement Links */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Replacement Links</Label>
            <div className="flex items-center gap-2">
              <Input
                value={newReplacementUrl}
                onChange={(e) => setNewReplacementUrl(e.target.value)}
                placeholder="https://example.com/landing-page"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddLink("replacement")}
              />
              <Button size="sm" variant="outline" onClick={() => handleAddLink("replacement")} disabled={!newReplacementUrl.trim() || addLink.isPending}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {replacementLinks.length > 0 && (
              <div className="space-y-1">
                {replacementLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-2 p-2 rounded-md border text-sm">
                    <span className="truncate text-xs">{link.url}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteLink.mutate(link.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>Ads will use the OG image from these URLs. Ad copies will be AI-generated.</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Thresholds ── */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Global Thresholds</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Warning (%)</Label>
              <Input type="number" step="0.01" value={warningThreshold} onChange={(e) => setWarningThreshold(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rejection (%)</Label>
              <Input type="number" step="0.01" value={rejectionThreshold} onChange={(e) => setRejectionThreshold(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Recovery (%)</Label>
              <Input type="number" step="0.01" value={recoveryThreshold} onChange={(e) => setRecoveryThreshold(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pause Rate (%/hr)</Label>
              <Input type="number" step="1" value={pauseRate} onChange={(e) => setPauseRate(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Launch Settings ── */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Launch Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Auto-launch</Label>
              <div className="flex items-center gap-2">
                <Switch checked={autoLaunch} onCheckedChange={setAutoLaunch} />
                <span className="text-xs text-muted-foreground">{autoLaunch ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Delay (min)</Label>
              <Input type="number" min={0} value={delayMinutes} onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)} disabled={!autoLaunch} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Check Interval (min)</Label>
              <Input type="number" min={1} value={checkInterval} onChange={(e) => setCheckInterval(parseInt(e.target.value) || 60)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ad Name Suffix</Label>
            <Input value={adNameAppend} onChange={(e) => setAdNameAppend(e.target.value)} placeholder='e.g. [RRM]' />
          </div>
        </div>

        <Separator />

        {/* Default Ad Structure */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Default Ad Structure</Label>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-4 font-mono text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📦</span>
              <span className="text-foreground font-medium">Campaign:</span>
              <span className="text-muted-foreground">$1/day CBO</span>
            </div>
            <div className="flex items-center gap-2 pl-5">
              <span className="text-muted-foreground">📋</span>
              <span className="text-foreground font-medium">Ad Set:</span>
              <span className="text-muted-foreground">Auto placements</span>
            </div>
            <div className="flex items-center gap-2 pl-10">
              <span className="text-muted-foreground">🎨</span>
              <span className="text-foreground font-medium">Ads:</span>
              <span className="text-muted-foreground">250 ads (from selected offer)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={upsert.isPending} size="sm">
            {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Global Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
