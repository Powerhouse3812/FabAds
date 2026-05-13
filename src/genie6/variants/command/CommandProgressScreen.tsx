import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Activity, Check } from "lucide-react";
import { sampleOutputs } from "../../mocks/sample-outputs";

const STAGES = [
  { id: "brief", label: "Reading brief", subtitle: "Parsing audience, angle, tone" },
  { id: "research", label: "Research", subtitle: "Pulling brand winners + insights" },
  { id: "concepts", label: "Concepts", subtitle: "Drafting visual + copy directions" },
  { id: "render", label: "Render", subtitle: "Generating image / video / text" },
  { id: "copy", label: "Copy", subtitle: "Writing headlines, body, CTAs" },
  { id: "finalize", label: "Finalize", subtitle: "Quality scoring + packaging" },
] as const;

const STAGE_MS = 900;

/**
 * Command variant — Progress screen.
 * Ops dashboard mental model: KPI strip showing % done + stages as a table
 * with status chips. Less hero, more telemetry.
 */
export function CommandProgressScreen() {
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

  const previews = sampleOutputs.slice(0, previewCount);
  const eta = Math.max(0, (STAGES.length - stageIndex) * Math.round(STAGE_MS / 1000));
  const progressPct = (stageIndex / STAGES.length) * 100;

  return (
    <div className="flex h-full flex-col p-3 gap-3">
      <div className="flex flex-1 flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
        <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-g6-primary" />
            <h1 className="text-g6-h4 font-bold text-g6-text">Generating batch</h1>
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
              · {batchId?.slice(-6)} · {stageIndex} / {STAGES.length} stages
            </span>
          </div>
          <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-g6-primary animate-pulse" />
            running · ~{eta}s remaining
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 border-b border-g6-border-secondary p-4 bg-g6-bg-base">
          <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3">
            <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Progress</p>
            <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text mt-1">{Math.round(progressPct)}%</p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
              <div className="h-full rounded-g6-pill bg-g6-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3">
            <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Current stage</p>
            <p className="text-g6-base font-bold text-g6-text mt-1">{STAGES[stageIndex]?.label ?? "Done"}</p>
            <p className="text-g6-xs text-g6-text-secondary">{STAGES[stageIndex]?.subtitle}</p>
          </div>
          <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3">
            <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Previews ready</p>
            <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text mt-1">{previews.length}</p>
            <p className="text-g6-xs text-g6-text-tertiary">of estimated 4</p>
          </div>
        </div>

        {/* Stage table */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-g6-base border border-g6-border-secondary overflow-hidden">
            <table className="w-full text-g6-sm">
              <thead className="bg-g6-bg-base">
                <tr className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                  <th className="w-10 px-3 py-2"></th>
                  <th className="px-3 py-2 text-left font-normal">Stage</th>
                  <th className="px-3 py-2 text-left font-normal">Detail</th>
                  <th className="px-3 py-2 text-right font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-g6-border-secondary">
                {STAGES.map((s, i) => {
                  const done = i < stageIndex;
                  const active = i === stageIndex;
                  return (
                    <tr key={s.id} className={cn(active && "bg-g6-primary-bg/30", !done && !active && "opacity-50")}>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded-full font-g6-mono text-g6-xs font-semibold",
                          done && "bg-g6-success/15 text-g6-success",
                          active && "bg-g6-primary/15 text-g6-primary g6-stage-active",
                          !done && !active && "bg-g6-bg-spotlight text-g6-text-tertiary"
                        )}>
                          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-g6-text">{s.label}</td>
                      <td className="px-3 py-2.5 text-g6-text-secondary text-g6-xs">{s.subtitle}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1.5 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                          <span className={cn("inline-block h-1.5 w-1.5 rounded-full",
                            done ? "bg-g6-success" : active ? "bg-g6-primary animate-pulse" : "bg-g6-text-tertiary/40"
                          )} />
                          {done ? "complete" : active ? "running" : "queued"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="flex items-center justify-end border-t border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <button
            type="button"
            onClick={() => navigate(`/iq/genie6/generate/${mode}`, { replace: true })}
            className="rounded-g6-base border border-g6-border bg-g6-bg-container px-3 py-1.5 text-g6-sm font-medium text-g6-text-secondary hover:text-g6-text"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
