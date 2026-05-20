import { cn } from "@/lib/utils";

export type QueueVariant = "v1" | "v2" | "v3";

interface VariantToggleProps {
  active: QueueVariant;
  /** Direct-jump handler — passes the target variant the user clicked. */
  onSwitch: (next: QueueVariant) => void;
}

/**
 * VariantToggle — pill switch between V1 (dense strip), V2 (centered strip),
 * and V3 (Finder split-pane) queue layouts. Caller controls visibility —
 * render ONLY in dev (`import.meta.env.DEV`) so production users never see
 * the indecision.
 *
 * Direct-jump: each tab calls `onSwitch(target)`, so users can jump v1↔v3
 * without mashing through v2. Click on the active tab is a no-op.
 */
export function VariantToggle({ active, onSwitch }: VariantToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Queue layout variant"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
    >
      <VariantTab label="V1 · Dense" target="v1" active={active} onSwitch={onSwitch} />
      <VariantTab label="V2 · Centered" target="v2" active={active} onSwitch={onSwitch} />
      <VariantTab label="V3 · Finder" target="v3" active={active} onSwitch={onSwitch} />
    </div>
  );
}

function VariantTab({
  label,
  target,
  active,
  onSwitch,
}: {
  label: string;
  target: QueueVariant;
  active: QueueVariant;
  onSwitch: (next: QueueVariant) => void;
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
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
