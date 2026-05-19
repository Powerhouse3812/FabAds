import { Check, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Visible steps. Processing was deliberately removed — it's a STATE, not
 * a STEP. While processing runs, the Input dot stays active and shows a
 * loader (`processing` flag below). Maalik's call: "remove the Processing
 * step from middle, it's a state, not a step."
 */
const ONB_STEPS = [
  "Choose Mode",
  "Country",
  "Input",
  "Done",
] as const;

// Canonical step indices (the values callers pass via `active`):
//   0 = Choose Mode
//   1 = Country
//   2 = Input
//   3 = Processing  → maps onto the Input visible dot with a loader
//   4 = Done
const COUNTRY_CANONICAL_INDEX = 1;
const PROCESSING_CANONICAL_INDEX = 3;
const INPUT_CANONICAL_INDEX = 2;
const DONE_CANONICAL_INDEX = 4;

interface StepNavProps {
  /**
   * Canonical step number 0-4. Each step component continues to pass its
   * own canonical index (Processing passes 3, Done passes 4) — StepNav
   * maps these onto its 4-step visible row internally.
   */
  active: number;
  onBack?: () => void;
  backLabel?: string;
  onRestart?: () => void;
  /**
   * When `"affiliate"`, the Country dot is removed from the stepper and the
   * remaining dots smoothly slide left to fill the gap. Defaults to ecom /
   * all dots when undefined so existing callers are unaffected.
   */
  mode?: "ecom" | "affiliate";
}

/**
 * Variable-length stepper (4 dots ecom, 3 dots affiliate). Processing is
 * NOT one of the dots — when canonical active===3, the Input dot stays
 * lit with a small Loader2 spinner overlaid so the user sees "still
 * working on Input" rather than "fictional Processing step." Maalik's
 * call: states don't earn dots.
 *
 * The mapping in this file is the single source of truth:
 *   ecom:        0→Choose 1→Country 2→Input 3→Input+loader 4→Done
 *   affiliate:   0→Choose       —    2→Input 3→Input+loader 4→Done
 *
 * Visible dot count: ecom 4, affiliate 3. Choose Mode is shared, so the
 * stepper never visually expands as the user moves between profile
 * stages — that all happens within the Choose Mode page.
 */
export function StepNav({ active, onBack, backLabel, onRestart, mode }: StepNavProps) {
  const isAffiliate = mode === "affiliate";
  const SPRING = { type: "spring" as const, stiffness: 220, damping: 26 };

  // Canonical active → "what's the equivalent canonical step on the
  // visible stepper?" Processing renders as Input (with loader); Done
  // renders as Done. Everything else passes through.
  const renderActive =
    active === PROCESSING_CANONICAL_INDEX ? INPUT_CANONICAL_INDEX : active;
  const isProcessing = active === PROCESSING_CANONICAL_INDEX;

  return (
    <div className="w-full px-5 pt-5 pb-2">
      {(onBack || onRestart) && (
        <div className="mb-4 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel ?? "Back"}
            </button>
          ) : (
            <span />
          )}
          {onRestart && (
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </button>
          )}
        </div>
      )}
      <LayoutGroup id="onb-stepnav">
        <div className="flex items-center justify-center gap-y-2 flex-wrap">
          <AnimatePresence initial={false}>
            {ONB_STEPS.map((label, visibleIdx) => {
              // Map visible label index → canonical step. Choose Mode=0,
              // Country=1, Input=2, Done=4 (NOT 3 — Processing is hidden).
              const canonical =
                visibleIdx === 3 ? DONE_CANONICAL_INDEX : visibleIdx;

              // Affiliate hides the Country dot — drives AnimatePresence
              // exit animation.
              if (isAffiliate && canonical === COUNTRY_CANONICAL_INDEX) {
                return null;
              }

              const isActive = canonical === renderActive;
              const isDone = canonical < renderActive ||
                // Special case: when on Done, all prior dots count as done.
                (active === DONE_CANONICAL_INDEX && canonical < DONE_CANONICAL_INDEX);
              const isInputProcessing =
                isProcessing && canonical === INPUT_CANONICAL_INDEX;
              const isLast = visibleIdx === ONB_STEPS.length - 1;
              const connectorDone = canonical < renderActive;

              // Visible step number (1-indexed display): count the dots
              // that come BEFORE this one in the current mode.
              const displayNumber =
                visibleIdx -
                (isAffiliate && visibleIdx > COUNTRY_CANONICAL_INDEX ? 1 : 0) +
                1;

              return (
                <motion.div
                  key={label}
                  layout
                  transition={SPRING}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
                  style={{ overflow: "hidden" }}
                  className="flex items-center"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "relative h-7 w-7 rounded-full inline-flex items-center justify-center text-[12px] font-semibold border-2 transition-[background-color,border-color,color] shrink-0",
                        isDone &&
                          "bg-primary text-primary-foreground border-primary",
                        isActive &&
                          "bg-primary/20 text-foreground border-primary",
                        !isActive && !isDone &&
                          "bg-background text-muted-foreground border-border",
                      )}
                    >
                      {isInputProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isDone ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        displayNumber
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[12px] whitespace-nowrap transition-colors",
                        isActive
                          ? "font-semibold text-foreground"
                          : isDone
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {isInputProcessing ? `${label} · processing…` : label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "h-px w-6 mx-2 transition-colors shrink-0",
                        connectorDone ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}
