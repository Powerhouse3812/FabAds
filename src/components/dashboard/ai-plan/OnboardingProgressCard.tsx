import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OnboardingProgressCard — prominent setup-progress panel that mounts
 * inside AnalyticsHero's right rail (2-row span, ~280px tall).
 *
 * Strategic context (Maalik, iter A-12.191):
 *   Refactored from a step-based tracker (5 micro-steps) into a
 *   **per-module** tracker — each row is one onboarding flow
 *   (Genie / Industry Insights / Catalogue). Sub-steps live inside
 *   each module's own flow; this card only shows module-level
 *   done / in-progress / pending.
 *
 *   • Big "X / N Onboardings completed" hero number
 *   • Thin lime progress bar
 *   • Per-module rows with status icon, name, hint, and per-row CTA
 *   • No footer CTA — each row routes to its own module
 *
 * When ALL modules are done, the card renders null so the hero can
 * fall back to chart + KPI (no empty real-estate). Consumers can
 * import { ONBOARDING_COMPLETE } to flip parent column spans.
 *
 * Data: hardcoded locally — no real entitlement service yet. Real
 * wiring lands when the onboarding store exists (likely PlanContext
 * + per-module flags).
 */

type ModuleStatus = "done" | "in-progress" | "pending";

interface ModuleOnboarding {
  id: string;
  /** Display name shown in the row. */
  name: string;
  status: ModuleStatus;
  /** CTA button label. */
  ctaLabel: string;
  /** Where the CTA routes. */
  ctaHref: string;
  /** One-line hint of what's pending. Empty string when done. */
  hint?: string;
}

const MODULES: ModuleOnboarding[] = [
  {
    id: "genie",
    name: "Genie",
    status: "done",
    ctaLabel: "View",
    ctaHref: "/iq/genie6",
    hint: "",
  },
  {
    id: "insights",
    name: "Industry Insights",
    status: "in-progress",
    ctaLabel: "Continue",
    ctaHref: "/insights-v2/feed?onboarding=true",
    hint: "Fetch your first brand",
  },
  {
    id: "catalogue",
    name: "Catalogue",
    status: "pending",
    ctaLabel: "Start setup",
    ctaHref: "/iq/genie6/workspace",
    hint: "Add brand voice + USPs",
  },
];

const DONE_COUNT = MODULES.filter((m) => m.status === "done").length;
const TOTAL = MODULES.length;

/** Exposed so AnalyticsHero (parent) can flip its column spans. */
export const ONBOARDING_COMPLETE: boolean = DONE_COUNT === TOTAL;

interface OnboardingProgressCardProps {
  className?: string;
}

export function OnboardingProgressCard({
  className,
}: OnboardingProgressCardProps) {
  if (ONBOARDING_COMPLETE) return null;

  const percent = (DONE_COUNT / TOTAL) * 100;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 flex flex-col h-full",
        className,
      )}
    >
      {/* Eyebrow */}
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/70">
        Setup your workspace
      </p>

      {/* Hero number + label */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-[28px] font-semibold leading-none tabular-nums text-foreground">
          {DONE_COUNT}
          <span className="text-foreground/40"> / {TOTAL}</span>
        </span>
        <span className="text-[11.5px] text-muted-foreground leading-none">
          Onboardings completed
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-3 relative h-[1.5px] w-full overflow-hidden rounded-full bg-muted/40"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Workspace setup progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Module list */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {MODULES.map((module) => (
          <ModuleRow key={module.id} module={module} />
        ))}
      </ul>
    </section>
  );
}

/* ── Module row ── */
interface ModuleRowProps {
  module: ModuleOnboarding;
}

function ModuleRow({ module }: ModuleRowProps) {
  const isDone = module.status === "done";
  const isInProgress = module.status === "in-progress";

  const Icon = isDone ? CheckCircle2 : isInProgress ? Clock : Circle;
  const iconClass = isDone
    ? "text-primary"
    : isInProgress
      ? "text-amber-500"
      : "text-foreground/30";

  const nameClass = isDone
    ? "text-foreground/45 line-through"
    : "text-foreground";

  return (
    <li className="flex items-start gap-2">
      <Icon
        className={cn("h-4 w-4 shrink-0 mt-0.5", iconClass)}
        strokeWidth={2.2}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-[12.5px] font-medium leading-tight", nameClass)}>
          {module.name}
        </p>
        {!isDone && module.hint ? (
          <p className="mt-0.5 text-[10.5px] leading-tight text-muted-foreground">
            {module.hint}
          </p>
        ) : null}
      </div>

      {isDone ? (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] leading-none text-primary bg-primary/15 px-1.5 py-1 rounded">
          DONE
        </span>
      ) : (
        <Link
          to={module.ctaHref}
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10.5px] font-medium leading-none transition-colors",
            isInProgress
              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/15"
              : "text-foreground/80 hover:text-foreground hover:bg-muted/50",
          )}
        >
          {module.ctaLabel}
          <ArrowRight className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        </Link>
      )}
    </li>
  );
}
