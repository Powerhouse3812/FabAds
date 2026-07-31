/**
 * RecommendationsCard — "what to do today", built straight off
 * buildRecommendations(). Every line is a literal count+sum readout from the
 * current filter set (never a prediction or score) — render `text` verbatim,
 * no hedging, no embellishment.
 *
 * NOTE on styling: this renders on the Creative Report, which is OUTSIDE
 * Genie's `.g6-root` tree. The g6-* CSS vars (--g6-color-*, --g6-glass-*)
 * are only defined under `[data-theme="light"|"dark"]`, and that attribute
 * is only mirrored onto <html> by useGenie6Theme() on Genie routes — FabAds'
 * own theme toggle (next-themes) uses `class="dark"`, not `data-theme`. So
 * `.g6-glass` / `.g6-eyebrow` / `bg-g6-*` would silently fall back to
 * transparent/inherited here. This uses standard shadcn/semantic-token
 * equivalents instead (bg-card/70 + backdrop-blur, hover lift via transform,
 * mono/uppercase eyebrow) to get the same glass-dashboard look while staying
 * theme-correct in both light and dark.
 */
import { AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useReportBasePath } from "@/creative-report/state/ReportBasePathContext";
import { buildRecommendations, type Recommendation, type RecommendationTone } from "@/creative-report/lib/recommendations";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import type { BucketKey } from "@/creative-report/lib/paramSchema";

const TONE_ICON: Record<RecommendationTone, typeof AlertTriangle> = {
  attention: AlertTriangle,
  opportunity: TrendingUp,
  neutral: Sparkles,
};

// Icon tint only — text stays the default foreground color so meaning never
// rides on color alone (the icon + text carry it, per the tone already
// stated in the copy itself, e.g. "carrying $4.2k — refresh the hook").
const TONE_ICON_STYLE: Record<RecommendationTone, string> = {
  attention: "text-amber-600 dark:text-amber-400",
  opportunity: "text-primary-text",
  neutral: "text-muted-foreground",
};

// Routes for recommendations that don't carry a `bucket` (so there's no tab
// to switch to). Kept as one explicit map rather than inline branching —
// the only id in this state today is the brand-gap recommendation, which
// points at the owner report's per-brand rollups.
// Values are RELATIVE to the active version's base path (see
// useReportBasePath) so a recommendation clicked on 3.0 does not jump to 2.0.
const FALLBACK_ROUTE: Partial<Record<string, string>> = {
  "rec.brandGap": "/owner-report",
};

export function RecommendationsCard({
  rollups,
  onOpenBucket,
}: {
  rollups: CreativeRollup[];
  onOpenBucket?: (bucket: BucketKey) => void;
}) {
  const navigate = useNavigate();
  const basePath = useReportBasePath();
  const recommendations = buildRecommendations(rollups);

  function handleAction(rec: Recommendation) {
    if (rec.bucket) {
      onOpenBucket?.(rec.bucket);
      return;
    }
    const fallback = FALLBACK_ROUTE[rec.id];
    if (fallback) navigate(`${basePath}${fallback}`);
  }

  return (
    <section className="rounded-xl border border-border bg-card/70 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-semibold text-foreground">Recommendations</h3>
        <WhyDot id="overview.recommendations" />
      </div>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        What to do today
      </p>

      {recommendations.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing needs attention in this range.
        </p>
      ) : (
        <div className="mt-3">
          {recommendations.map((rec) => {
            const Icon = TONE_ICON[rec.tone];
            return (
              <div
                key={rec.id}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
              >
                <Icon className={cn("h-4 w-4 shrink-0", TONE_ICON_STYLE[rec.tone])} />
                <p className="min-w-0 flex-1 font-mono text-xs tabular-nums text-foreground">
                  {rec.text}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 px-2.5 text-xs"
                  onClick={() => handleAction(rec)}
                >
                  {rec.actionLabel}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
