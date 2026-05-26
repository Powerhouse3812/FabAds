import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OnboardingProgressCard — prominent setup-progress panel that mounts
 * inside AnalyticsHero's right column, beside the KPI grid.
 *
 * Strategic context (Maalik, iter A-12.189):
 *   Onboarding state was previously a single chip in NowStatusStrip
 *   ("Setup 2/4"). That chip was too small for what is actually the
 *   most important state the user has — completing their workspace
 *   setup. Promote it into a full card with:
 *     • Big "X / N" hero number
 *     • Thin lime progress bar
 *     • Per-step list with done / in-progress / pending icons
 *     • Continue-setup CTA
 *
 * When ALL steps are done, the card renders null so the hero can
 * fall back to chart + KPI (no empty real-estate). Consumers can
 * import { ONBOARDING_COMPLETE } to flip parent column spans.
 *
 * Data: mocked locally. Real wiring lands when the onboarding store
 * exists (likely PlanContext + auth flags).
 */

type OnboardingStatus = "done" | "pending" | "in-progress";

interface OnboardingStep {
  id: string;
  label: string;
  status: OnboardingStatus;
  ctaHref?: string;
}

const STEPS: OnboardingStep[] = [
  { id: "brand", label: "Brand profile created", status: "done" },
  { id: "competitors", label: "Competitors added", status: "done" },
  {
    id: "email",
    label: "Email verification",
    status: "in-progress",
    ctaHref: "/insights-v2/feed?onboarding=true&step=email",
  },
  { id: "first-gen", label: "First generation", status: "pending" },
  { id: "concept", label: "Save a concept preset", status: "pending" },
];

const DONE_COUNT = STEPS.filter((s) => s.status === "done").length;
const TOTAL = STEPS.length;

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
        "rounded-2xl border border-border/60 bg-card p-4 flex flex-col max-w-3xl",
        className,
      )}
    >
      {/* Eyebrow */}
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
        Set up your workspace
      </p>

      {/* Hero number + label */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-[28px] font-semibold leading-none tabular-nums text-foreground">
          {DONE_COUNT}
          <span className="text-foreground/40"> / {TOTAL}</span>
        </span>
        <span className="text-[11.5px] text-muted-foreground leading-none">
          steps completed
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-3 relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40"
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

      {/* Step list — 2-col grid at sm+ so the card reads horizontal
          when mounted as a full-width row (A-12.190). */}
      <ul className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {STEPS.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-3.5 pt-3 border-t border-border/60">
        <Link
          to="/insights-v2/feed?onboarding=true"
          className="inline-flex items-center gap-1 text-[11.5px] text-foreground/80 transition-colors hover:text-foreground"
        >
          Continue setup
          <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  );
}

/* ── Step row ── */
interface StepRowProps {
  step: OnboardingStep;
}

function StepRow({ step }: StepRowProps) {
  const isDone = step.status === "done";
  const isInProgress = step.status === "in-progress";

  const Icon = isDone ? CheckCircle2 : isInProgress ? Clock : Circle;
  const iconClass = isDone
    ? "text-primary"
    : isInProgress
      ? "text-amber-500"
      : "text-foreground/30";

  const labelClass = isDone
    ? "text-foreground/45 line-through"
    : "text-foreground/75";

  const statusLabel: string | null = isDone
    ? "DONE"
    : isInProgress
      ? "VERIFY"
      : "PENDING";

  const statusClass = isDone
    ? "text-primary/70"
    : isInProgress
      ? "text-amber-500"
      : "text-foreground/35";

  return (
    <li className="flex items-center gap-2">
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", iconClass)}
        strokeWidth={2.2}
        aria-hidden
      />
      <span className={cn("text-[12px] leading-tight flex-1 min-w-0", labelClass)}>
        {step.label}
      </span>
      {statusLabel && (
        <span
          className={cn(
            "font-mono text-[9.5px] uppercase tracking-[0.14em] leading-none",
            statusClass,
          )}
        >
          {statusLabel}
        </span>
      )}
    </li>
  );
}
