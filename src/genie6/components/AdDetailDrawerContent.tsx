import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { sampleOutputs } from "../mocks/sample-outputs";
import type { OutputData } from "../types/output";
import { LeftCreativeCard } from "./ad-detail/LeftCreativeCard";
import { TopActionRow } from "./ad-detail/TopActionRow";
import { AiVerdictCells } from "./ad-detail/AiVerdictCells";
import { HowThisWasMade } from "./ad-detail/HowThisWasMade";
import { CoachRow } from "./ad-detail/CoachRow";
import { SameBatchGrid } from "./ad-detail/SameBatchGrid";

interface Props {
  output: OutputData;
  open: boolean;
  onClose: () => void;
  onSelectSibling?: (id: string) => void;
}

/**
 * AdDetailDrawerContent — final canonical Ad-Detail drawer (A-12.196).
 *
 * Replaces both Variant A (1024 refined Sheet) and Variant C (1200 asymmetric
 * bento). The variant toggle is gone — single drawer, single mental model.
 *
 * Layout (1100px Sheet from right, 800px tall):
 *
 *   ┌── Header (56px) — "Ad detail · {id}" + "Generated {Xh ago}" + close X
 *   │
 *   ├── Body (soft ambient gradient bg, 16px padding)
 *   │   ┌─ LEFT col-350px ────────┐ ┌─ RIGHT col-694px (scrolling) ──┐
 *   │   │  LeftCreativeCard        │ │  1. TopActionRow              │
 *   │   │  • brand row              │ │     • title + tag chips       │
 *   │   │  • headline + body        │ │     • 3 buttons + 3 icons    │
 *   │   │  • 350×500 image          │ │     • kebab + trial nudge    │
 *   │   │  • body subline           │ │                               │
 *   │   │                           │ │  2. AiVerdictCells strip      │
 *   │   │                           │ │     5 cells (Quality / CTR    │
 *   │   │                           │ │     / CVR / Audience / Brand) │
 *   │   │                           │ │                               │
 *   │   │                           │ │  3. HowThisWasMade            │
 *   │   │                           │ │     collapsed/expanded toggle │
 *   │   │                           │ │     Mode/Format/AI · KB/      │
 *   │   │                           │ │     Concepts/Angle · Prompt   │
 *   │   │                           │ │                               │
 *   │   │                           │ │  4. Coach ("What to do next") │
 *   │   │                           │ │     3 lime icon rows          │
 *   │   │                           │ │                               │
 *   │   │                           │ │  5. SameBatchGrid             │
 *   │   │                           │ │     3-col BatchOutputCard     │
 *   │   └───────────────────────────┘ └───────────────────────────────┘
 *
 * URL contract: `?ad=<id>` opens. Closing strips both `?ad` and any
 * lingering `?drawer` (legacy variant-toggle param).
 */
export function AdDetailDrawerContent({
  output,
  open,
  onClose,
  onSelectSibling,
}: Props) {
  const generatedAgo = useMemo(() => formatRelativeTime(output.generatedAt), [output.generatedAt]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full p-0 overflow-hidden flex flex-col",
          "sm:max-w-[1100px]",
        )}
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-5 py-3 flex flex-row items-center gap-3 space-y-0 shrink-0">
          <SheetTitle className="text-[15px] font-semibold text-foreground">
            Ad detail · <span className="font-mono text-[12px] text-muted-foreground">{output.id}</span>
          </SheetTitle>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Generated {generatedAgo}
          </span>
        </SheetHeader>

        {/* Body — soft ambient gradient bg */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={{
            background: `
              radial-gradient(93.31% 117.67% at 75% 70%, rgba(249, 197, 108, 0.08) 0%, rgba(249, 197, 108, 0) 75%),
              radial-gradient(128% 161.42% at -14.19% 10.31%, rgba(117, 199, 240, 0.05) 0%, rgba(117, 199, 240, 0) 60%)
            `,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* LEFT — creative card */}
            <LeftCreativeCard output={output} />

            {/* RIGHT — stacked sections */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <TopActionRow output={output} />

              {/* AI Verdict strip */}
              <section className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5">
                <h3 className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  AI verdict
                </h3>
                {output.aiVerdict ? (
                  <AiVerdictCells verdict={output.aiVerdict} layout="strip" />
                ) : (
                  <p className="text-[11.5px] text-muted-foreground italic">
                    Verdict pending — regenerate to score.
                  </p>
                )}
              </section>

              {/* How this was made */}
              <HowThisWasMade output={output} />

              {/* What to do next — coach rows */}
              {output.recommendations && output.recommendations.length > 0 && (
                <section className="rounded-2xl border border-border/60 bg-card p-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                    What to do next
                  </h3>
                  <div>
                    {output.recommendations.map((rec) => (
                      <CoachRow key={rec.id} rec={rec} />
                    ))}
                  </div>
                </section>
              )}

              {/* Generated in same batch */}
              <SameBatchGrid
                output={output}
                allOutputs={sampleOutputs}
                onSelectSibling={onSelectSibling}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Local helper ─────────────────────────────────────────────────────── */

function formatRelativeTime(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (dayDiff === 1) return "Yesterday";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
