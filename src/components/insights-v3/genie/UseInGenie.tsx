/**
 * OWNER: agent E. Contract:
 *   UseInGenie({ target, action?, label?, variant?, className? })
 *     target  — SavedItemRef (ad | framework | hook | angle | concept)
 *     action  — optional flow action override, e.g. "generate-variation" for
 *               the drawer's "Create Variations"; default derives from type
 *     variant — "button" (default) | "icon" | "menu-item"
 * Renders nothing for types where ELEMENT_ACTIONS[type].useInGenie is false.
 *
 * Ads go to Genie as themselves; an element goes as its top example ad in the
 * current scope, with the element value carried (see genieHandoff.ts). When no
 * hand-off is possible the control stays visible but disabled, with the reason
 * in a tooltip — the layout never changes.
 */
import { useMemo, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ELEMENT_ACTIONS, SAVABLE_LABEL, type SavedItemRef } from "@/lib/insights-v3/types";
import { useUserPrefs } from "@/lib/insights-v3/stores";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Hint } from "@/components/insights-v3/shared/Hint";
import { readScopeFromParams } from "@/components/insights-v3/shared/url";
import { cn } from "@/lib/utils";
import { buildGenieHandoff } from "./genieHandoff";

export interface UseInGenieProps {
  target: SavedItemRef;
  action?: string;
  label?: string;
  variant?: "button" | "icon" | "menu-item";
  className?: string;
}

export function UseInGenie({ target, action, label = "Use in Genie", variant = "button", className }: UseInGenieProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefs = useUserPrefs();
  // Read-only scope read: useInsightsScope() also restores/writes the scope,
  // which a button rendered once per row must not do.
  const scopeKey = [searchParams.get("industry"), searchParams.get("category"), searchParams.get("period"), searchParams.get("mine")].join("|");
  const scope = useMemo(() => readScopeFromParams(searchParams), [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const allowed = ELEMENT_ACTIONS[target.type]?.useInGenie ?? false;

  const { type, id } = target;
  const handoff = useMemo(
    () => (allowed ? buildGenieHandoff({ type, id }, { action, scope, prefs }) : null),
    [allowed, type, id, action, scope, prefs],
  );

  if (!allowed || !handoff) return null;

  const what = SAVABLE_LABEL[target.type].toLowerCase();
  const disabledReason = "reason" in handoff ? handoff.reason : undefined;
  const ariaLabel = `${label}: send this ${what} to Genie`;
  const go = () => {
    if ("path" in handoff) navigate(handoff.path);
  };
  const onClick = (e: MouseEvent) => {
    e.stopPropagation(); // lives inside clickable cards / rows
    go();
  };

  if (variant === "menu-item") {
    return (
      <DropdownMenuItem
        disabled={!handoff.ok}
        onSelect={go}
        title={disabledReason}
        className={cn("flex items-center gap-2", className)}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {disabledReason && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Unavailable</span>
        )}
      </DropdownMenuItem>
    );
  }

  if (variant === "icon") {
    return (
      <Hint content={disabledReason ?? label}>
        {/* span wrapper: a disabled button fires no pointer events, so the tooltip needs a live host */}
        <span className="inline-flex" tabIndex={handoff.ok ? undefined : 0}>
          <button
            type="button"
            aria-label={ariaLabel}
            disabled={!handoff.ok}
            onClick={onClick}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary-text transition-colors",
              "hover:border-primary/50 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
              className,
            )}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      </Hint>
    );
  }

  return (
    <Hint content={disabledReason}>
      <span className="inline-flex" tabIndex={handoff.ok ? undefined : 0}>
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={!handoff.ok}
          onClick={onClick}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors",
            "hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
            className,
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </button>
      </span>
    </Hint>
  );
}
