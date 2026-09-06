import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { EllipsisAction, OutputData } from "../types/output";
import type { OutputCardProps } from "../components/OutputCard";
import {
  canDownloadMedia,
  cloneMediaOnly,
  cloneTextOnly,
  downloadOutputMedia,
  kbCapForOutput,
  referenceForNewAdUrl,
  startRegenerate,
  varyActionUrl,
} from "./outputActions";
import { addLocalOutput, isSaved, toggleSaved, useLibraryActionsState } from "./libraryActionsStore";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

/**
 * useOutputCardActions — the ONE place that turns an `OutputData` into the
 * handler set an `<OutputCard>` needs. `MasonryView`, `GroupByAngleView` /
 * `AngleRow`, and the new `BatchGroupedView` all call `getActions(output)`
 * from here, so "same wording, same behaviour, same result in all three"
 * (§21.2) is structural, not a convention three files have to remember.
 *
 * Every action either does something REAL (starts an actual batch via
 * genieRunStore, triggers an actual file download, actually navigates into
 * a Studio flow with real URL params, actually adds a card to the Library)
 * or is listed as disabled/removed — see the report for which of the
 * original 11 ellipsis actions were dropped and why.
 */

export type GetOutputCardActions = (output: OutputData) => Partial<OutputCardProps>;

interface LaunchRequest {
  count: number;
  onConfirm: () => void;
}

export interface UseOutputCardActionsResult {
  getActions: GetOutputCardActions;
  /** Mount once per page (GeneratedOutputsTab does this). Hosts the shared
   *  Launch confirmation — single card AND bulk share one dialog instance. */
  confirmDialog: JSX.Element;
  requestLaunch: (count: number, onConfirm: () => void) => void;
  regenerateSelection: (outputs: OutputData[]) => void;
  downloadSelection: (outputs: OutputData[]) => void;
}

export function useOutputCardActions(): UseOutputCardActionsResult {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  // Subscribed only so this component re-renders (and re-derives getActions'
  // per-card output) whenever a bookmark/save flag flips.
  useLibraryActionsState();
  const [launchRequest, setLaunchRequest] = useState<LaunchRequest | null>(null);

  const goToBatchView = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("view", "batch");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const requestLaunch = useCallback((count: number, onConfirm: () => void) => {
    setLaunchRequest({ count, onConfirm });
  }, []);

  const regenerateOne = useCallback(
    (output: OutputData, count: number) => {
      startRegenerate(output, { count });
      toast.success(
        count > 1 ? `Forging ${count} more like this — check Library` : "Regenerating — check Library",
      );
      goToBatchView();
    },
    [goToBatchView],
  );

  const regenerateSelection = useCallback(
    (outputs: OutputData[]) => {
      if (outputs.length === 0) return;
      const [first] = outputs;
      startRegenerate(first, {
        count: outputs.length,
        label: `Bulk regenerate · ${outputs.length} items`,
      });
      toast.success(`Regenerating ${outputs.length} items — check Library`);
      goToBatchView();
    },
    [goToBatchView],
  );

  const downloadSelection = useCallback((outputs: OutputData[]) => {
    const downloadable = outputs.filter(canDownloadMedia);
    if (downloadable.length === 0) {
      toast.error("Nothing to download — no media on the selected items");
      return;
    }
    downloadable.forEach((o, i) => window.setTimeout(() => downloadOutputMedia(o), i * 150));
    toast.success(`Downloading ${downloadable.length} file${downloadable.length === 1 ? "" : "s"}`);
  }, []);

  const getActions = useCallback<GetOutputCardActions>(
    (output) => {
      const disabled: EllipsisAction[] = [];
      if (!canDownloadMedia(output)) disabled.push("downloadMediaOnly", "saveMediaOnly");
      if (!output.headline && !output.body) disabled.push("saveTextOnly");

      const onEllipsisAction = (action: EllipsisAction) => {
        switch (action) {
          case "edit":
            navigate(`/iq/genie6/editor/${output.id}`);
            return;
          case "forgeMore":
            // Hands off to Studio Configure as a variation (§21.2 "same
            // wording, same behaviour, same result" as the other variation
            // actions) so the stepper sets the count and the real credit
            // breakdown applies. Previously this fired a hardcoded 10-item
            // batch priced at a flat 4/item — §5 forbids both halves.
            navigate(varyActionUrl(output, "generate-variation"));
            return;
          case "regenerate":
            regenerateOne(output, 1);
            return;
          case "varyScript":
            navigate(varyActionUrl(output, "vary-script"));
            return;
          case "varyConcept":
            navigate(varyActionUrl(output, "vary-concept"));
            return;
          case "varyWholeVideo":
            navigate(varyActionUrl(output, "vary-whole-video"));
            return;
          case "referenceForNewAd":
            navigate(referenceForNewAdUrl(output));
            return;
          case "sendToOtherApps":
            navigate("/iq/genie6/apps");
            return;
          case "saveAsConcept": {
            const now = toggleSaved("concept", output.id);
            toast.success(now ? "Saved as concept" : "Removed from concepts");
            return;
          }
          case "saveAsTemplate": {
            const now = toggleSaved("template", output.id);
            toast.success(now ? "Saved as template" : "Removed from templates");
            return;
          }
          case "saveToKb": {
            if (isSaved("kb", output.id)) {
              toggleSaved("kb", output.id);
              toast.success("Removed from Knowledge Base");
              return;
            }
            const cap = kbCapForOutput(output);
            if (cap?.atCap) {
              toast.error(
                `Knowledge Base is full for ${output.brand?.name ?? "this brand"} (${cap.count}/${cap.max} winner ads)`,
              );
              return;
            }
            toggleSaved("kb", output.id);
            toast.success(cap ? `Saved to Knowledge Base (${cap.count + 1}/${cap.max})` : "Saved to Knowledge Base");
            return;
          }
          case "saveTextOnly": {
            if (!output.headline && !output.body) {
              toast.error("Nothing to save — this output has no copy");
              return;
            }
            addLocalOutput(cloneTextOnly(output));
            toast.success("Text-only copy saved to Library");
            return;
          }
          case "saveMediaOnly": {
            if (!canDownloadMedia(output)) {
              toast.error("Nothing to save — this output has no media");
              return;
            }
            addLocalOutput(cloneMediaOnly(output));
            toast.success("Media-only copy saved to Library");
            return;
          }
          case "downloadMediaOnly": {
            if (!canDownloadMedia(output)) {
              toast.error("Nothing to download — this output has no media");
              return;
            }
            downloadOutputMedia(output);
            toast.success("Download started");
            return;
          }
          default:
            return;
        }
      };

      return {
        bookmarked: isSaved("bookmark", output.id),
        onSave: () => {
          const now = toggleSaved("bookmark", output.id);
          toast.success(now ? "Bookmarked" : "Bookmark removed");
        },
        onLaunch: () => {
          requestLaunch(1, () => toast.success("Queued for launch (demo — no real spend)"));
        },
        onRegenerate: () => regenerateOne(output, 1),
        onEllipsisAction,
        disabledEllipsisActions: disabled,
      };
    },
    [navigate, regenerateOne, requestLaunch],
  );

  const confirmDialog = (
    <ConfirmActionDialog
      open={launchRequest !== null}
      onOpenChange={(open) => {
        if (!open) setLaunchRequest(null);
      }}
      title={launchRequest && launchRequest.count > 1 ? `Launch ${launchRequest.count} ads?` : "Launch this ad?"}
      description="Demo only — no Meta account is connected, so nothing actually spends or delivers."
      confirmLabel="Launch"
      onConfirm={() => launchRequest?.onConfirm()}
    />
  );

  return { getActions, confirmDialog, requestLaunch, regenerateSelection, downloadSelection };
}
