import { Check, RotateCcw, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

const ONB_STEPS = [
  "Choose Mode",
  "Country",
  "Input",
  "Processing",
  "Done",
] as const;

// Canonical index of the Country step in ONB_STEPS. In affiliate mode this
// dot is hidden and the surrounding row reflows.
const COUNTRY_CANONICAL_INDEX = 1;

interface StepNavProps {
  active: number; // canonical 0-4 (5 wizard steps; Welcome is pre-stepper at step -1)
  onBack?: () => void;
  backLabel?: string;
  onRestart?: () => void;
  /**
   * When `"affiliate"`, the Country dot is removed from the stepper and the
   * remaining dots smoothly slide left to fill the gap. Defaults to ecom /
   * all 5 dots when undefined so existing callers are unaffected.
   */
  mode?: "ecom" | "affiliate";
}

/**
 * Variable-length stepper (5 dots for ecom, 4 for affiliate). The Country
 * dot animates in/out via framer-motion + LayoutGroup so the count change
 * feels intentional rather than glitchy.
 *
 * Approach: LayoutGroup wraps the row so every motion child shares the same
 * layout context. AnimatePresence wraps the mapped list so removing the
 * Country dot (and its trailing connector) plays an `exit` animation that
 * collapses width to 0 and fades opacity to 0; sibling dots ride a `layout`
 * spring leftward to fill the gap. Spring tuned to settle inside ~400ms.
 *
 * Callers continue to pass canonical `active` indices (0=Choose, 1=Country,
 * 2=Input, 3=Processing, 4=Done). In affiliate mode `active === 1` should
 * never be passed; any active >= 2 still works because we filter by key,
 * not by visible position.
 */
export function StepNav({ active, onBack, backLabel, onRestart, mode }: StepNavProps) {
  const isAffiliate = mode === "affiliate";
  const SPRING = { type: "spring" as const, stiffness: 220, damping: 26 };

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
            {ONB_STEPS.map((label, i) => {
              // In affiliate mode skip Country — AnimatePresence runs the
              // exit animation defined on the motion.div below.
              if (isAffiliate && i === COUNTRY_CANONICAL_INDEX) return null;

              const isActive = i === active;
              const isDone = i < active;
              const isLast = i === ONB_STEPS.length - 1;
              // The connector "done" color tracks canonical active index so
              // Choose→Input lights up the moment Input becomes active in
              // affiliate mode.
              const connectorDone = i < active;

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
                        "h-7 w-7 rounded-full inline-flex items-center justify-center text-[12px] font-semibold border-2 transition-[background-color,border-color,color] shrink-0",
                        isDone &&
                          "bg-primary text-primary-foreground border-primary",
                        isActive &&
                          "bg-primary/20 text-foreground border-primary",
                        !isActive && !isDone &&
                          "bg-background text-muted-foreground border-border",
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
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
                      {label}
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
