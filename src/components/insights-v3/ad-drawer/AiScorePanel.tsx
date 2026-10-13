/**
 * AI score breakdown: total + tier, every part as a bar (value / max) with its
 * reason and examples, the redistribution note when a part isn't reported, the
 * plain-English explanation and, when the ad is passed, the suggested actions.
 * A score is only trusted if it shows its work.
 *
 * Engagement (likes, comments & shares) is NOT part of the AI score: those
 * parts are never emitted by the scorer and are hidden here too, so no row, no
 * "Not reported" and no redistribution sentence ever mentions them.
 */
import type { Ad, AiScore, AiScorePart, AiScorePartKey } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { AiScoreBadge, OverlaySection } from "@/components/insights-v3/shared";
import { AiScoreActions } from "./AiScoreActions";
import { fmtPoints } from "./drawerUtils";

const HIDDEN_PARTS: AiScorePartKey[] = ["likes", "social"];

function PartRow({ part }: { part: AiScorePart }) {
  // The branded penalty subtracts points: no bar, just the deduction.
  const isPenalty = part.key === "branded-penalty";
  const pct = part.max > 0 ? Math.min(100, Math.max(0, (part.value / part.max) * 100)) : 0;

  return (
    <li className={cn("space-y-1.5 rounded-lg border p-3", part.available ? "border-border bg-background" : "border-dashed border-border bg-muted/40")}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className={cn("text-sm font-medium", part.available ? "text-foreground" : "text-muted-foreground")}>{part.label}</h4>
        {!part.available ? (
          <span className="text-xs italic text-muted-foreground">Not reported</span>
        ) : isPenalty ? (
          <span className={cn("font-mono text-sm tabular-nums", part.value < 0 ? "text-error-text" : "text-muted-foreground")}>
            {part.value < 0 ? `−${fmtPoints(Math.abs(part.value))}` : "No penalty"}
          </span>
        ) : (
          <span className="font-mono text-sm tabular-nums text-foreground">
            {fmtPoints(part.value)}
            <span className="text-muted-foreground"> / {fmtPoints(part.max)}</span>
          </span>
        )}
      </div>

      {part.available && !isPenalty && (
        <div
          role="meter"
          aria-label={`${part.label}: ${fmtPoints(part.value)} of ${fmtPoints(part.max)} points`}
          aria-valuemin={0}
          aria-valuemax={part.max}
          aria-valuenow={part.value}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {part.reason.charAt(0).toUpperCase() + part.reason.slice(1)}
      </p>

      {part.available && part.examples.length > 0 && !(part.examples.length === 1 && part.examples[0] === part.reason) && (
        <ul className="space-y-0.5 border-l-2 border-primary/40 pl-2.5">
          {part.examples.map((e, i) => (
            <li key={i} className="break-words text-xs text-foreground/80">
              {e}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function AiScorePanel({ score, ad }: { score: AiScore; ad?: Ad }) {
  const parts = score.parts.filter((p) => !HIDDEN_PARTS.includes(p.key));
  const missing = parts.filter((p) => !p.available);

  return (
    <OverlaySection title="AI score breakdown" basedOn={1}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
          {score.total}
          <span className="text-base font-normal text-muted-foreground"> / 100</span>
        </span>
        <AiScoreBadge score={score} />
      </div>

      {score.explanation && <p className="mt-2 text-sm leading-5 text-foreground/90">{score.explanation}</p>}

      <ul className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2" aria-label="Score parts">
        {parts.map((p) => (
          <PartRow key={p.key} part={p} />
        ))}
      </ul>

      {missing.length > 0 && (
        <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {missing.map((m) => m.label).join(" and ")} {missing.length === 1 ? "isn't" : "aren't"} reported for this ad, so
          {missing.length === 1 ? " its" : " their"} points were redistributed across the parts that are. The total stays on the same 100-point scale.
        </p>
      )}

      {ad && <AiScoreActions ad={ad} />}
    </OverlaySection>
  );
}
