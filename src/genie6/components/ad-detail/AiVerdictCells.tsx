import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiVerdict } from "../../types/output";
import { QualityRing } from "./QualityRing";

/**
 * AiVerdictCells — the 4 (grid) or 5 (strip) predicted-performance tiles.
 *
 * Layouts:
 *   "grid"  — 2x2 (Estimated CTR / Estimated CVR / Audience match / On-brand score)
 *             used inside Variant A's right column where QualityRing sits to the LEFT
 *             of this grid as a separate component.
 *   "strip" — 5 hairline-divided horizontal cells with QualityRing as cell 1,
 *             followed by the same 4 predicted metrics. Used in Variant C's
 *             full-width AI Verdict row.
 */
interface AiVerdictCellsProps {
  verdict: AiVerdict;
  layout?: "grid" | "strip";
  className?: string;
}

export function AiVerdictCells({
  verdict,
  layout = "grid",
  className,
}: AiVerdictCellsProps) {
  const ctrPositive = verdict.ctrDelta >= 0;
  const cvrPositive = verdict.cvrDelta >= 0;

  const cells = (
    <>
      <Cell
        eyebrow="Estimated CTR"
        value={`${verdict.ctr.toFixed(1)}%`}
        sub={
          <DeltaChip positive={ctrPositive} value={verdict.ctrDelta} suffix="vs angle" />
        }
      />
      <Cell
        eyebrow="Estimated CVR"
        value={`${verdict.cvr.toFixed(1)}%`}
        sub={
          <DeltaChip positive={cvrPositive} value={verdict.cvrDelta} suffix="vs angle" />
        }
      />
      <Cell
        eyebrow="Audience match"
        value={
          verdict.audienceFitLabel === "N/A" ||
          !Number.isFinite(verdict.audienceFit)
            ? "N/A"
            : String(verdict.audienceFit)
        }
        isNA={
          verdict.audienceFitLabel === "N/A" ||
          !Number.isFinite(verdict.audienceFit)
        }
        sub={
          verdict.audienceFitLabel === "N/A" ||
          !Number.isFinite(verdict.audienceFit) ? null : (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {verdict.audienceFitLabel}
            </span>
          )
        }
      />
      <Cell
        eyebrow="On-brand score"
        value={String(verdict.brandVoice)}
        sub={
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {verdict.brandVoiceLabel}
          </span>
        }
      />
    </>
  );

  if (layout === "strip") {
    return (
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border/60",
          className,
        )}
      >
        <div className="flex items-center justify-center px-4">
          <QualityRing score={verdict.quality} label="Quality" size={56} />
        </div>
        {cells}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>{cells}</div>
  );
}

interface CellProps {
  eyebrow: string;
  value: string;
  sub: React.ReactNode;
}

function Cell({ eyebrow, value, sub, isNA }: CellProps & { isNA?: boolean }) {
  return (
    <div className="px-2.5 py-1.5 flex flex-col gap-1">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <p
        className={cn(
          "font-mono tabular-nums text-[17px] font-semibold leading-none",
          isNA ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub && <div className="leading-none">{sub}</div>}
    </div>
  );
}

interface DeltaChipProps {
  positive: boolean;
  value: number;
  suffix?: string;
}

function DeltaChip({ positive, value, suffix }: DeltaChipProps) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[10.5px] tabular-nums",
        positive
          ? "text-[hsl(var(--success-text))]"
          : "text-destructive",
      )}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.2} />
      {positive ? "+" : ""}
      {value.toFixed(1)}
      {suffix && (
        <span className="ml-0.5 text-muted-foreground font-normal">
          {suffix}
        </span>
      )}
    </span>
  );
}
