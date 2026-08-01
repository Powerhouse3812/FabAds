/**
 * FrameworkTeaserBand — Maalik's ask: "Overview me hum dikha skte hai
 * framework ka section, but with a blur effect ke phle analysis kro, and
 * wahi pe bhi ek button dedenge to start analysis." A small blurred preview
 * of the Framework timeline lives in the Overview tab's band list, with its
 * own start-analysis button — a shortcut into the full Analysis tab without
 * making the user hunt for it.
 *
 * Video-only (script timing is a video concept, same honesty-layer gate as
 * FrameworkPanel) — renders nothing for static/carousel creatives, avoiding
 * the "lonely/meaningless section" anti-pattern.
 */
import { useMemo } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  REVEAL_COST,
  getStatus,
  startAnalysis,
  useAnalysisStore,
} from "@/creative-report/lib/analysisStore";
import { deriveFrameworkSegments, totalDurationSec } from "@/creative-report/drawer/analysis/frameworkSegments";
import { PredictedBadge } from "@/creative-report/drawer/analysis/AnalysisBadges";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function FrameworkTeaserBand({
  rollup,
  onOpenAnalysis,
}: {
  rollup: CreativeRollup;
  onOpenAnalysis: () => void;
}) {
  const { creative } = rollup;
  // Hooks run unconditionally (Rules of Hooks) — the video-only early return
  // happens after, below.
  const store = useAnalysisStore();
  const status = useMemo(() => getStatus(store, creative.id), [store, creative.id]);
  const segments = useMemo(() => deriveFrameworkSegments(creative), [creative]);

  if (creative.format !== "video") return null;

  const canAfford = store.balance >= REVEAL_COST;
  const total = totalDurationSec(segments);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Framework</span>
          {status === "analysed" ? <PredictedBadge label="AI estimate" /> : <PredictedBadge label="Locked preview" />}
        </div>
        {status === "analysed" && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenAnalysis}>
            View full analysis
          </Button>
        )}
      </div>

      <div className="relative mt-2">
        <div
          aria-hidden
          className={cn("flex h-6 overflow-hidden rounded-md", status !== "analysed" && "pointer-events-none blur-sm select-none")}
        >
          {segments.map((seg) => (
            <div key={seg.key} className={seg.colorClass} style={{ width: `${(seg.durationSec / total) * 100}%` }} />
          ))}
        </div>

        {status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="sm" className="h-7 gap-1.5 px-2.5 text-xs" disabled={!canAfford} onClick={() => { startAnalysis(creative.id); onOpenAnalysis(); }}>
              <Sparkles className="h-3 w-3" />
              Start analysis ({REVEAL_COST} credits, simulated)
            </Button>
          </div>
        )}
        {status === "analysing" && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Analysing (simulated)…
          </div>
        )}
      </div>

      {status !== "analysed" && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Run analysis to see this creative's predicted script timeline, framework breakdown and cognitive
          insights — the rest of the report works without it.
        </p>
      )}
    </div>
  );
}
