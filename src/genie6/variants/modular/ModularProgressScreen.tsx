import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
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
 * Modular variant — Progress screen.
 * Glass module cards on the cosmic halo backdrop. Three modules: progress
 * status / stages / previews.
 */
export function ModularProgressScreen() {
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
  const eta = Math.max(0, (STAGES.length - stageIndex) * Math.round(STAGE_MS / 1000));
  const progressPct = (stageIndex / STAGES.length) * 100;

  return (
    <div className="g6-halo relative min-h-full p-6">
      <header className="relative z-10 mb-6">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> generation.in_progress
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          Generating
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-1">~{eta}s remaining · {batchId?.slice(-6)}</p>
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* progress_module */}
        <ModuleCard title="Progress" className="lg:col-span-2">
          <div className="flex items-center gap-6">
            <PulsingRingLoader size={120} />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-g6-h4 font-bold text-g6-text">{currentStage?.label ?? "Done"}</p>
                <p className="text-g6-sm text-g6-text-secondary">stage {stageIndex + 1} of {STAGES.length}</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
                <div className="h-full rounded-g6-pill bg-g6-primary transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{Math.round(progressPct)}% complete</p>
            </div>
          </div>
        </ModuleCard>

        {/* stages_module */}
        <ModuleCard title="Pipeline">
          <ul className="space-y-1.5">
            {STAGES.map((s, i) => {
              const done = i < stageIndex;
              const active = i === stageIndex;
              return (
                <li key={s.id} className={cn("flex items-center gap-2", !done && !active && "opacity-50")}>
                  <span className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full font-g6-mono text-[10px] font-semibold shrink-0",
                    done && "bg-g6-success/15 text-g6-success",
                    active && "bg-g6-primary/15 text-g6-primary g6-stage-active",
                    !done && !active && "bg-g6-bg-spotlight text-g6-text-tertiary"
                  )}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="text-g6-sm text-g6-text">{s.label}</span>
                </li>
              );
            })}
          </ul>
        </ModuleCard>

        {/* previews_module — full width */}
        {previews.length > 0 && (
          <ModuleCard title={`Previews (${previews.length})`} className="lg:col-span-3">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {previews.map((o) => (
                <div key={o.id} className="h-28 w-24 shrink-0 overflow-hidden rounded-g6-base border border-g6-border-secondary bg-g6-bg-base/50">
                  {o.thumbnail ? (
                    <img src={o.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">TXT</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="h-28 w-24 shrink-0 animate-pulse rounded-g6-base border border-g6-border-secondary bg-g6-bg-spotlight" />
            </div>
          </ModuleCard>
        )}

        {/* Cancel CTA */}
        <div className="lg:col-span-3 flex justify-center pt-2">
          <button
            type="button"
            onClick={() => navigate(`/iq/genie6/generate/${mode}`, { replace: true })}
            className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/60 px-5 py-2 text-g6-sm font-medium text-g6-text-secondary hover:text-g6-text"
          >
            Cancel generation
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("g6-glass rounded-g6-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between">
        <p className="text-g6-xs font-medium text-g6-text-tertiary">{title}</p>
        <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
      </header>
      {children}
    </div>
  );
}
