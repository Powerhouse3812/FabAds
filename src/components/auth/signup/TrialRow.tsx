import { cn } from "@/lib/utils";
import { RadioDot } from "@/components/auth/signup/RadioDot";
import { TRIAL_PLAN } from "@/components/auth/signup/plans";

/**
 * TrialRow — the "Free 90 days Trial" option (Figma 10421:46713 / 10597:
 * 46882, node 10421:47319 "Collapse Head") rendered as a 4th, non-expanding
 * selectable row above the paid plans, per the task brief. Unlike PlanCard
 * it has no accordion — the Figma source never shows it expanded.
 */
export function TrialRow({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "fab-focus flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-4 py-3 transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <RadioDot selected={selected} />
        <span className="text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
      </div>
      <span className="whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
        {TRIAL_PLAN.chip}
      </span>
    </div>
  );
}
