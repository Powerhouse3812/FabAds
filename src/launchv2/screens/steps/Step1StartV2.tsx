/**
 * Step 1 — Start V2 (complete redesign, Genie-studio mode-selector feel).
 *
 * Design philosophy:
 *   - Objective = the entry point. Large, icon-led cards dominate the canvas.
 *     2-col grid for visual weight. Linear-style "mode selector" feel.
 *   - Strategy = INTENTS as large pill buttons (Quick start), not a form section.
 *   - Progressive disclosure: INTENTS row locked until objective is picked
 *     (CSS opacity transition only, no JS animation library).
 *   - Launch strategy section: saved strategy picker + overview pills + save-as
 *     checkbox — same as V1 addition.
 */
import { useState } from "react";
import {
  Check,
  Eye,
  MessageSquare,
  MousePointer2,
  Rocket,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { INTENTS, OBJECTIVES } from "../../data";

/* ------------------------------------------------------------------ */
/*  Objective metadata                                                  */
/* ------------------------------------------------------------------ */

type ObjIcon = React.ComponentType<{ className?: string }>;

const OBJECTIVE_META: Record<
  Objective,
  { Icon: ObjIcon; desc: string }
> = {
  OUTCOME_SALES: {
    Icon: ShoppingCart,
    desc: "Drive purchases on your website or app",
  },
  OUTCOME_AWARENESS: {
    Icon: Eye,
    desc: "Reach people most likely to recall your brand",
  },
  OUTCOME_TRAFFIC: {
    Icon: MousePointer2,
    desc: "Send people to your website or landing page",
  },
  OUTCOME_ENGAGEMENT: {
    Icon: MessageSquare,
    desc: "Get more reactions, comments, and shares",
  },
  OUTCOME_APP_PROMOTION: {
    Icon: Smartphone,
    desc: "Increase installs and in-app actions",
  },
  OUTCOME_LEADS: {
    Icon: Rocket,
    desc: "Collect leads for your business",
  },
};

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function Step1StartV2({
  flow,
  saveAsStrategy,
  onSaveAsStrategyChange,
}: {
  flow: UseFlowV2;
  saveAsStrategy: boolean;
  onSaveAsStrategyChange: (v: boolean) => void;
}) {
  const { plan } = flow;
  const { objective } = plan;

  // Launch strategy picker state — stub until strategiesService exists
  const savedStrategies: Array<{ id: string; name: string; summary: string }> = [];
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  const chooseObjective = (o: Objective) => flow.chooseObjectiveFormat(o, null);

  const applyIntent = (intentId: string) => {
    // Map INTENTS id → chooseStrategy / chooseIntent
    const intentMap: Record<string, string | null> = {
      test: "preset_test",
      scale: "preset_scale",
      custom: null,
    };
    if (intentId in intentMap) {
      flow.chooseStrategy(intentMap[intentId]);
    }
  };

  const strategyUnlocked = objective !== null;

  return (
    <div data-screen="lv2-step1-start-v2" className="space-y-8">
      {/* ── Objective heading ─────────────────────────────────────── */}
      <div>
        <h2 className="text-[16px] font-semibold text-foreground">
          What's your campaign goal?
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose the objective that matches what you want to achieve
        </p>
      </div>

      {/* ── Objective cards (hero) ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {OBJECTIVES.map((o) => {
          const { Icon, desc } = OBJECTIVE_META[o.id];
          const selected = objective === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => chooseObjective(o.id)}
              aria-pressed={selected}
              className={cn(
                "relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
              )}
            >
              {/* Icon container */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  selected ? "bg-primary/15" : "bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>

              {/* Label + description */}
              <div>
                <p className="text-[14px] font-semibold text-foreground">{o.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{desc}</p>
              </div>

              {/* Selected check — absolute top-right */}
              {selected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Quick start (INTENTS) — progressive reveal ────────────── */}
      <div
        className={cn(
          "space-y-2 transition-opacity duration-300",
          strategyUnlocked ? "opacity-100" : "pointer-events-none opacity-40",
        )}
        aria-disabled={!strategyUnlocked}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide font-mono">
          Quick start
        </p>
        <div className="flex gap-2">
          {INTENTS.map((intent) => {
            // Derive active state from plan
            const activeIntentMap: Record<string, string> = {
              preset_test: "test",
              preset_scale: "scale",
            };
            const currentIntentId = plan.strategyId
              ? (activeIntentMap[plan.strategyId] ?? "custom")
              : "custom";
            const isActive = currentIntentId === intent.id;

            return (
              <button
                key={intent.id}
                type="button"
                onClick={() => applyIntent(intent.id)}
                aria-pressed={isActive}
                disabled={!strategyUnlocked}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-foreground/20",
                )}
              >
                <p className="text-xs font-semibold text-foreground">{intent.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{intent.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Launch strategy — optional ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Launch strategy</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Optional
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Start from a saved strategy to pre-fill setup, distribution, and audience settings.
          You can still edit any field after applying.
        </p>

        {/* Strategy picker select */}
        <Select
          value={selectedStrategyId ?? "__none__"}
          onValueChange={(v) =>
            setSelectedStrategyId(v === "__none__" ? null : v)
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Choose a saved strategy…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No strategy</SelectItem>
            {savedStrategies.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {savedStrategies.length === 0 && (
          <p className="text-[11px] text-muted-foreground/60 italic">
            No strategies saved yet — complete a launch and save it as a strategy.
          </p>
        )}

        {/* Overview pills when strategy selected */}
        {selectedStrategyId && (
          <div className="flex flex-wrap gap-1.5">
            {/* Placeholder pills — will be real config values once strategiesService exists */}
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-foreground">
              Sales
            </span>
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-foreground">
              Scale
            </span>
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-foreground">
              3 accounts
            </span>
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] text-foreground">
              ₹5,000/day
            </span>
          </div>
        )}

        {/* Save as strategy checkbox */}
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={saveAsStrategy}
            onChange={(e) => onSaveAsStrategyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-primary"
          />
          <span className="text-[11px] text-muted-foreground">
            Save this launch as a reusable strategy when it completes
          </span>
        </label>
      </div>
    </div>
  );
}
