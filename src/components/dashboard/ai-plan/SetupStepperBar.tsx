import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface SetupStepperBarProps {
  className?: string;
}

interface Step {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

/**
 * SetupStepperBar — slim horizontal stepper (NOT a card, NOT a tile).
 *
 * Lives between sections of the AI-plan dashboard as a thin band
 * (~44px tall). Visually distinct from the cards around it — sits like
 * a navigation marker. Awwwards-style horizontal stepper pattern.
 *
 * Renders nothing when ≥3 of 4 steps are done (90% threshold).
 *
 * The stepper visually maps:
 *   ●━━━●━━━○━━━○   Voice ✓ · Comps ✓ · Concept → · First gen
 *   (filled) (filled) (current)  (pending)
 *
 * The "current" step pulses subtly so the eye lands on it within 0.5s.
 */
export function SetupStepperBar({ className }: SetupStepperBarProps) {
  const [dismissed, setDismissed] = useState(false);

  const steps: Step[] = useMemo(() => {
    const first = brands[0];
    const brandOk = first
      ? first.voice.length > 20 &&
        first.colors.length >= 2 &&
        first.usps.length >= 2
      : false;
    const competitorsOk = first ? first.competitors.length >= 3 : false;
    // Concept + first-gen: no live counters yet — hard-coded for the demo.
    const conceptOk = false;
    const firstGenOk = false;
    return [
      {
        id: "brand",
        label: "Brand voice",
        href: first ? `/catalogue/brands/${first.id}` : "/catalogue/brands",
        done: brandOk,
      },
      {
        id: "competitors",
        label: "Competitors",
        href: "/insights/competitors",
        done: competitorsOk,
      },
      {
        id: "concept",
        label: "Save a concept",
        href: "/iq/genie6/concepts",
        done: conceptOk,
      },
      {
        id: "first-gen",
        label: "First generation",
        href: "/iq/genie6/generate",
        done: firstGenOk,
      },
    ];
  }, []);

  const doneCount = steps.filter((s) => s.done).length;
  const currentIdx = steps.findIndex((s) => !s.done);

  if (dismissed) return null;
  if (doneCount >= steps.length - 1) return null; // Auto-hide ≥75% done

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          "relative flex items-center gap-4 px-5 py-3 rounded-2xl",
          "bg-card border border-border",
          className,
        )}
      >
        {/* Left label */}
        <div className="shrink-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Get set up
          </p>
          <p className="font-mono text-[11px] text-foreground tabular-nums mt-0.5">
            {doneCount} / {steps.length}
          </p>
        </div>

        {/* Stepper track */}
        <div className="flex-1 flex items-center min-w-0">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <Link
                to={step.href}
                className="group flex flex-col items-start gap-1 min-w-0"
                aria-current={i === currentIdx ? "step" : undefined}
              >
                <div className="flex items-center gap-2">
                  <StepNode
                    done={step.done}
                    current={i === currentIdx}
                  />
                  <span
                    className={cn(
                      "text-[11.5px] font-medium whitespace-nowrap transition-colors",
                      step.done
                        ? "text-foreground"
                        : i === currentIdx
                          ? "text-foreground group-hover:text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              </Link>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3 transition-colors",
                    step.done ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide setup stepper"
          className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function StepNode({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (current) {
    return (
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative inline-block h-4 w-4 rounded-full border-2 border-primary bg-card" />
      </span>
    );
  }
  return (
    <span className="inline-block h-4 w-4 rounded-full border-2 border-border bg-card shrink-0" />
  );
}
