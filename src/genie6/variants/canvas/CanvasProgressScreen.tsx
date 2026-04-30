import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PulsingRingLoader } from "../../components/PulsingRingLoader";
import { sampleOutputs } from "../../mocks/sample-outputs";

const STAGES = [
  { id: "brief", label: "Reading brief" },
  { id: "research", label: "Research" },
  { id: "concepts", label: "Concepts" },
  { id: "render", label: "Render" },
  { id: "copy", label: "Copy" },
  { id: "finalize", label: "Finalize" },
] as const;

const STAGE_MS = 900;

/**
 * Canvas variant — Progress screen.
 * Editor mental model: grid-floor backdrop, central viewport-scale render
 * stage with floating bottom action bar showing progress.
 */
export function CanvasProgressScreen() {
  const { mode, batchId } = useParams<{ mode: string; batchId: string }>();
  const navigate = useNavigate();
  const [stageIndex, setStageIndex] = useState(0);
  const [previewCount, setPreviewCount] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length) {
      navigate(`/iq/genie6/generate/${mode}/results/${batchId}`, { replace: true });
      return;
    }
    const t = setTimeout(() => {
      setStageIndex((i) => i + 1);
      if (STAGES[stageIndex]?.id === "render") setPreviewCount((n) => Math.min(n + 3, 4));
    }, STAGE_MS);
    return () => clearTimeout(t);
  }, [stageIndex, mode, batchId, navigate]);

  const currentStage = STAGES[stageIndex];
  const previews = sampleOutputs.slice(0, previewCount);
  const progressPct = (stageIndex / STAGES.length) * 100;

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />
      <div className="absolute left-4 top-4 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        canvas · rendering · stage {stageIndex + 1}/{STAGES.length}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8">
        <PulsingRingLoader size={200} />
        <div className="text-center space-y-2">
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            {currentStage?.label ?? "Done"}
          </h1>
          <p className="text-g6-sm text-g6-text-secondary">{currentStage?.label}…</p>
        </div>

        {previews.length > 0 && (
          <div className="flex justify-center gap-3 mt-4">
            {previews.map((o) => (
              <div key={o.id} className="h-24 w-20 overflow-hidden rounded-g6-base bg-g6-bg-container/80 backdrop-blur-md ring-1 ring-g6-border-secondary">
                {o.thumbnail ? <img src={o.thumbnail} alt="" className="h-full w-full object-cover" /> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom floating action bar with progress */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-3 rounded-g6-pill bg-g6-bg-container/95 backdrop-blur-md border border-g6-border-secondary px-4 py-2 shadow-g6-lg">
          <div className="h-1 w-48 overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
            <div className="h-full rounded-g6-pill bg-g6-primary transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{Math.round(progressPct)}%</span>
          <button
            type="button"
            onClick={() => navigate(`/iq/genie6/generate/${mode}`, { replace: true })}
            className="text-g6-xs text-g6-text-secondary hover:text-g6-text"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
