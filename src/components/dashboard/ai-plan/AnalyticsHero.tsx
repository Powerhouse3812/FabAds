/**
 * AnalyticsHero — 4-card KPI row (A-12.191, Figma redesign).
 *
 * Strategic context (Maalik's pivot):
 *   Previous layout (A-12.187 → A-12.190) was a single asymmetric hero —
 *   AreaChart on col-7 + 2×2 KPI grid on col-5 — sitting BELOW a separate
 *   row that hosted OnboardingProgressCard. That stack ate ~480px of
 *   vertical real estate before the user hit the action launcher.
 *
 *   New Figma redesign collapses both rows into ONE: four equal-weight
 *   cards in a single row (~323 × 134 each at lg). The 4th card absorbs
 *   the OnboardingProgressCard so the dedicated onboarding row is gone.
 *
 * Card layout (lg:grid-cols-4):
 *   1. Generations  — big number + delta + decorative lime AreaChart sparkline
 *   2. Brands active — big number + delta + footer split (Ads / Creatives)
 *   3. Competitor   — big number + "/ 20" + delta + footer (top platforms)
 *   4. Setup workspace — absorbed OnboardingProgressCard (compact, gradient bg)
 *
 * Mock-data note: deterministic at module scope (no per-render randomness).
 * When the real entity lands, swap SPARK_GENS / STEPS for the live selector.
 */
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { CheckCircle2, Circle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsHeroProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mock data — seeded at module level (NOT in render)
// ─────────────────────────────────────────────────────────────────────────────

// Generations sparkline — 12 points, gently rising
const SPARK_GENS = Array.from({ length: 12 }, (_, i) => ({
  i,
  v: 8 + Math.floor(i * 0.9) + ((i * 7) % 5),
}));

// Onboarding steps (mirrors OnboardingProgressCard) — kept inline so the 4th
// card stays self-contained and decoupled from the legacy card on disk.
type StepStatus = "done" | "in-progress" | "pending";
interface OnboardingStep {
  id: string;
  label: string;
  status: StepStatus;
}

const STEPS: OnboardingStep[] = [
  { id: "brand", label: "Brand profile created", status: "done" },
  { id: "competitors", label: "Competitors added", status: "done" },
  { id: "first-brand", label: "First brand connected", status: "done" },
  { id: "email", label: "Email verification", status: "in-progress" },
  { id: "first-gen", label: "First generation", status: "pending" },
];

const DONE_COUNT = STEPS.filter((s) => s.status === "done").length;
const TOTAL = STEPS.length;
export const ONBOARDING_COMPLETE: boolean = DONE_COUNT === TOTAL;

const TOP_PLATFORMS = ["Twitter", "Facebook", "YouTube"];

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Mono caps eyebrow — Fabfunnel v1.2 spec. */
function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Big primary number — Geist 500 20px. */
function BigNumber({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[20px] font-semibold leading-none text-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Up-trend delta chip — lime success token, mini TrendingUp icon. */
function DeltaChip({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-primary/15 px-1.5 py-0.5",
        "font-mono text-[10px] font-semibold text-primary tabular-nums",
      )}
    >
      <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />+{value}%
    </span>
  );
}

/** Common 4-card shell — 134px min, rounded-2xl, soft shadow. */
const CARD_BASE =
  "min-h-[134px] rounded-2xl border border-border/60 bg-card p-4 " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col";

// ─────────────────────────────────────────────────────────────────────────────
// CARD 1 — Generations (sparkline)
// ─────────────────────────────────────────────────────────────────────────────
function CardGenerations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      {/* Header */}
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Generations</Eyebrow>
          <BigNumber>192</BigNumber>
        </div>
        <DeltaChip value={4.5} />
      </div>

      {/* Sparkline — decorative, no axes/grid/tooltip */}
      <div className="mt-auto h-[50px] w-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={SPARK_GENS}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="genSparkArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#95BC20" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#95BC20" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#95BC20"
              strokeWidth={1.75}
              fill="url(#genSparkArea)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 2 — Brands active (footer split)
// ─────────────────────────────────────────────────────────────────────────────
function CardBrandsActive() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      {/* Header */}
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Brands active</Eyebrow>
          <BigNumber>15</BigNumber>
        </div>
        <DeltaChip value={4.5} />
      </div>

      {/* Footer split — Ads | Creatives */}
      <div className="mt-auto pt-2 border-t border-border/60 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Eyebrow>Ads</Eyebrow>
          <span className="text-[13px] font-medium text-foreground tabular-nums leading-none">
            24,851
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <Eyebrow>Creatives</Eyebrow>
          <span className="text-[13px] font-medium text-foreground tabular-nums leading-none">
            134,822
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 3 — Competitor (footer pill tags)
// ─────────────────────────────────────────────────────────────────────────────
function CardCompetitor() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={CARD_BASE}
    >
      {/* Header */}
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Eyebrow>Competitor</Eyebrow>
          <div className="flex items-baseline gap-1">
            <BigNumber>15</BigNumber>
            <span className="text-[12px] font-semibold text-muted-foreground tabular-nums leading-none">
              / 20
            </span>
          </div>
        </div>
        <DeltaChip value={4.5} />
      </div>

      {/* Footer — top platforms */}
      <div className="mt-auto pt-2 border-t border-border/60 flex flex-col gap-1.5">
        <Eyebrow>Top performing</Eyebrow>
        <div className="flex items-center gap-1 flex-wrap">
          {TOP_PLATFORMS.map((p) => (
            <span
              key={p}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5",
                "bg-foreground/5 text-foreground/45 text-[11px] leading-none",
              )}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 4 — Setup workspace (absorbs OnboardingProgressCard)
// ─────────────────────────────────────────────────────────────────────────────
function CardSetupWorkspace() {
  const percent = (DONE_COUNT / TOTAL) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "min-h-[134px] rounded-2xl p-4 flex flex-col",
        "border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-card",
        "shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
      )}
    >
      {/* Eyebrow — lime-tinted */}
      <span
        className="font-mono text-[9px] uppercase tracking-[0.18em]"
        style={{ color: "#37520A" }}
      >
        Setup your workspace
      </span>

      {/* Hero row */}
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[20px] font-semibold leading-none text-foreground tabular-nums">
          {DONE_COUNT}/{TOTAL}
        </span>
        <Eyebrow>Steps completed</Eyebrow>
      </div>

      {/* Progress bar — h-1.5 lime, ~80% width */}
      <div
        className="mt-2 relative h-1.5 w-4/5 overflow-hidden rounded-full bg-muted/40"
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

      {/* Step rows — 3 compact lines (done summary + 2 explicit) */}
      <ul className="mt-2.5 flex flex-col gap-1">
        <SetupRow
          icon="done"
          label={`${DONE_COUNT} steps done`}
          pill="DONE"
        />
        <SetupRow icon="in-progress" label="Email verification" pill="VERIFY" />
        <SetupRow icon="pending" label="First generation" pill="PENDING" />
      </ul>
    </motion.div>
  );
}

interface SetupRowProps {
  icon: StepStatus;
  label: string;
  pill: "DONE" | "VERIFY" | "PENDING";
}

function SetupRow({ icon, label, pill }: SetupRowProps) {
  const isDone = icon === "done";
  const isInProgress = icon === "in-progress";

  const Icon = isDone ? CheckCircle2 : isInProgress ? Clock : Circle;
  const iconClass = isDone
    ? "text-primary"
    : isInProgress
      ? "text-amber-500"
      : "text-foreground/30";

  const labelClass = isDone
    ? "text-foreground/45 line-through"
    : "text-foreground/75";

  const pillClass =
    pill === "DONE"
      ? "text-primary/80"
      : pill === "VERIFY"
        ? "text-amber-500"
        : "text-foreground/35";

  return (
    <li className="flex items-center gap-2 min-w-0">
      <Icon
        className={cn("h-3 w-3 shrink-0", iconClass)}
        strokeWidth={2.2}
        aria-hidden
      />
      <span className={cn("text-[11.5px] leading-tight flex-1 min-w-0 truncate", labelClass)}>
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[8.5px] uppercase tracking-wider leading-none",
          pillClass,
        )}
      >
        {pill}
      </span>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export function AnalyticsHero({ className }: AnalyticsHeroProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
        className,
      )}
    >
      <CardGenerations />
      <CardBrandsActive />
      <CardCompetitor />
      <CardSetupWorkspace />
    </section>
  );
}

export default AnalyticsHero;
