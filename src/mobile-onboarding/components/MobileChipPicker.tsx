import { cn } from "@/lib/utils";

export interface MobileChipPickerProps {
  options: readonly string[];
  /** Currently selected values. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Accessible group name, e.g. "Industries". */
  ariaLabel: string;
}

/**
 * Multi-select chip grid — the mobile cut of the chip rows in
 * `InsightsQuickSetup.tsx` / `AffiliateInput.tsx` / the web Insights
 * `OnboardingModal.tsx`.
 *
 * The active/inactive treatment is the product's existing chip pattern
 * (`bg-primary/20 border-primary/50 font-semibold` vs
 * `bg-card border-border text-muted-foreground`). What changes for mobile is
 * SIZE only: web renders these as `<Badge>` (~22px tall), which is well
 * under the 44px touch minimum, so each chip here is a real button at
 * `min-h-11`. Same paint, thumb-sized.
 *
 * `aria-pressed` carries the state, so selection is announced rather than
 * inferred from the fill.
 */
export function MobileChipPicker({
  options,
  value,
  onChange,
  ariaLabel,
}: MobileChipPickerProps) {
  const toggle = (item: string) => {
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item],
    );
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={active}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-[13px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary/50 bg-primary/20 font-semibold text-foreground"
                : "border-border bg-card text-muted-foreground active:bg-muted",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
