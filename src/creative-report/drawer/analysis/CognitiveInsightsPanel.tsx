/**
 * CognitiveInsightsPanel — the credit-gated Cognitive Insights sub-tab
 * (Figma 6591:73938: locked behind "Discover What Drives Performance" /
 * "Reveal Insights (4 credits)"). Maalik's framing: this is AI-estimated
 * brain/psychology-style analysis, distinct in kind from the report's own
 * measured FB numbers — every value here carries a "Predicted"/"AI estimate"
 * badge, never the "Measured" one.
 *
 * No composite score of any kind is shown here — Maalik's ruling: a single
 * invented grade (0-100, a letter, a star rating) invites a buyer to trust
 * one number over the real underlying split, and this data model has no way
 * to compute one honestly (no elementId on DailyRow to attribute a day's
 * performance to a single element of a single creative). The panel leads
 * with the qualitative reasoning instead — the engagement-peak prose, then
 * the elements that reasoning covers — and stays labelled as an estimate
 * throughout via `PredictedBadge`.
 */
import { Badge } from "@/components/ui/badge";
import { NA_NO_VIDEO } from "@/creative-report/lib/format";
import { PredictedBadge } from "@/creative-report/drawer/analysis/AnalysisBadges";
import { AnalysisRevealGate } from "@/creative-report/drawer/analysis/AnalysisRevealGate";
import {
  derivePredictedElements,
  derivePredictedEngagementNote,
  derivePredictedLevers,
} from "@/creative-report/drawer/analysis/cognitiveInsights";
import type { AnalysisStatus } from "@/creative-report/lib/analysisStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

function CognitiveContent({ rollup }: { rollup: CreativeRollup }) {
  const { creative } = rollup;
  const elements = derivePredictedElements(creative);
  const note = derivePredictedEngagementNote(creative);
  const levers = derivePredictedLevers(creative);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground">Engagement estimate</span>
          <PredictedBadge />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {levers.map((lever) => (
            <Badge key={lever} variant="outline" className="text-[10px] font-medium leading-none">
              {lever}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Elements this estimate reasons over</span>
          <PredictedBadge label="AI estimate" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          No per-element score — this data model has no way to attribute a single day's performance to
          one element for one creative, so there's nothing honest to rank here.
        </p>
        <div className="mt-2 divide-y divide-border">
          {elements.map((el) => (
            <div key={el.kind} className="flex items-baseline justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0">
              <span className="shrink-0 text-muted-foreground">{el.label}</span>
              <span className="min-w-0 truncate text-right font-medium text-foreground" title={el.value}>
                {el.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CognitiveInsightsPanel({
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
        Cognitive insights analysis applies to video creatives only. {NA_NO_VIDEO}
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
      <CognitiveContent rollup={rollup} />
    </AnalysisRevealGate>
  );
}
