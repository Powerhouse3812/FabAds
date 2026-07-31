/**
 * FatiguingNowList — "Fatiguing now — act today" (handoff §5.1).
 *
 * The fatigue reason is a symptom, not a verdict — shown as a plain chip,
 * not a bucket judgement. Flat divided rows (no card-in-card) so the
 * section reads as one scannable list, not stacked widgets.
 */
import { Pause, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { fmtCompactCurrency, truncate, NAME_MAX, pluralize } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function FatiguingNowList({
  items,
  onView,
  onPause,
  onIterate,
}: {
  items: CreativeRollup[];
  onView: (id: string) => void;
  onPause: (r: CreativeRollup) => void;
  onIterate: (r: CreativeRollup) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold text-foreground">Fatiguing now — act today</h3>
          <WhyDot id="overview.fatiguingNow" />
        </div>
        <span className="text-xs text-muted-foreground">{pluralize(items.length, "creative")}</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-2.5 text-xs text-muted-foreground">Nothing fatiguing right now — nice.</p>
      ) : (
        <div className="mt-1">
          {items.map((r) => {
            const { text, truncated } = truncate(r.creative.name, NAME_MAX);
            return (
              <div
                key={r.creative.id}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
              >
                <CreativeThumb creative={r.creative} size={40} />

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-foreground"
                    title={truncated ? r.creative.name : undefined}
                  >
                    {text}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {r.fatigue.reason && (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                        {r.fatigue.reason}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {fmtCompactCurrency(r.metrics.spend)} spend
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPause(r)}
                        aria-label="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pause</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onIterate(r)}
                        aria-label="Iterate → Genie"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Iterate → Genie</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onView(r.creative.id)}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
