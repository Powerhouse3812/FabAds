import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUB_MODE_PROFILES, type SubMode } from "../types";

/**
 * SubModeChipRow — horizontal chip row for picking a sub-mode.
 *
 * Order is intentional, with two divider gaps:
 *   custom | product-shoot, product-focused, brand-focused
 *          | ugc-video, variations, image-to-ad
 *          | bg-remover, bg-swap, refresh-winner
 *
 * Used at the top of both Wizard and Flow shells. Hover tooltip uses
 * native `title` so we don't need a portal/popover for this density.
 */

export interface SubModeChipRowProps {
  value: SubMode;
  onChange: (next: SubMode) => void;
  className?: string;
}

interface ChipGroup {
  ids: SubMode[];
}

const GROUPS: ChipGroup[] = [
  { ids: ["custom"] },
  { ids: ["product-shoot", "product-focused", "brand-focused"] },
  { ids: ["ugc-video", "variations", "image-to-ad"] },
  { ids: ["bg-remover", "bg-swap", "refresh-winner"] },
];

export function SubModeChipRow({
  value,
  onChange,
  className,
}: SubModeChipRowProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Sub-mode"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {GROUPS.map((group, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5">
          {i > 0 && (
            <span
              aria-hidden="true"
              className="mx-1 h-4 w-px shrink-0 bg-border"
            />
          )}
          {group.ids.map((id) => {
            const profile = SUB_MODE_PROFILES[id];
            const active = value === id;
            const isCustom = id === "custom";
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                title={profile.description}
                onClick={() => onChange(id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  active
                    ? isCustom
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-transparent text-foreground hover:border-primary/40",
                )}
              >
                {isCustom && <Sparkles className="h-3 w-3" />}
                {profile.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
