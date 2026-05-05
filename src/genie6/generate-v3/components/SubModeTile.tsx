import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_V3_ICONS } from "./icons";
import type { CategoryId, SubModeDescriptor } from "../types";

/**
 * SubModeTile — small button-tile inside a CategoryCard.
 *
 * Maalik's spec (A-11.14): sub-modes are always visible inline inside the
 * parent category card. One click on a tile = direct route to the sub-mode
 * form (or a placeholder stub until forms ship one-by-one).
 *
 * Visual: row layout — icon on left, label + description on the right,
 * chevron on far right. Hover lifts the tile, tints the chevron lime.
 */

export interface SubModeTileProps {
  categoryId: CategoryId;
  subMode: SubModeDescriptor;
}

export function SubModeTile({ categoryId, subMode }: SubModeTileProps) {
  const navigate = useNavigate();
  const Icon = STUDIO_V3_ICONS[subMode.icon] ?? Sparkles;
  const disabled = subMode.status === "coming-soon";

  const onClick = () => {
    if (disabled) return;
    navigate(`/iq/genie6/generate-v3/${categoryId}/${subMode.id}`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${subMode.label} — ${subMode.description}`}
      title={subMode.description}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-border bg-card/80 px-3 py-2.5 text-left transition-all backdrop-blur-sm",
        !disabled && [
          "hover:border-primary/40 hover:bg-card hover:-translate-y-0.5 hover:shadow-md",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ],
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card ring-1 ring-border/60 transition-transform group-hover:scale-110">
        <Icon className="h-3.5 w-3.5 text-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {subMode.label}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {subMode.description}
        </span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
    </button>
  );
}
