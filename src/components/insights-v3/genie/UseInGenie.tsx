/**
 * OWNER: agent E (Phase 2). Contract:
 *   UseInGenie({ target, action?, label?, variant? })
 *     target  — SavedItemRef (ad | framework | hook | angle | concept)
 *     action  — optional flow action override, e.g. "generate-variation" for
 *               the drawer's "Create Variations"; default derives from type
 *     variant — "button" (default) | "icon" | "menu-item"
 * Renders nothing for types where ELEMENT_ACTIONS[type].useInGenie is false.
 * Stub until then: a disabled button so layouts are final.
 */
import { Sparkles } from "lucide-react";
import { ELEMENT_ACTIONS, type SavedItemRef } from "@/lib/insights-v3/types";

export interface UseInGenieProps {
  target: SavedItemRef;
  action?: string;
  label?: string;
  variant?: "button" | "icon" | "menu-item";
  className?: string;
}

export function UseInGenie({ target, label = "Use in Genie", variant = "button", className }: UseInGenieProps) {
  if (!ELEMENT_ACTIONS[target.type].useInGenie) return null;
  return (
    <button type="button" disabled aria-label={label} className={className}>
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      {variant !== "icon" && <span>{label}</span>}
    </button>
  );
}
