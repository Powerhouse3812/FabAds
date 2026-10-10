import type { ReactNode } from "react";
import { ELEMENT_ACTIONS, SAVABLE_LABEL, type DownloadFile, type SavedItemRef } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { DownloadButton } from "./DownloadButton";
import { SaveButton } from "./SaveButton";

export interface ElementActionsProps {
  target: SavedItemRef;
  savedCount?: number;
  /** `buildDownload(ref)` from the data layer, bound to `target`. */
  buildDownload?: () => DownloadFile;
  /** Rendered only when ELEMENT_ACTIONS[type].useInGenie. */
  genieSlot?: ReactNode;
  className?: string;
}

/** Save + Download (every type) and the Genie slot (only types that have a matching Genie flow). */
export function ElementActions({ target, savedCount, buildDownload, genieSlot, className }: ElementActionsProps) {
  const actions = ELEMENT_ACTIONS[target.type];
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {actions.save && <SaveButton target={target} savedCount={savedCount} variant="icon" />}
      {actions.download && (
        <DownloadButton
          build={buildDownload ?? (() => { throw new Error("no download builder"); })}
          disabled={!buildDownload}
          disabledReason="Download isn't available for this item yet."
          ariaLabel={`Download this ${SAVABLE_LABEL[target.type].toLowerCase()}`}
          variant="icon"
        />
      )}
      {actions.useInGenie && genieSlot}
    </div>
  );
}
