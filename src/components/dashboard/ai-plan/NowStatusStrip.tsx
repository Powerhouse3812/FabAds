import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Eye,
  MessageSquare,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface NowStatusStripProps {
  className?: string;
}

/**
 * NowStatusStrip — the operational anchor for the AI-plan dashboard.
 *
 * Sits ABOVE the hero. Answers the operator's first question on every
 * login: "Am I OK today, and what needs me?" — without forcing them to
 * read 5 rows of stat tiles.
 *
 * Composition: a single horizontal strip of attention chips. Each chip
 * is glance-readable in <0.5s: icon + count + 1-2 word label. Chips
 * are clickable when there's a deep-link target.
 *
 * Chip categories (left → right):
 *   1. Credits state         (lime / amber / red — visual not text)
 *   2. New since last visit  ("3 new competitor ads · 2 saved insights")
 *   3. Needs your attention  ("5 unsaved variants · 1 brand missing voice")
 *   4. Currently in flight   (only when something IS generating)
 *
 * Tone: dashboard, not marketing. Geist Mono on numerics. No verbs
 * like "amazing" / "exciting" / "incredible." This is operator-class
 * status, not Linear's vibey homepage.
 */
export function NowStatusStrip({ className }: NowStatusStripProps) {
  /* ── Compute attention state from real mocks ── */
  const status = useMemo(() => {
    // Credits — pretend this comes from PlanContext eventually
    const credits = 73;
    const creditsMax = 100;
    const creditsHealth: "ok" | "warn" | "low" =
      credits >= 30 ? "ok" : credits >= 15 ? "warn" : "low";

    // "Needs attention" composite
    const brandsMissingVoice = brands.filter(
      (b) => !(b.voice.length > 20 && b.colors.length >= 2 && b.usps.length >= 2),
    ).length;
    const unsavedVariants = 5; // mock — comes from gen store later
    const needsCount = brandsMissingVoice + unsavedVariants;

    // "New since last visit" — mocked. Real wiring later via last-seen timestamp.
    const newCompetitorAds = 3;
    const newInsights = 2;
    const newCount = newCompetitorAds + newInsights;

    // In-flight generation — mock false for now; flip via URL ?gen=active for demo
    const inFlight = false;

    // Setup chip — absorbs the standalone SetupStepperBar (iter 5).
    // Computed from real mocks. Done count maxes at 4 steps.
    const first = brands[0];
    const brandOk = first
      ? first.voice.length > 20 &&
        first.colors.length >= 2 &&
        first.usps.length >= 2
      : false;
    const competitorsOk = first ? first.competitors.length >= 3 : false;
    // Concept + first-gen: no live counters yet — hard-coded false until
    // there's a real session store.
    const conceptOk = false;
    const firstGenOk = false;
    const setupDoneCount = [
      brandOk,
      competitorsOk,
      conceptOk,
      firstGenOk,
    ].filter(Boolean).length;
    const setupTotal = 4;
    const showSetupChip = setupDoneCount < setupTotal;

    return {
      credits,
      creditsMax,
      creditsHealth,
      brandsMissingVoice,
      unsavedVariants,
      needsCount,
      newCompetitorAds,
      newInsights,
      newCount,
      inFlight,
      setupDoneCount,
      setupTotal,
      showSetupChip,
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "flex items-center gap-2 flex-wrap",
        "px-1 py-1",
        className,
      )}
    >
      {/* In-flight generation indicator — only when active */}
      {status.inFlight && (
        <Chip
          variant="live"
          icon={Wand2}
          label="Generating"
          detail="UGC Video · Boat"
          href="/iq/genie6/library?status=processing"
        />
      )}

      {/* Credits */}
      <Chip
        variant={
          status.creditsHealth === "ok"
            ? "ok"
            : status.creditsHealth === "warn"
              ? "warn"
              : "low"
        }
        icon={status.creditsHealth === "low" ? AlertTriangle : Zap}
        label={
          <>
            <span className="font-mono tabular-nums">{status.credits}</span>
            <span className="text-muted-foreground">/{status.creditsMax}</span>
          </>
        }
        detail="credits"
        href="/plans-v2"
      />

      {/* New since last visit */}
      {status.newCount > 0 && (
        <Chip
          variant="info"
          icon={Sparkles}
          label={
            <>
              <span className="font-mono tabular-nums">{status.newCount}</span>{" "}
              new
            </>
          }
          detail={`${status.newCompetitorAds} competitor ads · ${status.newInsights} insights`}
          href="/insights-v2/feed"
        />
      )}

      {/* Needs attention */}
      {status.needsCount > 0 && (
        <Chip
          variant="attention"
          icon={MessageSquare}
          label={
            <>
              <span className="font-mono tabular-nums">{status.needsCount}</span>{" "}
              need you
            </>
          }
          detail={`${status.unsavedVariants} unsaved · ${status.brandsMissingVoice} brand setup`}
          href="/iq/genie6/library?filter=unsaved"
        />
      )}

      {/* Setup progress (iter 5 — absorbed from SetupStepperBar) */}
      {status.showSetupChip && (
        <Chip
          variant="info"
          icon={Compass}
          label={
            <>
              Setup{" "}
              <span className="font-mono tabular-nums">
                {status.setupDoneCount}/{status.setupTotal}
              </span>
            </>
          }
          detail="finish to unlock better outputs"
          href="/insights-v2/feed?onboarding=true"
        />
      )}

      {/* All clear marker — only if nothing needs attention AND credits are OK */}
      {status.creditsHealth === "ok" &&
        status.needsCount === 0 &&
        status.newCount === 0 && (
          <Chip
            variant="ok"
            icon={CheckCircle2}
            label="All caught up"
            detail="nothing urgent"
          />
        )}
    </motion.div>
  );
}

/* ── Chip — the glance-readable unit ── */
type ChipVariant = "ok" | "warn" | "low" | "info" | "attention" | "live";

interface ChipProps {
  variant: ChipVariant;
  icon: typeof Eye;
  label: React.ReactNode;
  detail?: string;
  href?: string;
}

function Chip({ variant, icon: Icon, label, detail, href }: ChipProps) {
  const styles: Record<ChipVariant, { ring: string; icon: string; bg: string }> =
    {
      ok: {
        ring: "border-primary/30 hover:border-primary/50",
        icon: "text-primary",
        bg: "bg-primary/[0.04]",
      },
      warn: {
        ring: "border-amber-400/40 hover:border-amber-400/60",
        icon: "text-amber-500",
        bg: "bg-amber-400/[0.04]",
      },
      low: {
        ring: "border-destructive/40 hover:border-destructive/60",
        icon: "text-destructive",
        bg: "bg-destructive/[0.04]",
      },
      info: {
        ring: "border-border hover:border-foreground/20",
        icon: "text-foreground/70",
        bg: "bg-card",
      },
      attention: {
        ring: "border-foreground/20 hover:border-foreground/30",
        icon: "text-foreground/80",
        bg: "bg-card",
      },
      live: {
        ring: "border-primary/40 hover:border-primary/60",
        icon: "text-primary",
        bg: "bg-primary/[0.06]",
      },
    };
  const s = styles[variant];

  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        "text-[12px] font-medium transition-colors whitespace-nowrap",
        s.ring,
        s.bg,
      )}
    >
      {variant === "live" ? (
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          <motion.span
            aria-hidden
            className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      ) : (
        <Icon className={cn("h-3.5 w-3.5", s.icon)} strokeWidth={2.2} />
      )}
      <span className="text-foreground leading-none">{label}</span>
      {detail && (
        <span className="text-muted-foreground text-[11px] leading-none border-l border-border/60 pl-2">
          {detail}
        </span>
      )}
    </span>
  );

  if (href) {
    return <Link to={href}>{inner}</Link>;
  }
  return inner;
}
