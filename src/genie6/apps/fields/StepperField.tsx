import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppField } from "../appTypes";

type StepperFieldSpec = Extract<AppField, { kind: "stepper" }>;

interface StepperFieldProps {
  field: StepperFieldSpec;
  value: number | undefined;
  onChange: (value: number) => void;
}

/**
 * Quantity stepper — the output count for the two apps that price per unit of
 * OUTPUT rather than per unit of input: Avatar Shots ("9 credits / shot") and
 * Product Placement ("16 credits / scene"), per §8's cost table.
 *
 * WHY A STEPPER AND NOT A TEXT INPUT
 * Studio's own output count uses a `− 4 +` stepper (§5), and §5 is explicit
 * that "output count always uses this stepper" — so a second, different
 * quantity control on the Apps surface would be the same decision made twice.
 * The shape here matches Studio's NumberStepper deliberately.
 *
 * The value drives `previewCost()` (it reads `values.count`), so every press
 * moves the figure quoted under the primary action. That is the point: the
 * cost is stated ON the action (§15), so the control that changes the cost has
 * to sit in the same form.
 */
export function StepperField({ field, value, onChange }: StepperFieldProps) {
  const current = value ?? field.min;

  // Write the default into form state on mount. Without this, `values[id]`
  // stays undefined until the user touches the control, so previewCost() and
  // the submit payload would both be reasoning about an implied number while
  // the screen displays a real one. Cheap, and it keeps the quoted cost and
  // the charged cost derived from the same value.
  useEffect(() => {
    if (value === undefined) onChange(field.min);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [singular, plural] = field.unitNoun;
  const canDec = current > field.min;
  const canInc = current < field.max;

  const clamp = (n: number) => Math.min(field.max, Math.max(field.min, n));

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => onChange(clamp(current - 1))}
          disabled={!canDec}
          aria-label={`Decrease ${plural}`}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            canDec
              ? "text-foreground hover:bg-foreground/[0.08]"
              : "cursor-not-allowed text-muted-foreground/40",
          )}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Mono + tabular-nums: it's a number, and it must not jitter as the
            digit count changes (DS §1 typography rules). */}
        <span
          role="status"
          aria-live="polite"
          aria-label={`${current} ${current === 1 ? singular : plural}`}
          className="min-w-8 text-center font-mono text-[13px] font-semibold tabular-nums text-foreground"
        >
          {current}
        </span>

        <button
          type="button"
          onClick={() => onChange(clamp(current + 1))}
          disabled={!canInc}
          aria-label={`Increase ${plural}`}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            canInc
              ? "text-foreground hover:bg-foreground/[0.08]"
              : "cursor-not-allowed text-muted-foreground/40",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="font-mono text-[11px] text-muted-foreground">
        {current === 1 ? singular : plural}
        {!canInc && ` · max ${field.max}`}
      </span>
    </div>
  );
}
