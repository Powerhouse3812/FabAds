/**
 * Creative Report 2.0 — the actions hub.
 *
 * One provider owns the loop's exits so cards, the grid, and the drawer all
 * trigger identical behaviour and the confirm modals mount exactly once:
 *   • Generate variation → Genie   (navigate, carries concept/angle/hook)
 *   • Launch / Relaunch            (friction modal → optimistic "Queued")
 *   • Save to Library / Mark Winner (optimistic chip + toast)
 *   • Duplicate                    (optimistic chip + toast — iter-2 P5)
 *   • Edit targeting               (modal → friction → optimistic "Queued")
 *   • Compare (contexts)           (navigate — one creative's per-platform breakdown)
 *   • Add to compare / View        (tray add, no navigation / navigate, filter context preserved)
 *   • Pause                        (friction AlertDialog → optimistic)
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { buildPreservedSearch } from "@/creative-report/components/PreserveParamsLink";
import {
  setDuplicated,
  setMarkedWinner,
  setSavedToLibrary,
} from "@/creative-report/actions/actionStore";
import {
  addToCompare as addCreativeToCompareTray,
  useCompareTray,
  MAX_COMPARE,
} from "@/creative-report/lib/compareTrayStore";
import { LaunchConfirmModal } from "@/creative-report/actions/LaunchConfirmModal";
import { PauseAlert } from "@/creative-report/actions/PauseAlert";
import { EditTargetingModal } from "@/creative-report/actions/EditTargetingModal";
import { useReportBasePath } from "@/creative-report/state/ReportBasePathContext";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

interface ActionsApi {
  generateVariation: (r: CreativeRollup) => void;
  launch: (r: CreativeRollup) => void;
  pause: (r: CreativeRollup) => void;
  saveToLibrary: (r: CreativeRollup) => void;
  markWinner: (r: CreativeRollup) => void;
  duplicate: (r: CreativeRollup) => void;
  editTargeting: (r: CreativeRollup) => void;
  /** Compare-by-contexts (RunningInTable) — navigates straight to Compare's
   *  contexts mode for ONE creative's per-platform breakdown. Not the same
   *  intent as adding to the compare list below — don't conflate them. */
  compare: (ids: string[]) => void;
  /** Adds a creative to the compare tray (max `MAX_COMPARE`). No navigation —
   *  the floating tray is the way to actually go compare side by side. */
  addToCompare: (r: CreativeRollup) => void;
  view: (creativeId: string) => void;
  closeDrawer: () => void;
}

const CreativeActionsContext = createContext<ActionsApi | null>(null);

export function CreativeActionsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Version-aware: the provider is mounted once per Creative Report version
  // (2.0 / 3.0), so every action's destination is derived from the active
  // version's prefix rather than a hardcoded /reports/creative-v2.
  const basePath = useReportBasePath();
  const CREATIVES = `${basePath}/creatives`;
  const COMPARE = `${basePath}/compare`;
  const [launchRollup, setLaunchRollup] = useState<CreativeRollup | null>(null);
  const [pauseRollup, setPauseRollup] = useState<CreativeRollup | null>(null);
  const [targetingRollup, setTargetingRollup] = useState<CreativeRollup | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [targetingOpen, setTargetingOpen] = useState(false);

  const generateVariation = useCallback(
    (r: CreativeRollup) => {
      const c = r.creative;
      navigate(
        `/genie/new?concept=${encodeURIComponent(c.id)}&angle=${encodeURIComponent(
          c.angleId,
        )}&hook=${encodeURIComponent(c.components.hook)}&from=${encodeURIComponent(basePath)}`,
      );
    },
    [navigate, basePath],
  );

  const launch = useCallback((r: CreativeRollup) => {
    setLaunchRollup(r);
    setLaunchOpen(true);
  }, []);

  const pause = useCallback((r: CreativeRollup) => {
    setPauseRollup(r);
    setPauseOpen(true);
  }, []);

  const saveToLibrary = useCallback((r: CreativeRollup) => {
    setSavedToLibrary(r.creative.id);
    toast({
      title: "Saved to Creative Library",
      description: `${r.creative.product} is now in your library (simulated).`,
    });
  }, []);

  const markWinner = useCallback((r: CreativeRollup) => {
    setMarkedWinner(r.creative.id);
    toast({
      title: "Marked as Winner",
      description: `${r.creative.product} added to Winners — this is curation, not auto-inferred.`,
    });
  }, []);

  const duplicate = useCallback((r: CreativeRollup) => {
    setDuplicated(r.creative.id);
    toast({
      title: "Duplicated (simulated)",
      description: `A copy of ${r.creative.product} is ready to edit — this prototype doesn't create a second row in your data.`,
    });
  }, []);

  const editTargeting = useCallback((r: CreativeRollup) => {
    setTargetingRollup(r);
    setTargetingOpen(true);
  }, []);

  const compare = useCallback(
    (ids: string[]) => {
      navigate(`${COMPARE}${buildPreservedSearch(searchParams, `ids=${ids.join(",")}`)}`);
    },
    [navigate, searchParams, COMPARE],
  );

  // Single subscription to the tray store; the count used in the "added"
  // toast is derived from this snapshot (pre-mutation), so it's read once
  // per render rather than re-reading the store mid-callback.
  const { ids: compareIds } = useCompareTray();

  const addToCompare = useCallback(
    (r: CreativeRollup) => {
      const result = addCreativeToCompareTray(r.creative.id);
      if (result === "added") {
        toast({
          title: "Added to compare",
          description: `${r.creative.product} added — ${compareIds.length + 1} of ${MAX_COMPARE} in compare.`,
        });
      } else if (result === "already-in") {
        toast({
          title: "Already in compare",
          description: `${r.creative.product} is already in your compare list.`,
        });
      } else {
        toast({
          title: "Compare list is full",
          description: `Remove one before adding another — compare holds up to ${MAX_COMPARE} at a time.`,
        });
      }
    },
    [compareIds],
  );

  const view = useCallback(
    (creativeId: string) => {
      navigate(`${CREATIVES}${buildPreservedSearch(searchParams, `creative=${creativeId}`)}`);
    },
    [navigate, searchParams, CREATIVES],
  );

  const closeDrawer = useCallback(() => {
    navigate(`${CREATIVES}${buildPreservedSearch(searchParams, "")}`);
  }, [navigate, searchParams, CREATIVES]);

  const api = useMemo<ActionsApi>(
    () => ({
      generateVariation, launch, pause, saveToLibrary, markWinner, duplicate, editTargeting, compare, addToCompare, view, closeDrawer,
    }),
    [generateVariation, launch, pause, saveToLibrary, markWinner, duplicate, editTargeting, compare, addToCompare, view, closeDrawer],
  );

  return (
    <CreativeActionsContext.Provider value={api}>
      {children}
      <LaunchConfirmModal rollup={launchRollup} open={launchOpen} onOpenChange={setLaunchOpen} />
      <PauseAlert rollup={pauseRollup} open={pauseOpen} onOpenChange={setPauseOpen} />
      <EditTargetingModal rollup={targetingRollup} open={targetingOpen} onOpenChange={setTargetingOpen} />
    </CreativeActionsContext.Provider>
  );
}

export function useCreativeActions(): ActionsApi {
  const ctx = useContext(CreativeActionsContext);
  if (!ctx) throw new Error("useCreativeActions must be used within CreativeActionsProvider");
  return ctx;
}
