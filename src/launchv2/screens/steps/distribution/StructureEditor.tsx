/**
 * StructureEditor — 3 numeric inputs for campaigns × ad sets × ads/set.
 * Lives inside the Distribution surface (Step 4).
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFlowV2 } from "../../../state/useFlowV2";

export default function StructureEditor({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const s = plan.structure;
  const set = (key: keyof typeof s, val: number) => {
    patch({ structure: { ...s, [key]: Math.max(1, val) } });
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Structure (campaigns × ad sets × ads)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <NumInput value={s.campaigns} onChange={(v) => set("campaigns", v)} suffix="campaigns" />
        <span className="text-muted-foreground/60">×</span>
        <NumInput value={s.adSetsPerCampaign} onChange={(v) => set("adSetsPerCampaign", v)} suffix="ad sets" />
        <span className="text-muted-foreground/60">×</span>
        <NumInput value={s.adsPerAdSet} onChange={(v) => set("adsPerAdSet", v)} suffix="ads/set" />
      </div>
    </div>
  );
}

function NumInput({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="h-8 w-14 font-mono tabular-nums text-xs"
      />
      <span className="text-[11px] text-muted-foreground">{suffix}</span>
    </div>
  );
}
