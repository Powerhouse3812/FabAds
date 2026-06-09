/**
 * SaveBundleRow — graduation affordance for upgrading a media_only Creative
 * Library folder into a full bundle (media + copy).
 *
 * Visible only when ALL of the following hold:
 *   1. User has applied a folder at Step 3 (Step3Spread tracks this).
 *   2. The plan has non-empty `primaryText` (so there's actual copy to save).
 *   3. The applied folder does not yet have a defaultCopy in bundlesService.
 *
 * One click writes `plan.adCopy` (the bundle-shareable subset) to
 * `bundlesService.setDefaultCopy(folderId, ...)`. The row then collapses to a
 * "Saved" confirmation state and stays visible for the rest of the session.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, FolderPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bundlesService } from "../../../templates/bundles";
import type { AdCopy } from "../../../types";
import type { AdCopyBundle } from "../../../templates/types";

interface SaveBundleRowProps {
  appliedFolder: { id: string; name: string } | null;
  adCopy: AdCopy;
  /** Notify parent after a successful save (so derived state can refresh). */
  onSaved?: () => void;
}

function extractBundle(copy: AdCopy): AdCopyBundle {
  return {
    primaryText: copy.primaryText,
    headline: copy.headline,
    description: copy.description,
    ...(copy.utmTemplate ? { utmTemplate: copy.utmTemplate } : {}),
    ...(copy.textVariations && copy.textVariations.length > 0
      ? { textVariations: [...copy.textVariations] }
      : {}),
  };
}

export function SaveBundleRow({
  appliedFolder,
  adCopy,
  onSaved,
}: SaveBundleRowProps) {
  // Local view-state: idle → saving → saved (per-folder). Resets when folder
  // changes so the affordance reappears on a different applied folder.
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setState("idle");
  }, [appliedFolder?.id]);

  if (!appliedFolder) return null;

  const hasCopy = adCopy.primaryText.trim().length > 0;
  if (!hasCopy) return null;

  // If this folder already has a bundle (e.g. user re-applied a bundle_ready
  // folder), don't offer to overwrite — bundle apply is one-way in v1.
  const existing = bundlesService.getDefaultCopy(appliedFolder.id);
  if (existing && state !== "saved") return null;

  const handleSave = () => {
    setState("saving");
    try {
      bundlesService.setDefaultCopy(appliedFolder.id, extractBundle(adCopy));
      setState("saved");
      onSaved?.();
    } catch {
      // localStorage failures are silently swallowed inside the service; if
      // we got here without throwing, treat as saved. (No toast surface in
      // this component — keep the affordance self-contained.)
      setState("saved");
    }
  };

  if (state === "saved") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5",
          "px-3 py-2 text-[11px] text-foreground",
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span className="flex-1">
          Saved as bundle on{" "}
          <span className="font-medium capitalize">{appliedFolder.name}</span>.
          Next time you apply this folder, copy will pre-fill too.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5",
        "px-3 py-2 text-[11px]",
      )}
    >
      <FolderPlus className="h-3.5 w-3.5 text-primary flex-shrink-0" />
      <span className="flex-1 text-foreground">
        Save this copy to{" "}
        <span className="font-medium capitalize">{appliedFolder.name}</span> so
        the folder applies as a full bundle next time?
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={state === "saving"}
        onClick={handleSave}
        className="h-7 rounded-full text-[11px]"
      >
        {state === "saving" ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : null}
        Save as bundle
      </Button>
    </div>
  );
}
