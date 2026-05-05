import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_V3_ICONS } from "./icons";
import type { CategoryId, SubModeDescriptor } from "../types";

/**
 * SubModeCard — large card with preview imagery, used in Variant 2 (the
 * stacked horizontal-rows layout on Studio v3 Landing).
 *
 * A-11.15: per Maalik, every sub-mode in V2 shows a preview of what the
 * generated output will look like — so the user knows "kya bn ne wala hai"
 * before clicking. Real Unsplash creative imagery for now (`previewUrl` on
 * SubModeDescriptor); real generated samples land later.
 *
 * Visual: card with preview image on top (4:3 aspect), icon-disc + label +
 * description below. Hover lifts. Used for Brand / Ad / Quick mode cards
 * in V2.
 */

export interface SubModeCardProps {
  /**
   * Where this sub-mode lives. For top-level sub-modes (Brand-focused etc),
   * pass categoryId. For Quick modes, pass "quick" — the tile routes to
   * `/generate-v3/quick/{id}`.
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
        "group relative flex shrink-0 flex-col items-stretch overflow-hidden rounded-xl border border-border bg-card text-left transition-all",
        "w-[220px]",
        !disabled && [
          "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ],
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Preview thumbnail */}
      <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
        {subMode.previewUrl ? (
          <img
            src={subMode.previewUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        {/* Bottom-left icon disc — small visual identity per sub-mode */}
        <div className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-md bg-card/95 ring-1 ring-border/40 shadow-sm backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5 text-foreground" />
        </div>
      </div>

      {/* Body */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-medium text-foreground">
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
