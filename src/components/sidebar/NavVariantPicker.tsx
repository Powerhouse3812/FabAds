import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useFabAdsNavVariant,
  VARIANT_CYCLE,
  VARIANT_META,
  type FabAdsNavVariant,
} from "@/components/sidebar/useFabAdsNavVariant";

/**
 * Variant picker — opens via Shift+Click on the FabAds logo (regular click
 * cycles instead). Lists all variants with their index, label, and one-line
 * hint. Active variant marked with a check + lime tint.
 *
 * Dev-tool only — visible to Maalik for A/B comparison; users don't discover
 * this surface.
 */
export function NavVariantPicker({
  open,
  onOpenChange,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}) {
  const { variant, setVariant } = useFabAdsNavVariant();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-64 p-1.5">
        {/* Header — spacing-only separation (no border, per crit P2#7) */}
        <div className="px-2 py-1.5 mb-1.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Nav variants · dev tool
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click logo to cycle · Shift+Click to pick
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          {VARIANT_CYCLE.map((key) => {
            const meta = VARIANT_META[key];
            const active = variant === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setVariant(key as FabAdsNavVariant);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-md transition-colors flex items-center gap-2.5",
                  active
                    ? "bg-g6-primary/10 text-g6-primary-active"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    active ? "bg-g6-primary text-g6-text-on-accent" : "bg-muted text-muted-foreground"
                  )}
                >
                  {meta.index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{meta.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{meta.hint}</p>
                </div>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-g6-primary-active" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
