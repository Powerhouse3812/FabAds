/**
 * StructureEditor — 3 numeric inputs for campaigns × ad sets × ads/set.
 * Lives inside the Distribution surface (Step 4).
 *
 * Certain spread modes ignore certain inputs (uses creatives.length instead).
 * Dim the overridden input + show a tooltip + a small note below.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../../state/useFlowV2";

type StructureKey = "campaigns" | "adSetsPerCampaign" | "adsPerAdSet";
type SpreadMode = "one_per_adset" | "stacked" | "multiply" | string;

const overrideMap: Partial<Record<SpreadMode, StructureKey[]>> = {
  one_per_adset: ["adSetsPerCampaign"],
  stacked: ["adsPerAdSet"],
  multiply: [], // campaigns gets MULTIPLIED, not ignored — leave editable
};

export default function StructureEditor({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const s = plan.structure;
  const set = (key: keyof typeof s, val: number) => {
    patch({ structure: { ...s, [key]: Math.max(1, val) } });
  };

  const spread = (plan as { spread?: SpreadMode }).spread ?? "";
  const isOverridden = (key: StructureKey) =>
    Boolean(overrideMap[spread]?.includes(key));

  const overrideTitle = (key: StructureKey) =>
    isOverridden(key)
      ? `Ignored by spread="${spread}" — uses creatives.length`
      : undefined;

  const anyOverridden = (
    ["campaigns", "adSetsPerCampaign", "adsPerAdSet"] as const
  ).some(isOverridden);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Structure (campaigns × ad sets × ads)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <NumInput
          value={s.campaigns}
          onChange={(v) => set("campaigns", v)}
          suffix="campaigns"
          dimmed={isOverridden("campaigns")}
          title={overrideTitle("campaigns")}
        />
        <span className="text-muted-foreground/60">×</span>
        <NumInput
          value={s.adSetsPerCampaign}
          onChange={(v) => set("adSetsPerCampaign", v)}
          suffix="ad sets"
          dimmed={isOverridden("adSetsPerCampaign")}
          title={overrideTitle("adSetsPerCampaign")}
        />
        <span className="text-muted-foreground/60">×</span>
        <NumInput
          value={s.adsPerAdSet}
          onChange={(v) => set("adsPerAdSet", v)}
          suffix="ads/set"
          dimmed={isOverridden("adsPerAdSet")}
          title={overrideTitle("adsPerAdSet")}
        />
      </div>
      {anyOverridden && (
        <p className="text-[11px] text-muted-foreground italic">
          Greyed inputs are overridden by spread mode "{String(spread).replace(/_/g, " ")}" — they use creatives.length instead.
        </p>
      )}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  suffix,
  dimmed,
  title,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  dimmed?: boolean;
  title?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", dimmed && "opacity-50")}>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="h-8 w-14 font-mono tabular-nums text-xs"
        title={title}
      />
      <span className="text-[11px] text-muted-foreground">{suffix}</span>
    </div>
  );
}
