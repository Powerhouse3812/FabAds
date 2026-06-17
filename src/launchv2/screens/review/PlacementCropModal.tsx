/**
 * PlacementCropModal — the `crop` field kind (AD level, field id
 * "__assetCustomization"). Mirrors Meta's "Customize media per placement"
 * flow:
 *
 *   • Default state: "Optimize for all placements" (no rules).
 *   • "Customize media per placement" reveals a GROUP-LEVEL grid — one row per
 *     placement group (Feed / Stories & Reels / In-stream), each with a Crop
 *     aspect-ratio picker + a Replace-creative picker.
 *   • Stores the result as AssetCustomizationRule[] under the override key.
 *
 * Mock tool — no real Meta calls. Group rows can expand to individual
 * placements (stubbed expand).
 */
import { useMemo, useState } from "react";
import { ChevronRight, Crop, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AssetCustomizationRule, CreativeRef } from "../../types";

/* Mock placement groups (Meta's group-level customization). */
const PLACEMENT_GROUPS: { key: string; label: string; placements: string[] }[] = [
  { key: "feed", label: "Feed", placements: ["FB Feed", "IG Feed", "Marketplace"] },
  { key: "stories_reels", label: "Stories & Reels", placements: ["FB Stories", "IG Stories", "IG Reels"] },
  { key: "instream", label: "In-stream", placements: ["FB In-stream video", "Audience Network"] },
];

const ASPECT_OPTIONS = [
  { value: "1x1", label: "1:1 — Square" },
  { value: "9x16", label: "9:16 — Vertical" },
  { value: "1.91x1", label: "1.91:1 — Landscape" },
  { value: "16x9", label: "16:9 — Wide" },
];

const NO_REPLACE = "__none__";

export function PlacementCropModal({
  open,
  onOpenChange,
  rules,
  creatives,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current rules from the override (empty = optimize for all). */
  rules: AssetCustomizationRule[];
  /** Creatives available for the "Replace" picker. */
  creatives: CreativeRef[];
  onSave: (rules: AssetCustomizationRule[]) => void;
}) {
  // "customize" mode is on whenever we already have rules.
  const [customize, setCustomize] = useState<boolean>(rules.length > 0);
  const [draft, setDraft] = useState<Record<string, AssetCustomizationRule>>(() =>
    Object.fromEntries(rules.map((r) => [r.placementGroup, r])),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const customizedCount = useMemo(
    () => Object.values(draft).filter((r) => r.cropKey || r.replacementCreativeId).length,
    [draft],
  );

  const update = (groupKey: string, patch: Partial<AssetCustomizationRule>) => {
    setDraft((prev) => ({
      ...prev,
      [groupKey]: {
        id: prev[groupKey]?.id ?? `acr_${groupKey}`,
        placementGroup: groupKey,
        ...prev[groupKey],
        ...patch,
      },
    }));
  };

  const handleSave = () => {
    if (!customize) {
      onSave([]);
    } else {
      // Keep only rows that actually customized something.
      const out = Object.values(draft).filter(
        (r) => r.cropKey || r.replacementCreativeId,
      );
      onSave(out);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Crop className="h-4 w-4 text-primary" />
            Media per placement
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle: optimize for all vs customize */}
        <div className="space-y-2">
          <ModeRow
            active={!customize}
            onClick={() => setCustomize(false)}
            title="Optimize for all placements"
            sub="Meta auto-crops your single creative to fit every placement."
          />
          <ModeRow
            active={customize}
            onClick={() => setCustomize(true)}
            title="Customize media per placement"
            sub={
              customize
                ? `${customizedCount} of ${PLACEMENT_GROUPS.length} placement groups customized`
                : "Pick a crop or replace the asset per placement group."
            }
          />
        </div>

        {/* Group grid (only when customizing) */}
        {customize && (
          <div className="mt-1 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1.4fr_1.1fr_1.1fr] gap-2 border-b border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground/70">
              <span>Placement group</span>
              <span>Crop</span>
              <span>Replace</span>
            </div>
            {PLACEMENT_GROUPS.map((g) => {
              const r = draft[g.key];
              const isExpanded = expanded === g.key;
              return (
                <div key={g.key} className="border-b border-border last:border-0">
                  <div className="grid grid-cols-[1.4fr_1.1fr_1.1fr] items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : g.key)}
                      className="flex items-center gap-1.5 text-left text-[13px] font-medium text-foreground"
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                      {g.label}
                    </button>
                    <Select
                      value={r?.cropKey ?? ""}
                      onValueChange={(v) => update(g.key, { cropKey: v })}
                    >
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-[12px]">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={r?.replacementCreativeId ?? NO_REPLACE}
                      onValueChange={(v) =>
                        update(g.key, {
                          replacementCreativeId: v === NO_REPLACE ? undefined : v,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 text-[12px]">
                        <SelectValue placeholder="Same asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_REPLACE} className="text-[12px]">
                          Same asset
                        </SelectItem>
                        {creatives.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-[12px]">
                            <span className="inline-flex items-center gap-1.5">
                              <RefreshCw className="h-3 w-3" />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isExpanded && (
                    <div className="flex flex-wrap gap-1.5 bg-muted/20 px-3 pb-2.5 pl-8">
                      {g.placements.map((p) => (
                        <span
                          key={p}
                          className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave} className="h-9">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeRow({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fab-focus flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
        active ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          active ? "border-primary" : "border-border",
        )}
      >
        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-foreground">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
