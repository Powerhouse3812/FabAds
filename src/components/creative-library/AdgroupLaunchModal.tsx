import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Rocket, Image as ImageIcon, Layers, AlertTriangle, Info, CheckCircle2, Settings2, Shuffle } from "lucide-react";
import { useAdgroupLaunch, type AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";
import { AdvancedMappingModal, type CustomMapping } from "./AdvancedMappingModal";

interface AdgroupLaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AdgroupLaunchItem[];
}

export function AdgroupLaunchModal({ open, onOpenChange, items }: AdgroupLaunchModalProps) {
  const [name, setName] = useState(() => `CL Launch — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
  const [adsPerAdset, setAdsPerAdset] = useState(items.length);
  const [campaigns, setCampaigns] = useState(1);
  const [adsetsPerCampaign, setAdsetsPerCampaign] = useState(1);
  const [customMapping, setCustomMapping] = useState<CustomMapping | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [roundRobin, setRoundRobin] = useState(false);
  const launch = useAdgroupLaunch();

  useEffect(() => {
    if (open) {
      setAdsPerAdset(items.length);
      setName(`CL Launch — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
      setCustomMapping(null);
      setRoundRobin(false);
    }
  }, [open, items.length]);

  const handleRoundRobinToggle = (checked: boolean) => {
    setRoundRobin(checked);
    setCustomMapping(null);
    if (checked) {
      setAdsetsPerCampaign(items.length);
      setAdsPerAdset(1);
    } else {
      setAdsetsPerCampaign(1);
      setAdsPerAdset(items.length);
    }
  };

  const adgroupCount = items.filter((i) => i.type === "adgroup").length;
  const mediaCount = items.filter((i) => i.type === "media").length;
  const totalAds = campaigns * adsetsPerCampaign * adsPerAdset;

  // Distribution status
  const itemCount = items.length;
  const isCleanFit = adsPerAdset === itemCount;
  const isDuplication = adsPerAdset > itemCount;
  const isTruncation = adsPerAdset < itemCount;
  const excludedCount = isTruncation ? itemCount - adsPerAdset : 0;

  // Calculate exact per-item counts for round-robin
  const perItemCounts = isDuplication && itemCount > 0
    ? items.map((_, idx) => {
        let count = 0;
        for (let slot = 0; slot < adsPerAdset; slot++) {
          if (slot % itemCount === idx) count++;
        }
        return count;
      })
    : [];

  const totalAdsets = campaigns * adsetsPerCampaign;
  const rrItemsWithoutAdset = roundRobin && totalAdsets < itemCount ? itemCount - totalAdsets : 0;

  // Build round-robin assignment preview (up to 6 rows)
  const rrPreview = roundRobin
    ? Array.from({ length: Math.min(totalAdsets, 6) }, (_, i) => ({
        adsetIdx: i,
        item: items[i % itemCount],
        itemLabel: items[i % itemCount].type === "adgroup"
          ? (items[i % itemCount].headline || items[i % itemCount].primaryText || `Item ${(i % itemCount) + 1}`)
          : `Media ${(i % itemCount) + 1}`,
        adsCount: adsPerAdset,
      }))
    : [];

  const handleLaunch = () => {
    launch.mutate({
      name,
      items,
      adsPerAdset,
      campaigns,
      adsetsPerCampaign,
      customMapping: customMapping || undefined,
      roundRobin,
    });
  };

  const handleMappingApply = (mapping: CustomMapping) => {
    setCustomMapping(mapping);
    // Update structure fields to reflect mapping
    setCampaigns(mapping.campaigns);
    setAdsetsPerCampaign(Math.max(...mapping.adsetCounts, 1));
    const totalAdsFromMapping = Object.values(mapping.assignments).flat().length;
    const totalAdsets = mapping.adsetCounts.reduce((a, b) => a + b, 0);
    setAdsPerAdset(totalAdsets > 0 ? Math.ceil(totalAdsFromMapping / totalAdsets) : 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Launch Adgroup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected items summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Selected:</span>
            {adgroupCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Layers className="h-3 w-3 mr-1" /> {adgroupCount} adgroup{adgroupCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {mediaCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" /> {mediaCount} media
              </Badge>
            )}
          </div>

          {/* Thumbnail strip */}
          {items.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {items.slice(0, 8).map((item) => (
                <div key={item.id} className="h-12 w-12 rounded-md border border-border overflow-hidden shrink-0 bg-muted">
                  {item.mediaUrls[0] && (
                    <img src={item.mediaUrls[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
              {items.length > 8 && (
                <div className="h-12 w-12 rounded-md border border-border flex items-center justify-center shrink-0 bg-muted">
                  <span className="text-[10px] text-muted-foreground">+{items.length - 8}</span>
                </div>
              )}
            </div>
          )}

          {/* Launch name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Launch Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>

          {/* Structure controls */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Campaigns</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={campaigns}
                onChange={(e) => setCampaigns(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Adsets / Campaign</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={adsetsPerCampaign}
                onChange={(e) => setAdsetsPerCampaign(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ads / Adset</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={adsPerAdset}
                onChange={(e) => setAdsPerAdset(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Round Robin toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-primary" />
              <div>
                <Label className="text-xs font-medium">Round Robin Strategy</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {roundRobin
                    ? "Each adset gets a different item — items rotate across adsets"
                    : "All adsets receive identical content"}
                </p>
              </div>
            </div>
            <Switch checked={roundRobin} onCheckedChange={handleRoundRobinToggle} />
          </div>

          {/* Advanced Mapping button — disabled when round robin is on */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => setShowMapping(true)}
            disabled={roundRobin}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {customMapping ? "Edit Custom Mapping" : "Advanced Mapping"}
          </Button>

          {customMapping && (
            <p className="text-xs flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Custom mapping applied — {Object.values(customMapping.assignments).flat().length} total ads
            </p>
          )}

          {/* Summary + distribution messages */}
          {!customMapping && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              This will create <strong className="text-foreground">{campaigns}</strong> campaign{campaigns !== 1 ? "s" : ""} ×{" "}
              <strong className="text-foreground">{adsetsPerCampaign}</strong> adset{adsetsPerCampaign !== 1 ? "s" : ""} ×{" "}
              <strong className="text-foreground">{adsPerAdset}</strong> ad{adsPerAdset !== 1 ? "s" : ""} ={" "}
              <strong className="text-foreground">{totalAds}</strong> total ad{totalAds !== 1 ? "s" : ""}.
            </p>

            {/* Round Robin preview */}
            {roundRobin && (
              <div className="text-xs space-y-1">
                <p className="flex items-center gap-1.5 text-primary">
                  <Shuffle className="h-3.5 w-3.5 shrink-0" />
                  Round Robin distribution:
                </p>
                <ul className="ml-5 space-y-0.5 text-muted-foreground">
                  {rrPreview.map((row) => (
                    <li key={row.adsetIdx} className="flex items-center gap-1.5">
                      <span className="text-foreground font-medium">Adset {row.adsetIdx + 1}</span>
                      <span>→</span>
                      <span className="truncate max-w-[140px]">{row.itemLabel}</span>
                      {row.adsCount > 1 && (
                        <span className="text-[10px] text-muted-foreground/70">×{row.adsCount} ads</span>
                      )}
                    </li>
                  ))}
                  {totalAdsets > 6 && (
                    <li className="text-muted-foreground">…and {totalAdsets - 6} more adset{totalAdsets - 6 !== 1 ? "s" : ""}</li>
                  )}
                </ul>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                  Each adset receives <strong className="text-foreground">only its assigned item</strong>{adsPerAdset > 1 ? `, repeated across ${adsPerAdset} ad slots` : ""}.
                </p>
                {totalAdsets > itemCount && (
                  <p className="flex items-center gap-1.5 text-accent-foreground mt-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Items will rotate across {totalAdsets} adsets ({Math.ceil(totalAdsets / itemCount)} cycles)
                  </p>
                )}
                {rrItemsWithoutAdset > 0 && (
                  <p className="flex items-center gap-1.5 text-destructive mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {rrItemsWithoutAdset} item{rrItemsWithoutAdset !== 1 ? "s" : ""} won't get their own adset
                  </p>
                )}
              </div>
            )}

            {/* Default mode messages */}
            {!roundRobin && isCleanFit && (
              <p className="text-xs flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Perfect fit — each adset gets all {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            )}

            {!roundRobin && isDuplication && (
              <div className="text-xs space-y-1">
                <p className="flex items-center gap-1.5 text-accent-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Items will repeat to fill {adsPerAdset} slots per adset:
                </p>
                <ul className="ml-5 space-y-0.5 text-muted-foreground">
                  {items.map((item, idx) => (
                    <li key={item.id} className="flex items-center gap-1.5">
                      <span className="truncate max-w-[140px]">
                        {item.type === "adgroup" ? (item.headline || item.primaryText || `Item ${idx + 1}`) : `Media ${idx + 1}`}
                      </span>
                      <span className="text-foreground font-medium">×{perItemCounts[idx]}</span>
                    </li>
                  ))}
                </ul>
                {totalAds > 100 && (
                  <p className="flex items-center gap-1.5 text-[hsl(var(--warning,30_80%_50%))] mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {totalAds} total ads will be created. Each adset will have identical content.
                  </p>
                )}
              </div>
            )}

            {!roundRobin && isTruncation && (
              <div className="text-xs space-y-1">
                <p className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {excludedCount} item{excludedCount !== 1 ? "s" : ""} won't be included. Use Advanced Mapping to assign them manually.
                </p>
                <ul className="ml-5 space-y-0.5 text-muted-foreground">
                  {items.slice(adsPerAdset).map((item, idx) => (
                    <li key={item.id} className="truncate max-w-[200px]">
                      — {item.type === "adgroup" ? (item.headline || item.primaryText || `Item ${adsPerAdset + idx + 1}`) : `Media ${adsPerAdset + idx + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          )}
        </div>

        <AdvancedMappingModal
          open={showMapping}
          onOpenChange={setShowMapping}
          items={items}
          campaigns={campaigns}
          adsetsPerCampaign={adsetsPerCampaign}
          adsPerAdset={adsPerAdset}
          onApply={handleMappingApply}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={launch.isPending}>
            Cancel
          </Button>
          <Button onClick={handleLaunch} disabled={launch.isPending || !name.trim()}>
            {launch.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-1" />
            )}
            Create Launch Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
