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
 *   • Compare / View               (navigate, filter context preserved)
 *   • Pause                        (friction AlertDialog → optimistic)
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { buildPreservedSearch } from "@/creative-report-v2/components/PreserveParamsLink";
import {
  setDuplicated,
  setMarkedWinner,
  setSavedToLibrary,
} from "@/creative-report-v2/actions/actionStore";
import { LaunchConfirmModal } from "@/creative-report-v2/actions/LaunchConfirmModal";
import { PauseAlert } from "@/creative-report-v2/actions/PauseAlert";
import { EditTargetingModal } from "@/creative-report-v2/actions/EditTargetingModal";
import { useReportBasePath } from "@/creative-report-v2/state/ReportBasePathContext";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";

interface ActionsApi {
  generateVariation: (r: CreativeRollup) => void;
  launch: (r: CreativeRollup) => void;
  pause: (r: CreativeRollup) => void;
  saveToLibrary: (r: CreativeRollup) => void;
  markWinner: (r: CreativeRollup) => void;
  duplicate: (r: CreativeRollup) => void;
  editTargeting: (r: CreativeRollup) => void;
  compare: (ids: string[]) => void;
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
      generateVariation, launch, pause, saveToLibrary, markWinner, duplicate, editTargeting, compare, view, closeDrawer,
    }),
    [generateVariation, launch, pause, saveToLibrary, markWinner, duplicate, editTargeting, compare, view, closeDrawer],
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
