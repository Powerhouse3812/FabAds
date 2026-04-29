import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PulsingRingLoader } from "../components/PulsingRingLoader";
import { sampleOutputs } from "../mocks/sample-outputs";

const STAGES = [
  { id: "brief", label: "Reading brief", subtitle: "Parsing audience, angle, tone…" },
  { id: "research", label: "Research", subtitle: "Pulling brand winners + insights…" },
  { id: "concepts", label: "Concepts", subtitle: "Drafting visual + copy directions…" },
  { id: "render", label: "Render", subtitle: "Generating image / video / text…" },
  { id: "copy", label: "Copy", subtitle: "Writing headlines, body, CTAs…" },
  { id: "finalize", label: "Finalize", subtitle: "Quality scoring + packaging…" },
] as const;

const STAGE_MS = 900;

export function ProgressScreen() {
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
      if (STAGES[stageIndex]?.id === "render") {
        setPreviewCount((n) => Math.min(n + 3, 4));
      }
    }, STAGE_MS);
    return () => clearTimeout(t);
  }, [stageIndex, mode, batchId, navigate]);

  const currentStage = STAGES[stageIndex];
  const previews = sampleOutputs.slice(0, previewCount);
  const eta = Math.max(0, (STAGES.length - stageIndex) * Math.round(STAGE_MS / 1000));
  const progressPct = (stageIndex / STAGES.length) * 100;

  return (
    <div className="g6-halo relative flex min-h-full flex-col items-center justify-center gap-12 px-6 py-16">
      {/* Pulsing rings + status */}
      <div className="g6-fade-up relative flex flex-col items-center gap-6">
        <PulsingRingLoader size={160} />
        <div className="space-y-1.5 text-center">
          <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
            generating · ~{eta}s remaining
          </p>
          <h1 className="text-g6-h2 font-bold tracking-tight text-g6-text">
            {currentStage?.label ?? "Done"}
          </h1>
          <p className="text-g6-base text-g6-text-secondary">{currentStage?.subtitle}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xl space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
          <div
            className="h-full rounded-g6-pill bg-g6-primary transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stage pipeline */}
        <div className="flex items-center justify-between gap-1">
          {STAGES.map((s, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex flex-col items-center gap-1 transition-opacity",
                  done && "opacity-100",
                  active && "opacity-100",
                  !done && !active && "opacity-40"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-g6-xs font-semibold",
                    done && "bg-g6-primary text-g6-text-on-accent",
                    active && "bg-g6-primary/20 text-g6-primary g6-stage-active",
                    !done && !active && "bg-g6-bg-spotlight text-g6-text-tertiary"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">
                  {s.id}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live preview tiles */}
      {previews.length > 0 && (
        <div className="g6-fade-up flex w-full max-w-xl flex-col gap-3">
          <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary text-center">
            preview · {previews.length} of {Math.max(4, previews.length + 1)} ready
          </p>
          <div className="flex justify-center gap-3">
            {previews.map((output, idx) => (
              <div
                key={output.id}
                className="g6-fade-up h-28 w-24 overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container shadow-g6-sm"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {output.thumbnail ? (
                  <img src={output.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-g6-bg-spotlight">
                    <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">TXT</span>
                  </div>
                )}
              </div>
            ))}
            <div className="h-28 w-24 animate-pulse rounded-g6-card border border-g6-border-secondary bg-g6-bg-spotlight" />
          </div>
        </div>
      )}

      {/* Cancel */}
      <button
        type="button"
        onClick={() => navigate(`/iq/genie6/generate/${mode}`, { replace: true })}
        className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-5 py-2 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:border-g6-border hover:text-g6-text"
      >
        Cancel generation
      </button>
    </div>
  );
}
