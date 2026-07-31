/**
 * ThresholdSettings — edit the bucket/fatigue formula thresholds (iter-2 W2).
 * The honest alternative to a black-box score: every number here is exactly
 * what the bucket/fatigue rules use — change one, the rule text (BucketTabs,
 * FatiguePanel) and every bucket assignment update immediately.
 */
import { useEffect, useId, useState } from "react";
import { Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_THRESHOLDS,
  resetThresholds,
  setThreshold,
  useBucketThresholds,
  type BucketThresholds,
} from "@/creative-report/lib/thresholds";

interface Field {
  key: keyof BucketThresholds;
  label: string;
  suffix?: string;
  step?: number;
  min?: number;
}

const FIELDS: Field[] = [
  { key: "winnerRoas", label: "Winner ROAS ≥", step: 0.1, min: 0 },
  // Scaling reuses this same spend floor (see bucketRuleText) — labeled so
  // editing it doesn't silently change Scaling with no visible cue.
  { key: "winnerSpend", label: "Winner + Scaling spend ≥", suffix: "$", min: 0 },
  { key: "scalingRoas", label: "Scaling ROAS ≥", step: 0.1, min: 0 },
  { key: "scalingTrendPct", label: "Scaling spend trend ≥", suffix: "%", min: 0 },
  { key: "loserRoas", label: "Loser ROAS <", step: 0.1, min: 0 },
  { key: "loserSpend", label: "Loser spend ≥", suffix: "$", min: 0 },
  { key: "fatigueCtrDropPct", label: "Fatigue CTR drop ≥", suffix: "%", min: 0 },
  { key: "fatigueFreq", label: "Fatigue frequency >", min: 0 },
  { key: "fatigueMinSpend", label: "Fatigue min spend", suffix: "$", min: 0 },
  { key: "newAgeDays", label: "\"New\" age ≤", suffix: "d", min: 0 },
];

/**
 * A number input needs its OWN local string state — a controlled input bound
 * directly to a numeric store value can never show an empty field (React
 * snaps it back on every render), and `Number("") === 0` would otherwise
 * commit a corrupting 0 to the rule the moment the buyer clears the field to
 * retype it. Local text is authoritative for display; the store only ever
 * receives a value once it's a real, finite, non-negative number.
 */
function ThresholdField({ field, value }: { field: Field; value: number }) {
  const idPrefix = useId();
  const inputId = `${idPrefix}-${field.key}`;
  const [text, setText] = useState(String(value));

  // Stay in sync when the value changes from OUTSIDE this field (Reset, or
  // another tab via the store's storage-event sync) — not on every keystroke.
  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={inputId} className="text-[11px] text-muted-foreground">
        {field.label}
      </Label>
      <Input
        id={inputId}
        type="number"
        step={field.step ?? 1}
        min={field.min ?? 0}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          if (raw.trim() === "") return; // don't persist a transiently-empty field
          const v = Number(raw);
          if (Number.isFinite(v) && v >= (field.min ?? 0)) setThreshold(field.key, v);
        }}
        onBlur={() => {
          // Leaving the field empty or invalid reverts to the last committed value.
          const v = Number(text);
          if (text.trim() === "" || !Number.isFinite(v) || v < (field.min ?? 0)) {
            setText(String(value));
          }
        }}
        className="h-8 text-[13px]"
      />
    </div>
  );
}

export function ThresholdSettings() {
  const thresholds = useBucketThresholds();
  const isDefault = FIELDS.every((f) => thresholds[f.key] === DEFAULT_THRESHOLDS[f.key]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground">
          <Settings2 className="h-3.5 w-3.5" />
          Edit formulas
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Bucket &amp; fatigue formulas</p>
            <p className="text-xs text-muted-foreground">
              These are the exact numbers the rules use — no hidden score.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={resetThresholds}
            disabled={isDefault}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {FIELDS.map((f) => (
            <ThresholdField key={f.key} field={f} value={thresholds[f.key]} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
