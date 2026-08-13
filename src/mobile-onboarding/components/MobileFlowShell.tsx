import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileStepDots } from "./MobileStepDots";

export interface MobileFlowShellProps {
  /** Small mono eyebrow in the header, e.g. "Genie setup". */
  eyebrow: string;
  /** Screen headline. Doubles as the accessible name of the screen region. */
  title: ReactNode;
  /** One-line explanation under the headline. */
  subtitle?: ReactNode;

  /** 1-based step number. Pass with `stepCount` to show the indicator. */
  stepIndex?: number;
  stepCount?: number;
  stepLabel?: string;

  /** Omit to render no Back button (first screen of the flow). */
  onBack?: () => void;
  /** Dismiss the whole flow. Always present — see the note below. */
  onClose: () => void;

  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** Hides the trailing arrow on the primary button (terminal screens). */
  hidePrimaryArrow?: boolean;
  /** Optional muted line under the footer buttons (skip links, footnotes). */
  footerNote?: ReactNode;

  children: ReactNode;
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  MobileFlowShell — one screen of the mobile onboarding flow
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Layout contract (phone-first, no desktop breakpoints — this component
 *  only ever renders inside the full-screen mobile flow):
 *
 *    ┌ header ──── sticky, safe-area top ──────────────────┐
 *    │ eyebrow badge                            [ ✕ 44px ] │
 *    │ ●●○○○  Step 2 of 5 · Country                        │
 *    ├ body ────── the ONLY scroll container ──────────────┤
 *    │ H1 + subtitle                                       │
 *    │ {children}                                          │
 *    ├ footer ──── sticky, safe-area bottom ───────────────┤
 *    │ [ ← Back ]  [ Primary action              → ]       │
 *    │ footerNote                                          │
 *    └─────────────────────────────────────────────────────┘
 *
 *  ── Deliberate divergences from the web flow ──
 *
 *  1. DISMISSIBLE. Web's onboarding is a forced, non-dismissible Dialog
 *     (`src/onboarding-demo/FirstLoginOnboardingModal.tsx`) because it
 *     fires automatically on first login — there, an escape hatch would
 *     let users skip required setup. The mobile flow is the opposite
 *     situation: it is launched DELIBERATELY from the More menu, so a
 *     mis-tap must be recoverable. A permanently visible close control is
 *     therefore mandatory, not optional (NN/g #3, user control and
 *     freedom). It sits in the header on every screen, including
 *     Processing.
 *
 *  2. Outside-click still never dismisses (standing app rule, 2026-08-01,
 *     enforced in `ui/dialog.tsx`). The ✕ and the Escape key are the only
 *     ways out — that is not a contradiction of (1), it is the point:
 *     explicit control, no accidental data loss.
 *
 *  3. One question per screen instead of web's stacked sections, with the
 *     commit action pinned to a sticky footer so it is reachable by thumb
 *     regardless of body length (Fitts's law).
 *
 *  Touch + safe area: every control is ≥44px (`min-h-11`). The footer pads
 *  by `env(safe-area-inset-bottom)` and the header by
 *  `env(safe-area-inset-top)` because the app ships `viewport-fit=cover`.
 */
export function MobileFlowShell({
  eyebrow,
  title,
  subtitle,
  stepIndex,
  stepCount,
  stepLabel,
  onBack,
  onClose,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  hidePrimaryArrow = false,
  footerNote,
  children,
}: MobileFlowShellProps) {
  const showSteps = typeof stepIndex === "number" && typeof stepCount === "number";

  return (
    /* `flex-1` (not just `h-full`) so the height chain works whether the
       parent gives this a definite height or stretches it as a flex item. */
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className={cn(
          "shrink-0 border-b border-border bg-background/95 px-4 backdrop-blur",
          "pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-2.5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="min-w-0 shrink truncate border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground"
          >
            {eyebrow}
          </Badge>
          {/* Deliberate divergence from web: an always-available exit. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup"
            className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {showSteps && (
          <div className="mt-1.5">
            <MobileStepDots
              index={stepIndex}
              count={stepCount}
              label={stepLabel}
            />
          </div>
        )}
      </header>

      {/* ── Body — the only scroll container ───────────────────────── */}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-5">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
        <div className="mt-5">{children}</div>
      </main>

      {/* ── Footer — sticky commit row ─────────────────────────────── */}
      <footer
        className={cn(
          "shrink-0 border-t border-border bg-background px-4 pt-3",
          "pb-[calc(0.875rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="flex items-center gap-2.5">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="min-h-11 shrink-0 gap-1.5 px-4"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="min-h-11 flex-1 gap-1.5 text-[14px] font-semibold"
          >
            {primaryLabel}
            {!hidePrimaryArrow && <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
        {footerNote && (
          <div className="mt-2.5 text-center text-[11.5px] leading-relaxed text-muted-foreground">
            {footerNote}
          </div>
        )}
      </footer>
    </div>
  );
}
