import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EllipsisAction } from "../../types/output";

const ITEMS: Array<{ action: EllipsisAction; label: string; group?: number }> = [
  { action: "edit", label: "Edit", group: 1 },
  { action: "forge10more", label: "Forge 10 more like this", group: 1 },
  { action: "regenerate", label: "Regenerate", group: 1 },
  { action: "addFeedback", label: "Add feedback", group: 2 },
  { action: "addToFolder", label: "Add to folder", group: 2 },
  { action: "saveAsConcept", label: "Save as Concept", group: 3 },
  { action: "saveAsTemplate", label: "Save as Template", group: 3 },
  { action: "saveTextOnly", label: "Save text-only to Library", group: 3 },
  { action: "saveMediaOnly", label: "Save media-only to Library", group: 3 },
  { action: "downloadMediaOnly", label: "Download media only", group: 4 },
];

export function EllipsisMenu({
  onAction,
}: {
  onAction?: (action: EllipsisAction) => void;
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
          return (
            <div key={item.action}>
              {showSep && <DropdownMenuSeparator className="bg-g6-border-secondary" />}
              <DropdownMenuItem
                onSelect={() => onAction?.(item.action)}
                className="font-g6-sans text-g6-base text-g6-text focus:bg-g6-primary-bg focus:text-g6-text"
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
