/**
 * FrameworkPanel — the credit-gated Framework sub-tab (Figma 6859:99758:
 * summary prose, a proportional segmented timeline bar, then an expandable
 * row per segment with a dialog/audio note and duration).
 *
 * Everything rendered here is a PREDICTION derived from `frameworkSegments.ts`
 * — always under a "Predicted" badge, never dressed up as measured. Gated by
 * AnalysisRevealGate; blurred + inert until analysed.
 */
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NA_NO_VIDEO } from "@/creative-report/lib/format";
import { PredictedBadge } from "@/creative-report/drawer/analysis/AnalysisBadges";
import { AnalysisRevealGate } from "@/creative-report/drawer/analysis/AnalysisRevealGate";
import {
  deriveFrameworkSegments,
  deriveFrameworkSummary,
  totalDurationSec,
} from "@/creative-report/drawer/analysis/frameworkSegments";
import type { AnalysisStatus } from "@/creative-report/lib/analysisStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

function FrameworkContent({ rollup }: { rollup: CreativeRollup }) {
  const { creative } = rollup;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const segments = deriveFrameworkSegments(creative);
  const total = totalDurationSec(segments);
  const summary = deriveFrameworkSummary(creative);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground">
            Framework: {creative.script.framework}
          </span>
          <PredictedBadge />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Timeline breakdown</span>
          <PredictedBadge label="AI estimate" />
        </div>
        <div className="mt-2 flex h-8 overflow-hidden rounded-md">
          {segments.map((seg) => (
            <div
              key={seg.key}
              className={cn(
                "flex items-center justify-center px-1 text-[10px] font-semibold text-white",
                seg.colorClass,
              )}
              style={{ width: `${(seg.durationSec / total) * 100}%` }}
              title={`${seg.label} · ${seg.durationSec}s`}
            >
              <span className="truncate">{seg.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex text-[10px] text-muted-foreground">
          {segments.map((seg) => (
            <div key={seg.key} className="text-center" style={{ width: `${(seg.durationSec / total) * 100}%` }}>
              {seg.durationSec}s
            </div>
          ))}
        </div>
      </div>

      <div>
        {segments.map((seg, i) => {
          const isOpen = openKey === seg.key;
          return (
            <div key={seg.key} className="border-b border-border py-2 last:border-0">
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : seg.key)}
                className="flex w-full items-center gap-2 text-left"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                <Badge variant="outline" className="text-[10px] font-medium leading-none">
                  {i + 1}. {seg.label}
                </Badge>
                <span className="flex-1 truncate text-xs text-muted-foreground">{seg.note}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{seg.durationSec}s</span>
              </button>
              {isOpen && (
                <p className="mt-1.5 pl-6 text-xs text-muted-foreground">
                  Dialog/audio note: {seg.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FrameworkPanel({
  rollup,
  status,
  balance,
}: {
  rollup: CreativeRollup;
  status: AnalysisStatus;
  balance: number;
}) {
  const isVideo = rollup.creative.format === "video";
  if (!isVideo) {
    return (
      <p className="text-sm text-muted-foreground">
        Framework timing analysis applies to video creatives only. {NA_NO_VIDEO}
      </p>
    );
  }

  return (
    <AnalysisRevealGate
      creativeId={rollup.creative.id}
      status={status}
      balance={balance}
      title="Discover what drives performance"
      description="Get AI-powered insights into the moments that capture attention, strengthen hooks, and keep viewers engaged."
    >
      <FrameworkContent rollup={rollup} />
    </AnalysisRevealGate>
  );
}
