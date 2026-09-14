import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GenieApp } from "../appTypes";
import { firstFieldOfKind } from "../lib/fieldHelpers";
import { SourceAdField } from "../fields/SourceAdField";
import { AppZeroState } from "../components/AppZeroState";
import { RunDrawer } from "../components/RunDrawer";
import { AppScreenSkeleton } from "../components/AppSkeleton";
import { batchDoneCount, batchStatus } from "../../lib/genieRunTypes";
import { CREDITS_REMAINING, creditsLabel, formatCredits } from "../../lib/credits";
import type { SwapCardBase, UseSwapFlowReturn } from "./useSwapFlow";

/**
 * SwapFlowScreen — the ONE shared shell for Product Swap and Face Swap.
 *
 * Mirrors `variations/VariationsFlowA.tsx`'s anatomy exactly (numbered stages
 * on one scrolling page + a sticky "This run" rail), because that IS the
 * flow the owner asked both apps to match. What's genuinely shared lives
 * here: Stage 1 (`SourceAdField` — reused verbatim, not rebuilt), Stage 2
 * (a count stepper), the rail's credit summary + Generate, and the
 * zero/results plumbing every OTHER Other App already uses (`AppZeroState`,
 * `RunDrawer`, the "View results" pill) — kept rather than switched to
 * Variations' own navigate-to-a-results-page pattern, because that drawer
 * behaviour is a deliberate, owner-mandated convention for this whole app
 * family (see RunDrawer.tsx's header comment), and these two apps are
 * members of that family, not of Variations.
 *
 * What's DELIBERATELY NOT shared: Stage 3's per-card control. That's the one
 * axis the two apps actually differ on (a product vs. an avatar/voice/
 * language), so it's a render-prop slot (`renderCard`) rather than a branch
 * inside this file — the anti-duplication rule this codebase enforces cuts
 * both ways: don't fork the shell, and don't cram app-specific UI into a
 * shared file via a switch either.
 *
 * TOKENS: standard app tokens throughout (bg-background / text-foreground /
 * bg-primary / border-border), matching Other Apps' own palette — NOT the
 * g6-toned Variations module. The one exception is Stage 1's embedded Genie
 * Ad card, which keeps its own g6 styling scoped via `.g6-root` inside
 * `SourceAdField` itself (untouched here).
 */
export interface SwapFlowScreenProps<TCard extends SwapCardBase> {
  app: GenieApp;
  flow: UseSwapFlowReturn<TCard>;
  icon: LucideIcon;
  countLabel: string;
  countHint: string;
  cardSectionTitle: string;
  cardSectionHint: string;
  incompleteLabel: (n: number) => string;
  renderCard: (card: TCard, index: number) => ReactNode;
}

function plural(noun: [string, string], n: number): string {
  return n === 1 ? noun[0] : noun[1];
}

function CountStepper({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  /** The stage's own question ("How many scenes?") — a bare "Count" told a
   *  screen reader nothing about which quantity it was reading. */
  label: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-full border border-border bg-card px-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="One fewer"
        className="fab-focus inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[18px] leading-none">−</span>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        min={min}
        max={max}
        aria-label={label}
        className="fab-focus w-10 rounded-full bg-transparent text-center font-mono text-[14px] font-semibold tabular-nums text-foreground [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="One more"
        className="fab-focus inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[14px] leading-none">+</span>
      </button>
    </div>
  );
}

function Stage({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex gap-3">
      {/* Accent at rest — the stage numbers are the only thing carrying
          order on a screen that shows every stage at once. */}
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold leading-4 text-primary-text">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] font-semibold leading-[22px] text-foreground">{title}</h2>
        {hint ? <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{hint}</p> : null}
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

export function SwapFlowScreen<TCard extends SwapCardBase>({
  app,
  flow,
  icon: Icon,
  countLabel,
  countHint,
  cardSectionTitle,
  cardSectionHint,
  incompleteLabel,
  renderCard,
}: SwapFlowScreenProps<TCard>) {
  const [searchParams] = useSearchParams();
  const countNoun = flow.countNoun;
  const sourceField = firstFieldOfKind(app, "source-ad-picker");

  if (searchParams.get("loading") === "1") {
    return <AppScreenSkeleton />;
  }

  const forceEmpty = searchParams.get("empty") === "1";
  const batches = forceEmpty ? [] : flow.runs;
  const activeBatch =
    (flow.activeBatchId && flow.runs.find((b) => b.batchId === flow.activeBatchId)) || batches[0];
  const earlier = batches.filter((b) => b.batchId !== activeBatch?.batchId);
  const liveBatch = batches.find((b) => batchStatus(b) === "running");

  if (!sourceField) return null; // registry contract — both swap apps declare one

  const missingMessage = !flow.source
    ? "Pick the ad to swap into first."
    : flow.incompleteCount > 0
      ? incompleteLabel(flow.incompleteCount)
      : flow.overBalance
        ? "This run costs more than your balance. Lower the count."
        : null;

  return (
    /* Root is a COLUMN; the two columns live in the row below it. It used to
       be the row itself, which made the zero state a third 434px column
       wedged beside the rail instead of the full-width block every other
       Other App renders it as (AppRunner.tsx:191 — same component, stacked). */
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-7">
          <header className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <Icon className="h-[18px] w-[18px] text-primary-text" aria-hidden />
            </span>
            <div>
              <h1 className="text-[20px] font-semibold leading-7 text-foreground">{app.name}</h1>
              <p className="mt-0.5 max-w-[70ch] text-[12px] leading-5 text-muted-foreground">
                {app.subtitle}
              </p>
            </div>
          </header>

          <Stage n={1} title={sourceField.label} hint={sourceField.hint}>
            <SourceAdField
              field={sourceField}
              value={flow.source}
              onChange={(v) => flow.setSource(v)}
            />
          </Stage>

          {flow.source ? (
            <Stage n={2} title={countLabel} hint={countHint}>
              <div className="flex items-center gap-3">
                <CountStepper
                  value={flow.count}
                  onChange={flow.setCount}
                  min={flow.countMin}
                  max={flow.countMax}
                  label={countLabel}
                />
                <span className="text-[12px] leading-5 text-muted-foreground">
                  {flow.count} {plural(countNoun, flow.count)} below, one per output
                </span>
              </div>
            </Stage>
          ) : null}

          {flow.source ? (
            <Stage n={3} title={cardSectionTitle} hint={cardSectionHint}>
              <div className="space-y-3">
                {flow.cards.map((card, i) => (
                  <div key={card.id}>{renderCard(card, i)}</div>
                ))}
              </div>
            </Stage>
          ) : null}
        </div>

        {/* ─────────────────────────────── the run rail ─────────────────────── */}
        <aside className="sticky top-6 h-fit w-[300px] shrink-0 rounded-2xl border border-border bg-card p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            This run
          </p>
          {flow.source ? (
            <>
              {/* `title` so a clamped third line stays recoverable — same
                  convention as the Other Apps panel rows and ProductSheet. */}
              <p
                title={flow.source.card.name ?? flow.source.card.pageName ?? "This ad"}
                className="mt-2 line-clamp-2 text-[14px] font-semibold leading-[22px] text-foreground"
              >
                {flow.source.card.name ?? flow.source.card.pageName ?? "This ad"}
              </p>
              <div className="mt-4 space-y-1 border-t border-border pt-3">
                {/* These rows come from `previewCost()` — the SAME call that
                  produced the total — exactly as `VariationsFlowA` renders
                  `credits.lines`. They used to be hand-written as the app's
                  nominal rate plus `× count`, which quietly dropped every
                  other multiplier: Face Swap prices per MINUTE, so a 61s+
                  source made the rail read "13 · × 3" over a Total of 78.
                  §21.2 — one formula, and always show the multipliers. */}
                {flow.creditLines.map((line, i) => (
                  <div
                    key={`${line.op}-${line.label}-${i}`}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="min-w-0 text-[11px] leading-4 text-muted-foreground">
                      {line.label}
                      {/* `note` is where `appCost.ts` discloses rounding
                          ("rounded up to the nearest minute"). The rail
                          dropped it, so a 34s clip billed as a full minute
                          never said why. */}
                      {line.note ? (
                        <span className="block text-[10px] leading-4 text-muted-foreground/70">
                          {line.note}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-[11px] leading-4 tabular-nums text-foreground">
                      {line.op === "base" ? line.factor : `× ${line.factor}`}
                    </span>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <span className="text-[12px] font-semibold leading-5 text-foreground">Total</span>
                  <span
                    className={cn(
                      "font-mono text-[14px] font-semibold leading-[22px] tabular-nums",
                      flow.overBalance ? "text-destructive" : "text-primary-text",
                    )}
                  >
                    {/* ONE hedge, not two. This read "From ~64 credits" — both
                      "From" and "~" say the same thing, and the Generate
                      button 20px below quoted the same number flat as "64
                      credits", so the same figure was double-hedged in one
                      place and definite in the other. "~" alone carries it,
                      and the button now matches. */}
                    {flow.provisional ? "~" : ""}
                    {creditsLabel(flow.total)}
                  </span>
                </div>
                <p className="pt-1 text-[11px] leading-4 text-muted-foreground">
                  {formatCredits(CREDITS_REMAINING)} left in your balance
                </p>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              Nothing to price yet. Pick the ad to swap into and the run — and what it costs —
              appears here.
            </p>
          )}

          <Button
            type="button"
            onClick={flow.generate}
            disabled={!flow.canGenerate}
            className="mt-4 h-10 w-full gap-2 text-[13px]"
          >
            <Wand2 className="h-4 w-4" aria-hidden />
            {flow.source
              ? `Generate ${flow.count} · ${flow.provisional ? "~" : ""}${creditsLabel(flow.total)}`
              : "Generate"}
          </Button>
          {missingMessage ? (
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{missingMessage}</p>
          ) : null}
        </aside>
      </div>

      {/* Nothing has ever run here — same on-page zero state, and same
          reasoning, as every other Other App. */}
      {batches.length === 0 && (
        <div className="mt-8">
          <AppZeroState app={app} />
        </div>
      )}

      {batches.length > 0 && !flow.drawerOpen && (
        <button
          type="button"
          onClick={() => flow.setDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[12.5px] font-semibold text-foreground shadow-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {liveBatch ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
              Rendering
              <span className="font-mono text-[11px] font-normal text-muted-foreground">
                {batchDoneCount(liveBatch)}
              </span>
            </>
          ) : (
            <>
              View results
              <span className="font-mono text-[11px] font-normal text-muted-foreground">
                {batches.length} run{batches.length === 1 ? "" : "s"}
              </span>
            </>
          )}
        </button>
      )}

      <RunDrawer
        app={app}
        batch={activeBatch}
        earlier={earlier}
        open={flow.drawerOpen}
        onOpenChange={flow.setDrawerOpen}
      />
    </div>
  );
}
