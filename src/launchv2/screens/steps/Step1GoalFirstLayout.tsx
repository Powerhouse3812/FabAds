/**
 * Step 1 — Goal-first layout (Figma-aligned).
 *
 * §1 Launch name  — always visible, optional. Auto-prefix ("Sales · Jun 2026")
 *                   kicks in once an objective is known; plain freeform input
 *                   before that.
 * §2 Goal picker  — always visible, 6 objective cards.
 * §3 Auto-fill    — single CTA that opens StrategyPickerModal (was: a
 *                   search+filter+46-card grid inline on the page).
 */

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  MessageSquare,
  MousePointer2,
  Rocket,
  Settings,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES } from "../../data";
import type { LaunchStrategy } from "../../services/strategiesService";
import LaunchNomenclatureModal from "./LaunchNomenclatureModal";
import StrategyPickerModal from "./shared/StrategyPickerModal";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface GoalFirstLayoutProps {
  flow: UseFlowV2;
}

/* ------------------------------------------------------------------ */
/*  Objective metadata                                                  */
/* ------------------------------------------------------------------ */

type ObjIcon = React.ComponentType<{ className?: string }>;

const OBJECTIVE_ICON: Record<Objective, ObjIcon> = {
  OUTCOME_SALES: ShoppingCart,
  OUTCOME_AWARENESS: Eye,
  OUTCOME_TRAFFIC: MousePointer2,
  OUTCOME_ENGAGEMENT: MessageSquare,
  OUTCOME_APP_PROMOTION: Smartphone,
  OUTCOME_LEADS: Rocket,
};

const OBJECTIVE_LABEL: Record<Objective, string> = {
  OUTCOME_SALES: "Sales",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_APP_PROMOTION: "App installs",
  OUTCOME_LEADS: "Lead gen",
};

/** Build the prefix label: "Sales · Jun 2026" */
function buildPrefix(objective: Objective): string {
  const label = OBJECTIVE_LABEL[objective] ?? objective;
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `${label} · ${month} ${year}`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function GoalFirstLayout({ flow }: GoalFirstLayoutProps) {
  const { plan } = flow;
  const { objective } = plan;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [appliedStrategy, setAppliedStrategy] = useState<LaunchStrategy | null>(null);
  const [mismatchNotice, setMismatchNotice] = useState<{ from: string; to: string } | null>(null);
  const [showNomenclature, setShowNomenclature] = useState(false);

  /* Name field — prefix (once objective known) + editable suffix/freeform */
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    if (!objective) return;
    const prefix = buildPrefix(objective as Objective);
    const fullName = (prefix + (nameValue ? ` · ${nameValue}` : "")).trim() || "Untitled launch";
    flow.patch({ name: fullName });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only on suffix/objective change
  }, [nameValue, objective]);

  /** Goal card clicked */
  const handleObjective = (o: Objective) => {
    flow.chooseObjectiveFormat(o, null);
    setMismatchNotice(null);
  };

  /** Strategy applied from the picker modal */
  const handlePickStrategy = (s: LaunchStrategy) => {
    const prevObjective = flow.plan.objective;
    flow.applySavedStrategy(s.plan);
    setAppliedStrategy(s);
    if (s.plan.objective && prevObjective && s.plan.objective !== prevObjective) {
      setMismatchNotice({
        from: OBJECTIVE_LABEL[prevObjective as Objective] ?? prevObjective,
        to: OBJECTIVE_LABEL[s.plan.objective as Objective] ?? s.plan.objective,
      });
    }
  };

  /** Clear an applied strategy — back to manual/custom */
  const handleClearStrategy = () => {
    setAppliedStrategy(null);
    setMismatchNotice(null);
    flow.chooseCustomFlow();
    flow.patch({ strategyId: null, objective: undefined });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      {/* ── Heading ──────────────────────────────────────────────────── */}
      <div className="text-center">
        <h1 className="text-[23px] font-bold tracking-[-0.01em] text-foreground">
          What do you want to launch?
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pick a saved strategy to pre-fill everything, or start custom.
        </p>
      </div>

      {/* ── Applied-strategy indicator ──────────────────────────────── */}
      {appliedStrategy && (
        <div
          className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2"
          role="status"
          aria-live="polite"
        >
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
            Applied <span className="text-foreground font-medium">{appliedStrategy.name}</span> — all fields pre-filled. Edit any step, or Skip &amp; Launch.
          </p>
          <button
            type="button"
            onClick={handleClearStrategy}
            className="shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {mismatchNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2" role="status">
          <span className="text-[11px] text-yellow-700 dark:text-yellow-400 font-mono">
            Goal changed: {mismatchNotice.from} → {mismatchNotice.to} (from this strategy)
          </span>
          <button type="button" onClick={() => setMismatchNotice(null)} className="ml-auto shrink-0 text-muted-foreground/60 hover:text-muted-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── §1 Launch name — always visible, optional ──────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-foreground">Launch name</h2>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Optional
          </span>
        </div>

        {objective ? (
          <div className="flex items-center gap-0 h-9 rounded-xl border border-border bg-card overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="flex items-center shrink-0 h-full px-2.5 border-r border-border/60 bg-primary/8">
              <span className="text-[11px] font-semibold text-primary font-mono whitespace-nowrap">
                {buildPrefix(objective as Objective)}
              </span>
            </div>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Add to launch name"
              className="flex-1 min-w-0 h-full bg-transparent px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNomenclature(true)}
              aria-label="Open naming rules"
              className="flex h-full w-9 shrink-0 items-center justify-center border-l border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Name this launch — its identifier in reports and history"
            className="h-9 w-full rounded-xl border border-border bg-card px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
          />
        )}
        <p className="text-[10px] text-muted-foreground/70">
          Default launch name is built from your goal. Entering a name here overrides it.
        </p>
      </section>

      {/* ── §2 Goal picker — always visible ─────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold text-foreground">What&apos;s the goal?</h2>
        <div className="grid grid-cols-3 gap-2">
          {OBJECTIVES.map((o) => {
            const Icon = OBJECTIVE_ICON[o.id];
            const selected = objective === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => handleObjective(o.id)}
                aria-pressed={selected}
                className={cn(
                  "fab-focus relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all duration-200",
                  selected
                    ? "border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09]"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    selected ? "bg-[#8FB821]/15" : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[14px] w-[14px]",
                      selected ? "text-[#5B7611] dark:text-[#C3E165]" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    {o.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug line-clamp-2">
                    {o.desc}
                  </p>
                </div>
                {selected && (
                  <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#8FB821]">
                    <Check className="h-2.5 w-2.5 text-[#121212]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── OR divider ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ── §3 Auto-fill CTA — opens StrategyPickerModal ────────────── */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="fab-focus flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-card/50 px-4 py-3 text-left transition-colors hover:border-foreground/25 hover:bg-muted/20"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
          <Copy className="h-4 w-4 text-muted-foreground/70" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-foreground">
            Auto fill form from previous launches
          </p>
          <p className="text-[11px] text-muted-foreground">
            Clone settings from something you&apos;ve run before
          </p>
        </div>
      </button>

      {/* Strategy picker modal */}
      <StrategyPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickStrategy}
      />

      {/* Nomenclature modal */}
      <LaunchNomenclatureModal
        open={showNomenclature}
        onClose={() => setShowNomenclature(false)}
      />
    </div>
  );
}
