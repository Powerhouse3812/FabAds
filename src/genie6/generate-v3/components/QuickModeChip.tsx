import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_V3_ICONS } from "./icons";
import type { SubModeDescriptor } from "../types";

/**
 * QuickModeChip — smaller, denser tile for the Quick modes row.
 *
 * Sits below the 3 main category cards. Less visual weight than
 * SubModeTile so it doesn't compete with the primary categories.
 *
 * Click → routes to `/iq/genie6/generate-v3/quick/:quickModeId` (stub
 * placeholder until the corresponding form ships).
 */

export interface QuickModeChipProps {
  quickMode: SubModeDescriptor;
}

export function QuickModeChip({ quickMode }: QuickModeChipProps) {
  const navigate = useNavigate();
  const Icon = STUDIO_V3_ICONS[quickMode.icon] ?? Sparkles;

  return (
    <button
      type="button"
      onClick={() => navigate(`/iq/genie6/generate-v3/quick/${quickMode.id}`)}
      aria-label={`${quickMode.label} — ${quickMode.description}`}
      title={quickMode.description}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left transition-all",
        "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-foreground transition-transform group-hover:scale-110">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-foreground">
          {quickMode.label}
        </span>
        <span className="block text-[10px] text-muted-foreground">
          {quickMode.description}
        </span>
      </span>
    </button>
  );
}
