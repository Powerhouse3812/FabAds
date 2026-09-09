import { cn } from "@/lib/utils";
import type { StudioHomeDirection } from "../state/useStudioHomeDirection";

interface StudioHomeDirectionToggleProps {
  active: StudioHomeDirection;
  onSwitch: (next: StudioHomeDirection) => void;
}

/**
 * StudioHomeDirectionToggle — pill switch between the two Studio-home
 * layout directions (Maalik, 2026-09-10): "Tone Grid" (today's grid,
 * tone-washed) vs "Flagship Split" (Ad collapses to one panel, Trending
 * gets its own dashed shelf). Visual recipe copied from `VariantToggle`
 * (Queue's v1/v2/v3 switch) — same pill/tab shape, same active-state
 * treatment — but deliberately NOT dev-gated: Maalik asked to see both
 * live on the deployed app.
 */
export function StudioHomeDirectionToggle({
  active,
  onSwitch,
}: StudioHomeDirectionToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Studio home direction"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
    >
      <DirectionTab label="Tone Grid" target="toneGrid" active={active} onSwitch={onSwitch} />
      <DirectionTab label="Flagship Split" target="flagshipSplit" active={active} onSwitch={onSwitch} />
    </div>
  );
}

function DirectionTab({
  label,
  target,
  active,
  onSwitch,
}: {
  label: string;
  target: StudioHomeDirection;
  active: StudioHomeDirection;
  onSwitch: (next: StudioHomeDirection) => void;
}) {
  const isActive = active === target;
  return (
    <button
      type="button"
      onClick={() => {
        if (!isActive) onSwitch(target);
      }}
      aria-pressed={isActive}
      className={cn(
        "fab-focus inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
