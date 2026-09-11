import { useState } from "react";
import { Layers, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CREDITS_REMAINING, creditsLabel, formatCredits } from "../lib/credits";
import { SourcePicker } from "./components/SourcePicker";
import { SourcePickerModal } from "./components/SourcePickerModal";
import { VariationCard } from "./components/VariationCard";
import { COUNT_MAX, COUNT_MIN, type UseVariationsFlowReturn } from "./state/useVariationsFlow";

/**
 * Generate Variations — the inline screen.
 *
 * REDESIGNED 2026-09-10. Three things changed shape:
 *   1. Stage 1 is the ALWAYS-VISIBLE dropzone card (`SourcePicker`), and each
 *      of its chips opens its OWN modal on that universe — the owner's ruling
 *      the same day, reversing the single "Choose what to vary" button that
 *      briefly stood here. Nothing about the source expands inline any more:
 *      this screen holds `pickerUniverse`, the modal reads it, and the card
 *      never moves.
 *   2. Raising the count spawns one CARD per variation in real time. Each card
 *      carries the wizard's own configuration section prefilled from the
 *      source, so it is edited in place — which is why the old
 *      All/Multiple/Individually scope selector is gone.
 *   3. Whatever the source is, the run produces WHOLE ADS.
 *
 * The screen itself is deliberately thin: it owns the order of the three
 * questions and the run summary. Everything configurable lives in a card.
 */

interface VariationsFlowAProps {
  flow: UseVariationsFlowReturn;
}

function plural(noun: string, n: number): string {
  return n === 1 ? noun : `${noun}s`;
}

/* ────────────────────────────────────────────────────────── *
 *  CountStepper — the shared 1/20 contract, as a control.
 * ────────────────────────────────────────────────────────── */
function CountStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-g6-pill border border-g6-border bg-g6-bg-container px-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="One less variation"
        className="inline-flex h-7 w-7 items-center justify-center rounded-g6-pill text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[18px] leading-none">−</span>
      </button>
      <input
        id="variation-count"
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        min={min}
        max={max}
        className="w-10 bg-transparent text-center font-g6-mono text-[14px] font-semibold tabular-nums text-g6-text outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="One more variation"
        className="inline-flex h-7 w-7 items-center justify-center rounded-g6-pill text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[14px] leading-none">+</span>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Stage — the numbered band. The number carries the order,
 *  which is what lets everything sit on one screen.
 * ────────────────────────────────────────────────────────── */
function Stage({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-3">
      {/* Accent at rest: the numbers are the only thing carrying order on a
          screen that shows every stage at once, so they must read before the
          user has touched anything. `primary-active` because plain
          `g6-primary` on white is ~2.3:1 and vanishes at this size. */}
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-g6-primary-border bg-g6-primary-bg font-g6-mono text-[11px] font-semibold leading-4 text-g6-primary-active">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] font-semibold leading-[22px] text-g6-text">{title}</h2>
        {hint ? (
          <p className="mt-0.5 text-[12px] leading-5 text-g6-text-secondary">{hint}</p>
        ) : null}
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

export function VariationsFlowA({ flow }: VariationsFlowAProps) {
  /** Which universe's modal is open — one per chip. `null` = none. */
  const [pickerUniverse, setPickerUniverse] = useState<string | null>(null);
  /** A file dropped on the dropzone, handed to the modal to route and hold. */
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const { state, credits } = flow;
  const picked = state.picked;
  const analysis = flow.analysis ?? flow.assetAnalysis;

  function close() {
    setPickerUniverse(null);
    setDroppedFile(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-6 py-6">
      <div className="min-w-0 flex-1 space-y-7">
        <header className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-g6-lg border border-g6-primary-border bg-g6-primary-bg">
            <Layers className="h-4.5 w-4.5 text-g6-primary-active" aria-hidden />
          </span>
          <div>
            <h1 className="text-[20px] font-semibold leading-7 text-g6-text">
              Generate Variations
            </h1>
            <p className="mt-0.5 max-w-[70ch] text-[12px] leading-5 text-g6-text-secondary">
              Start from an ad — or a script, concept or storyboard — that already works. Genie
              reads it, then gives you one editable card per variation. Every run produces whole
              ads.
            </p>
          </div>
        </header>

        <Stage
          n={1}
          title="What you're varying"
          hint="One ad, or one asset. Whatever you pick, the output is a whole ad."
        >
          {/* The dropzone card is the whole of Stage 1 and is always mounted —
              it is the screen's first impression with nothing picked, and it
              stays put once something is, so changing the source never means
              hunting for the control that chose it. It renders the picked
              card itself, which is why this screen no longer keeps a second
              summary of the same pick. */}
          <SourcePicker
            picked={picked}
            onClear={flow.clearSource}
            onOpenUniverse={(universeKey, file) => {
              setDroppedFile(file ?? null);
              setPickerUniverse(universeKey);
            }}
          />
        </Stage>

        {picked ? (
          <Stage
            n={2}
            title="How many variations?"
            hint={`Between ${COUNT_MIN} and ${COUNT_MAX}. Cards appear below as you change this.`}
          >
            <div className="flex items-center gap-3">
              <CountStepper
                value={state.count}
                onChange={flow.setCount}
                min={COUNT_MIN}
                max={COUNT_MAX}
              />
              <span className="text-[12px] leading-5 text-g6-text-secondary">
                {state.count} {plural("card", state.count)} below, one per variation
              </span>
            </div>
          </Stage>
        ) : null}

        {picked && analysis ? (
          <Stage
            n={3}
            title="Tune each variation"
            hint="Every card opened prefilled from the source. Change as much or as little as you like — each card is its own ad."
          >
            <div className="space-y-4">
              {flow.cards.map((card, i) => (
                <VariationCard
                  key={card.id}
                  index={i}
                  card={card}
                  analysis={analysis}
                  recommendations={flow.recommendations}
                  onAdTypeChange={(adType) => flow.setCardAdType(card.id, adType)}
                  onSummaryChange={flow.reportCardSummary}
                />
              ))}
            </div>
          </Stage>
        ) : null}
      </div>

      {/* ─────────────────────────────── the run rail ─────────────────────── */}
      <aside className="sticky top-6 h-fit w-[300px] shrink-0 rounded-g6-xl border border-g6-border bg-g6-bg-container p-4">
        <p className="font-g6-mono text-[10px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
          This run
        </p>
        {picked && analysis ? (
          <>
            <p className="mt-2 text-[14px] font-semibold leading-[22px] text-g6-primary-active">
              {state.count} {plural("variation", state.count)}
            </p>
            <p className="mt-0.5 text-[12px] leading-5 text-g6-text-secondary">
              of {analysis.source.title}
            </p>
            <div className="mt-4 space-y-1 border-t border-g6-border-secondary pt-3">
              {credits.lines.map((line) => (
                <div key={line.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] leading-4 text-g6-text-secondary">
                    {line.label}
                  </span>
                  <span className="font-g6-mono text-[11px] leading-4 tabular-nums text-g6-text">
                    {line.op === "base" ? line.factor : `× ${line.factor}`}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-2 pt-1">
                <span className="text-[12px] font-semibold leading-5 text-g6-text">Total</span>
                <span
                  className={cn(
                    "font-g6-mono text-[14px] font-semibold leading-[22px] tabular-nums",
                    credits.overdrawn ? "text-warning-text" : "text-g6-primary-active",
                  )}
                >
                  {creditsLabel(credits.total)}
                </span>
              </div>
              <p className="pt-1 text-[11px] leading-4 text-g6-text-tertiary">
                {formatCredits(CREDITS_REMAINING)} left in your balance
              </p>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[12px] leading-5 text-g6-text-secondary">
            Nothing to price yet. Pick what you want to vary and the run — and what it costs —
            appears here.
          </p>
        )}

        <Button
          type="button"
          onClick={flow.generate}
          disabled={!flow.canGenerate}
          className="mt-4 h-10 w-full gap-2 bg-g6-primary text-[13px] text-g6-text-on-accent shadow-g6-primary-btn hover:bg-g6-primary-hover"
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          {picked
            ? `Generate ${state.count} · ${creditsLabel(credits.total)}`
            : "Generate"}
        </Button>
        {!flow.canGenerate ? (
          <p className="mt-2 text-[11px] leading-4 text-g6-text-tertiary">
            {!picked
              ? "Pick what you want to vary first."
              : "This run costs more than your balance. Lower the count."}
          </p>
        ) : null}
      </aside>

      <SourcePickerModal
        universeKey={pickerUniverse}
        pendingFile={droppedFile}
        picked={picked}
        onClose={close}
        onPick={(next) => {
          flow.pick(next);
          close();
        }}
      />
    </div>
  );
}
