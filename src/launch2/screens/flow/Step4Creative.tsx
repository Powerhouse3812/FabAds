/**
 * Step 4 — Creative + Structure.
 *
 * Ad-type picker (single-image / carousel / video / dpa) → setAdType. Creative
 * source (library / upload / post / catalogue) mock-appends a couple of
 * CreativeSpec onto plan.creatives. A visual structure summary renders the
 * 1:N:1 tree from plan.structure, and the LIVE budget panel recomputes from
 * budgetPerDay() as inputs change.
 */
import { Film, Images, Image as ImageIcon, LayoutGrid, Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdType, CreativeSource, CreativeSpec } from "../../types";
import { getStrategy } from "../../data/strategies";
import { budgetPerDay, estimateRequested, validateStep } from "../../state/flowDerive";
import { findAccount } from "../../data/mockData";
import { formatMoney } from "../../utils/time";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { InlineErrors, SectionLabel, SelectTile } from "./parts";

const AD_TYPES: { id: AdType; label: string; icon: LucideIcon }[] = [
  { id: "single-image", label: "Single image", icon: ImageIcon },
  { id: "carousel", label: "Carousel", icon: Images },
  { id: "video", label: "Video", icon: Film },
  { id: "dpa", label: "Catalogue (DPA)", icon: LayoutGrid },
];

const SOURCES: { id: CreativeSource; label: string }[] = [
  { id: "library", label: "Library" },
  { id: "upload", label: "Upload" },
  { id: "post", label: "Post ID" },
  { id: "catalogue", label: "Catalogue feed" },
];

let creativeSeq = 0;
function makeCreatives(type: AdType, source: CreativeSource): CreativeSpec[] {
  const sourceLabel = SOURCES.find((s) => s.id === source)?.label ?? source;
  return [0, 1].map((i) => {
    creativeSeq += 1;
    return {
      id: `cr_${Date.now().toString(36)}_${creativeSeq}`,
      name: `${sourceLabel} creative ${String.fromCharCode(65 + ((creativeSeq - 1) % 26))}`,
      type,
      source,
    };
  });
}

export function Step4Creative({ flow }: { flow: UseLaunch2FlowReturn }) {
  const { plan } = flow;
  const errors = validateStep(plan, 4).errors;
  const strategy = getStrategy(plan.strategyId);
  const currency = findAccount(plan.targets[0]?.accountId ?? "")?.currency ?? "USD";

  const { campaigns, adSetsPerCampaign, adsPerAdSet } = plan.structure;
  const adSets = campaigns * adSetsPerCampaign;
  const adsCreated = estimateRequested(plan);

  function addCreatives(source: CreativeSource) {
    flow.patch({ creatives: [...plan.creatives, ...makeCreatives(plan.adType, source)] });
  }
  function removeCreative(id: string) {
    flow.patch({ creatives: plan.creatives.filter((c) => c.id !== id) });
  }

  // Representative ad-set chips (cap the visual at ~8 so 50 doesn't blow up).
  const VISIBLE_SETS = 8;
  const shownSets = Math.min(adSetsPerCampaign, VISIBLE_SETS);
  const hiddenSets = adSetsPerCampaign - shownSets;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* LEFT — ad type + source + structure */}
      <div className="space-y-4">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel
              trailing={
                <span className="text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                  {plan.creatives.length} added
                </span>
              }
            >
              Creative source
            </SectionLabel>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addCreatives(s.id)}
                >
                  <Plus className="h-4 w-4" />
                  {s.label}
                </Button>
              ))}
            </div>

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
                      className="text-muted-foreground hover:text-foreground"
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
            ) : (
              <p className="text-xs text-muted-foreground">Pick a strategy in Step 1 to set the structure.</p>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              Structure comes from the chosen strategy. Creatives map onto ad sets automatically.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT — live budget */}
      <div className="space-y-4">
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
              ad sets × budget per set{plan.distribution === "duplicate" ? " × destinations" : ""}
            </p>

            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <tbody>
                  <BudgetRow label="Destinations" value={Math.max(plan.targets.length, 0)} />
                  <BudgetRow label="Ad sets (per dest)" value={adSets} />
                  <BudgetRow label="Creatives" value={plan.creatives.length} />
                  <BudgetRow label="Ads created" value={adsCreated} strong />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
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
