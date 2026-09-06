import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { EllipsisAction } from "../../types/output";

/**
 * ITEMS — Genie 2.0 §21.2 additions:
 *   - "Vary script" / "Vary concept" / "Vary whole video" — the exact
 *     wording Video Sage's flow vocabulary uses (flowTypes.ts FlowActionId),
 *     so "same wording, same behaviour" holds across Results / Library / Ad
 *     detail. Grouped with the other regeneration actions (group 1).
 *   - "Reference for a new ad" and "Send to Other Apps" — §7.6 / §6 Rule 6.
 *
 * REMOVED from the original 11 (RECON found all 11 unwired) — not carried
 * forward here because nothing in this codebase can honestly back them:
 *   - "Add feedback" — no feedback-capture surface (rating, comment, or
 *     coach-signal store) exists anywhere in genie6 to attach this to.
 *   - "Add to folder" — the "Folders" Other-Flow module is explicit
 *     Coming-soon (§7 table), and Genie's own Library has no folder concept
 *     of its own (only the separate Creative Library module has folders).
 *     Wiring this to nothing would be exactly the silent no-op the brief
 *     said to remove instead of ship.
 */
const ITEMS: Array<{ action: EllipsisAction; label: string; group?: number }> = [
  { action: "edit", label: "Edit", group: 1 },
  { action: "regenerate", label: "Regenerate", group: 1 },
  { action: "forgeMore", label: "Forge more like this", group: 1 },
  { action: "varyScript", label: "Vary script", group: 1 },
  { action: "varyConcept", label: "Vary concept", group: 1 },
  { action: "varyWholeVideo", label: "Vary whole video", group: 1 },
  { action: "referenceForNewAd", label: "Reference for a new ad", group: 2 },
  { action: "saveAsConcept", label: "Save as Concept", group: 3 },
  { action: "saveAsTemplate", label: "Save as Template", group: 3 },
  { action: "saveTextOnly", label: "Save text-only to Library", group: 3 },
  { action: "saveMediaOnly", label: "Save media-only to Library", group: 3 },
  { action: "saveToKb", label: "Save to Knowledge Base", group: 3 },
  { action: "downloadMediaOnly", label: "Download media only", group: 4 },
  { action: "sendToOtherApps", label: "Send to Other Apps", group: 4 },
];

export function EllipsisMenu({
  onAction,
  disabled,
}: {
  onAction?: (action: EllipsisAction) => void;
  /** Actions this card can't honestly perform right now — greyed out and
   *  inert rather than a silent no-op (e.g. no media to download). */
  disabled?: EllipsisAction[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More actions"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-g6-base text-g6-text-secondary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="g6-root w-56 border-g6-border bg-g6-bg-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {ITEMS.map((item, i) => {
          const prev = ITEMS[i - 1];
          const showSep = prev && prev.group !== item.group;
          const isDisabled = disabled?.includes(item.action) ?? false;
          return (
            <div key={item.action}>
              {showSep && <DropdownMenuSeparator className="bg-g6-border-secondary" />}
              <DropdownMenuItem
                disabled={isDisabled}
                onSelect={() => {
                  if (isDisabled) return;
                  onAction?.(item.action);
                }}
                className={cn(
                  "font-g6-sans text-g6-base text-g6-text focus:bg-g6-primary-bg focus:text-g6-text",
                  isDisabled && "opacity-40",
                )}
              >
                {item.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
