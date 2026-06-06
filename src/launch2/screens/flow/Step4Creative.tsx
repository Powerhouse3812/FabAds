/**
 * Step 4 — Creative + Allocation + Tracking.
 *
 * Ad-type picker (single-image / carousel / video / dpa) → setAdType. A REAL
 * creative picker selects from creativesForType(adType) (DPA shows only the
 * dynamic feed asset; the others exclude DPA), toggling each into plan.creatives
 * as a CreativeSpec carrying its assetId. Allocation (distribute / multiply /
 * manual) decides how those creatives fill the structure's ad slots, with a live
 * "resulting shape" and — for manual — an ad-slot→creative mapper. Tracking adds
 * a destination URL, optional display link, and a UTM/params template with a live
 * tracked-URL preview. A structure summary reflects the multiply expansion and the
 * LIVE budget recomputes from budgetPerDay() as inputs change.
 */
import { useEffect } from "react";
import {
  Film,
  Images,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AdType, AllocationMode, CreativeAsset, CreativeSpec } from "../../types";
import { getStrategy } from "../../data/strategies";
import { creativesForType } from "../../data/mockCreatives";
import { buildTrackedUrl } from "../../utils/tracking";
import {
  budgetPerDay,
  creativeMultiplier,
  estimateRequested,
  validateStep,
} from "../../state/flowDerive";
import { findAccount } from "../../data/mockData";
import { formatMoney } from "../../utils/time";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { InlineErrors, SectionLabel, SelectTile } from "./parts";
import { CreativePicker } from "./CreativePicker";
import { AllocationSlotMapper } from "./AllocationSlotMapper";

const AD_TYPES: { id: AdType; label: string; icon: LucideIcon }[] = [
  { id: "single-image", label: "Single image", icon: ImageIcon },
  { id: "carousel", label: "Carousel", icon: Images },
  { id: "video", label: "Video", icon: Film },
  { id: "dpa", label: "Catalogue (DPA)", icon: LayoutGrid },
];

const ALLOCATIONS: { id: AllocationMode; label: string; blurb: string }[] = [
  {
    id: "distribute",
    label: "Distribute",
    blurb: "Round-robin creatives across existing ad slots. Ad count unchanged.",
  },
  {
    id: "multiply",
    label: "Multiply",
    blurb: "Clone the whole structure once per creative. Ads × creatives.",
  },
  {
    id: "manual",
    label: "Manual",
    blurb: "Pin specific creatives to specific slots. Rest fall back to auto.",
  },
];

/** Per-destination ad slots the structure produces (before duplication). */
function destinationSlots(plan: UseLaunch2FlowReturn["plan"]): number {
  const { campaigns, adSetsPerCampaign, adsPerAdSet } = plan.structure;
  return campaigns * adSetsPerCampaign * adsPerAdSet * creativeMultiplier(plan);
}

export function Step4Creative({ flow }: { flow: UseLaunch2FlowReturn }) {
  const { plan } = flow;
  const errors = validateStep(plan, 4).errors;
  const strategy = getStrategy(plan.strategyId);
  const currency = findAccount(plan.targets[0]?.accountId ?? "")?.currency ?? "USD";

  const assets = creativesForType(plan.adType);
  const selectedIds = new Set(plan.creatives.map((c) => c.assetId ?? c.id));

  const { campaigns, adSetsPerCampaign, adsPerAdSet } = plan.structure;
  const baseAds = campaigns * adSetsPerCampaign * adsPerAdSet;
  const multiplier = creativeMultiplier(plan);
  const finalAds = estimateRequested(plan);
  const slots = destinationSlots(plan);

  // Reset the manual slot map whenever the selected creative set changes, so a
  // map can never reference a removed creative. Keyed on the sorted id list.
  const creativeKey = plan.creatives
    .map((c) => c.id)
    .sort()
    .join(",");
  useEffect(() => {
    if (Object.keys(plan.creativeSlotMap).length > 0) {
      flow.patch({ creativeSlotMap: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creativeKey]);

  function toggleCreative(asset: CreativeAsset) {
    const exists = plan.creatives.some((c) => (c.assetId ?? c.id) === asset.id);
    if (exists) {
      flow.patch({
        creatives: plan.creatives.filter((c) => (c.assetId ?? c.id) !== asset.id),
      });
    } else {
      const spec: CreativeSpec = {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        source: asset.source,
        thumbnail: asset.thumbnail,
        assetId: asset.id,
      };
      flow.patch({ creatives: [...plan.creatives, spec] });
    }
  }

  function removeCreative(id: string) {
    flow.patch({ creatives: plan.creatives.filter((c) => c.id !== id) });
  }

  // Live tracked-URL preview with sample tokens so {{campaign}}/{{adset}} resolve.
  const SAMPLE_CAMPAIGN = strategy ? `${strategy.name} • Sales` : "Sales campaign";
  const SAMPLE_ADSET = "Set 1 • Broad";
  const trackedPreview = buildTrackedUrl(plan.destinationUrl, plan.utmTemplate, {
    campaign: SAMPLE_CAMPAIGN,
    adset: SAMPLE_ADSET,
  });

  // Structure-summary chips (cap visual at ~8 sets).
  const VISIBLE_SETS = 8;
  const shownSets = Math.min(adSetsPerCampaign, VISIBLE_SETS);
  const hiddenSets = adSetsPerCampaign - shownSets;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* LEFT — ad type + creatives + allocation + tracking */}
      <div className="space-y-4">
        {/* Ad type */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Ad type</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AD_TYPES.map((t) => {
                const Icon = t.icon;
                const selected = plan.adType === t.id;
                return (
                  <SelectTile key={t.id} selected={selected} onClick={() => flow.setAdType(t.id)}>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="mt-1.5 block text-xs font-semibold text-foreground">{t.label}</span>
                  </SelectTile>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {plan.adType === "dpa"
                ? "Catalogue ads pull products dynamically from your feed."
                : "Pick creatives below; only assets matching this type are shown."}
            </p>
          </CardContent>
        </Card>

        {/* Creative picker */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel
              trailing={
                <span className="text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                  {plan.creatives.length} selected
                </span>
              }
            >
              Creatives
            </SectionLabel>

            <CreativePicker assets={assets} selectedIds={selectedIds} onToggle={toggleCreative} />

            {plan.creatives.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {plan.creatives.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.type} · {c.source}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCreative(c.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${c.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <InlineErrors className="mt-3" errors={errors} />
          </CardContent>
        </Card>

        {/* Allocation */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Allocation</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {ALLOCATIONS.map((a) => (
                <SelectTile
                  key={a.id}
                  selected={plan.allocation === a.id}
                  onClick={() => flow.setAllocation(a.id)}
                >
                  <span className="text-sm font-semibold text-foreground">{a.label}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{a.blurb}</p>
                </SelectTile>
              ))}
            </div>

            {/* live resulting shape */}
            <div className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Base</span>
                <span className="font-mono tabular-nums text-foreground">
                  {campaigns}×{adSetsPerCampaign}×{adsPerAdSet} = {baseAds}
                </span>
                {plan.allocation === "multiply" && (
                  <>
                    <span className="text-muted-foreground">×</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {multiplier} creative{multiplier === 1 ? "" : "s"}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">→</span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {finalAds} ad{finalAds === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground">/ destination</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {plan.allocation === "distribute" &&
                  "Creatives cycle across the existing slots — same ad count, more variety per set."}
                {plan.allocation === "multiply" &&
                  "Each creative gets its own copy of the structure — ad count and daily budget scale by creative."}
                {plan.allocation === "manual" &&
                  "You pin creatives to slots below; budget and ad count stay at the base."}
              </p>
            </div>

            {plan.allocation === "manual" && (
              <div className="mt-3">
                <AllocationSlotMapper
                  totalSlots={slots}
                  creatives={plan.creatives}
                  slotMap={plan.creativeSlotMap}
                  onChange={(next) => flow.patch({ creativeSlotMap: next })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Tracking</SectionLabel>
            <div className="space-y-3">
              <Field label="Destination URL" htmlFor="dest-url">
                <Input
                  id="dest-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://shop.example.com/collections/new"
                  value={plan.destinationUrl}
                  onChange={(e) => flow.setDestinationUrl(e.target.value)}
                />
              </Field>

              <Field label="Display link" htmlFor="display-link" optional>
                <Input
                  id="display-link"
                  placeholder="shop.example.com"
                  value={plan.displayLink ?? ""}
                  onChange={(e) =>
                    flow.patch({ displayLink: e.target.value ? e.target.value : null })
                  }
                />
              </Field>

              <Field label="URL parameters (UTM)" htmlFor="utm">
                <Input
                  id="utm"
                  className="font-mono text-xs"
                  placeholder="utm_source=facebook&utm_medium=paid&utm_campaign={{campaign}}"
                  value={plan.utmTemplate}
                  onChange={(e) => flow.setUtmTemplate(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  <code className="font-mono">{"{{campaign}}"}</code> and{" "}
                  <code className="font-mono">{"{{adset}}"}</code> resolve per ad at launch.
                </p>
              </Field>

              {/* live preview */}
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Link2 className="h-3 w-3" />
                  Tracked URL preview
                </div>
                {plan.destinationUrl ? (
                  <p className="break-all font-mono text-[11px] leading-relaxed text-foreground">
                    {trackedPreview}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Add a destination URL to preview the tracked link.
                  </p>
                )}
                {plan.destinationUrl && (
                  <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                    sample · campaign={SAMPLE_CAMPAIGN} · adset={SAMPLE_ADSET}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT — structure summary + live budget */}
      <div className="space-y-4">
        {/* Structure summary */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel
              trailing={
                <span className="font-mono text-[11px] font-normal tabular-nums tracking-normal text-muted-foreground">
                  {campaigns} : {adSetsPerCampaign} : {adsPerAdSet}
                </span>
              }
            >
              Structure
            </SectionLabel>
            {strategy ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground">
                    {campaigns} campaign{campaigns === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from({ length: shownSets }).map((_, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-muted px-2 py-1 font-mono text-[11px] tabular-nums text-muted-foreground"
                      >
                        set {i + 1}
                      </span>
                    ))}
                    {hiddenSets > 0 && (
                      <span className="px-1 text-[11px] text-muted-foreground">+{hiddenSets} more</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground">
                    {adsPerAdSet} ad{adsPerAdSet === 1 ? "" : "s"} each
                  </span>
                </div>
                {multiplier > 1 ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Multiply clones this{" "}
                    <span className="font-mono tabular-nums text-foreground">×{multiplier}</span> (one
                    per creative) → {slots} ad slots per destination.
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Structure comes from the chosen strategy.{" "}
                    {plan.allocation === "manual"
                      ? "Creatives are pinned to slots."
                      : "Creatives map onto ad sets automatically."}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Pick a strategy in Step 1 to set the structure.</p>
            )}
          </CardContent>
        </Card>

        {/* Live budget */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Live budget</SectionLabel>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
                {formatMoney(budgetPerDay(plan), currency)}
              </span>
              <span className="text-sm text-muted-foreground">/ day</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              ad sets × budget per set
              {multiplier > 1 ? " × creatives" : ""}
              {plan.distribution === "duplicate" ? " × destinations" : ""}
            </p>

            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <tbody>
                  <BudgetRow label="Destinations" value={Math.max(plan.targets.length, 0)} />
                  <BudgetRow label="Ad sets (per dest)" value={campaigns * adSetsPerCampaign * multiplier} />
                  <BudgetRow label="Creatives" value={plan.creatives.length} />
                  <BudgetRow label="Ads requested" value={finalAds} strong />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {label}
        {optional && <span className="text-[10px] font-normal text-muted-foreground/70">optional</span>}
      </label>
      {children}
    </div>
  );
}

function BudgetRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-2 text-muted-foreground">{label}</td>
      <td
        className={cn(
          "px-3 py-2 text-right font-mono tabular-nums",
          strong ? "font-semibold text-foreground" : "text-foreground/80",
        )}
      >
        {value}
      </td>
    </tr>
  );
}
