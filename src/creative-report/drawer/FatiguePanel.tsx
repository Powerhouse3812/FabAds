/**
 * FatiguePanel — frequency + CTR-decay + verdict chip (handoff §5.2).
 * Copy is always hypothesis-framed (handoff §7) — never a diagnosis.
 */
import { cn } from "@/lib/utils";
import { fmtDelta, NA_NO_VIDEO, type DeltaTone } from "@/creative-report/lib/format";
import { Sparkline } from "@/creative-report/components/Sparkline";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { bucketRuleText, type CreativeRollup } from "@/creative-report/lib/selectors";
import { useBucketThresholds } from "@/creative-report/lib/thresholds";

/** Falling is bad for both CTR and hook-rate trends. */
function trendToneClass(tone: DeltaTone): string {
  if (tone === "flat") return "text-muted-foreground";
  return tone === "down" ? "text-destructive" : "text-primary-text";
}

function buildHypothesis(rollup: CreativeRollup, fatigueFreqThreshold: number): string {
  const { fatigue } = rollup;
  if (!fatigue.isFatiguing) {
    return "No fatigue signals in range — frequency and CTR are holding.";
  }
  if (fatigue.reason?.startsWith("Freq")) {
    return `Frequency is above ${fatigueFreqThreshold} — the same people are seeing this repeatedly, which usually precedes a CTR drop.`;
  }
  if (fatigue.reason?.startsWith("CTR") && fatigue.ctrDeltaPct !== null) {
    return `CTR is down ${Math.abs(Math.round(fatigue.ctrDeltaPct))}% over 14 days — the creative may be wearing out; refreshing the hook while keeping the body is the usual first move.`;
  }
  if (fatigue.reason?.startsWith("Hook") && fatigue.hookDeltaPct !== null) {
    return `Hook rate is down ${Math.abs(Math.round(fatigue.hookDeltaPct))}% over 14 days — viewers may be scrolling past faster; a fresh opening 3 seconds is the usual first move.`;
  }
  return "Fatigue signals are showing in range — worth a refresh.";
}

export function FatiguePanel({ rollup }: { rollup: CreativeRollup }) {
  const { fatigue } = rollup;
  const thresholds = useBucketThresholds();
  const ctrDelta = fmtDelta(fatigue.ctrDeltaPct);
  const hookDelta = fmtDelta(fatigue.hookDeltaPct);
  const freqHot = fatigue.freq7 > thresholds.fatigueFreq;
  const ctrData = rollup.series.map((p) => p.ctr);
  const sparkTone = fatigue.ctrDeltaPct !== null && fatigue.ctrDeltaPct < 0 ? "down" : "up";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Fatigue</span>
        <div className="flex items-center gap-1.5">
          <WhyDot id="drawer.fatigue.verdict" />
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
              fatigue.isFatiguing
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-primary/15 text-primary-text border-primary/30",
            )}
          >
            {fatigue.isFatiguing ? "Fatiguing" : "Healthy"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Frequency (7d)
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              freqHot ? "text-amber-600 dark:text-amber-400" : "text-foreground",
            )}
          >
            {fatigue.freq7.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            14-day CTR trend
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              fatigue.ctrDeltaPct === null ? "text-muted-foreground" : trendToneClass(ctrDelta.tone),
            )}
          >
            {fatigue.ctrDeltaPct === null ? "—" : ctrDelta.label}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Hook-rate trend
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              fatigue.hookDeltaPct === null ? "text-muted-foreground" : trendToneClass(hookDelta.tone),
            )}
          >
            {fatigue.hookDeltaPct === null ? NA_NO_VIDEO : hookDelta.label}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Sparkline data={ctrData} tone={sparkTone} height={40} />
        <p className="text-[11px] text-muted-foreground">14-day rolling CTR</p>
      </div>

      <p className="text-sm text-muted-foreground">{buildHypothesis(rollup, thresholds.fatigueFreq)}</p>
      <p className="font-mono text-[10.5px] text-muted-foreground">
        Rule: {bucketRuleText("fatiguing", thresholds)}
      </p>
    </div>
  );
}
