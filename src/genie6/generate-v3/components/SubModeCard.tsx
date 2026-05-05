import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_V3_ICONS } from "./icons";
import { SubModePreview } from "./SubModePreview";
import type { CategoryId, SubModeDescriptor } from "../types";

/**
 * SubModeCard — large card used in V2 (horizontal stacked-rows layout).
 *
 * A-11.17 redesign per Maalik feedback ("real images ki wjh se ab bohot
 * bekar sa lg rha hai, Templates jaisa dikh rha hai"):
 *   - Dropped Unsplash photos.
 *   - Now uses SubModePreview — distinct mockup-style preview per
 *     sub-mode (gradient + bold typography + frame element + lime
 *     accents). AI-tool aesthetic, not stock-photo aesthetic.
 *   - Each card has its own visual identity now (type-led / phone-frame /
 *     stat / grid / tool variants).
 */

export interface SubModeCardProps {
  /**
   * Where this sub-mode lives. For top-level sub-modes (Brand-focused etc),
   * pass categoryId. For Quick modes, pass "quick".
   */
  categoryId: CategoryId | "quick";
  subMode: SubModeDescriptor;
}

export function SubModeCard({ categoryId, subMode }: SubModeCardProps) {
  const navigate = useNavigate();
  const Icon = STUDIO_V3_ICONS[subMode.icon] ?? Sparkles;
  const disabled = subMode.status === "coming-soon";

  const onClick = () => {
    if (disabled) return;
    if (categoryId === "quick") {
      navigate(`/iq/genie6/generate-v3/quick/${subMode.id}`);
    } else {
      navigate(`/iq/genie6/generate-v3/${categoryId}/${subMode.id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${subMode.label} — ${subMode.description}`}
      title={subMode.description}
      className={cn(
        "group relative flex shrink-0 flex-col items-stretch overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-300",
        "w-[230px]",
        !disabled && [
          "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ],
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Distinctive mockup preview — per-sub-mode visual identity */}
      <div className="relative">
        <SubModePreview subModeId={subMode.id} />
        {/* Bottom-left icon disc — small visual anchor matching the descriptor */}
        <div className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-md bg-card/95 ring-1 ring-border/40 shadow-sm backdrop-blur-sm transition-transform group-hover:scale-110">
          <Icon className="h-3.5 w-3.5 text-foreground" />
        </div>
      </div>

      {/* Body */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {subMode.label}
          </p>
          <p className="line-clamp-2 text-[11px] text-muted-foreground leading-snug">
            {subMode.description}
          </p>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </button>
  );
}
