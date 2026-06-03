import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";
import { PlanCardV2 } from "./PlanCardV2";
import {
  AI_PLANS_V2,
  GROWTH_PLANS_V2,
  type Tier,
  type View,
  type Billing,
  type PlanDef,
} from "./data";

/**
 * Plan-selection modal V2 — minimal, no-scroll, designed for new users.
 *
 * Differences from V1 (`src/planning/PlanningShell.tsx`):
 *   - Renders as a centered modal with X close (not a full page)
 *   - No hero headline / eyebrow / sub
 *   - No add-ons section
 *   - 4-item highlight list per card (curated) instead of full 6-bucket list
 *   - One tier visible at a time — toggle at top
 *   - All toggles in a single row to save vertical
 *   - No dot-grid background
 *
 * Same URL state shape as V1 (`?tier=…&view=…&bill=…`) so deep-links work
 * across both V1 and V2.
 *
 * The modal is NOT rendered via Radix DialogPrimitive.Portal — we render
 * inline so html.to.design can scrape it cleanly (same pattern as
 * brand-book-print / onboarding-print).
 */
interface PlanModalV2Props {
  /** Called when user clicks X. If omitted, navigates back via history. */
  onClose?: () => void;
  /** Force a state in print/static mode. Disables URL writes + CTAs. */
  printMode?: boolean;
  printState?: { tier: Tier; view: View; billing: Billing };
}

export function PlanModalV2({
  onClose,
  printMode = false,
  printState,
}: PlanModalV2Props = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setPlan } = usePlan();

  // URL state
  const urlTier =
    (searchParams.get("tier") as Tier) === "growth" ? "growth" : "ai";
  const urlView =
    (searchParams.get("view") as View) === "trial" ? "trial" : "direct";
  const urlBilling =
    (searchParams.get("bill") as Billing) === "annual" ? "annual" : "monthly";

  const tier = printMode ? printState?.tier ?? "ai" : urlTier;
  const view = printMode ? printState?.view ?? "direct" : urlView;
  const billing = printMode ? printState?.billing ?? "monthly" : urlBilling;

  /* ── URL writers ── */
  const updateParam = useCallback(
    (key: string, value: string) => {
      if (printMode) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, printMode],
  );

  const setTier = useCallback(
    (next: Tier) => updateParam("tier", next),
    [updateParam],
  );
  const setView = useCallback(
    (next: View) => updateParam("view", next),
    [updateParam],
  );
  const setBilling = useCallback(
    (next: Billing) => updateParam("bill", next),
    [updateParam],
  );

  /* ── CTA handlers ── */
  const handleClose = useCallback(() => {
    if (printMode) return;
    if (onClose) onClose();
    else navigate(-1);
  }, [onClose, navigate, printMode]);

  const onPlanCta = useCallback(
    (plan: PlanDef) => {
      if (printMode) return;

      // Enterprise — book-a-call toast (no plan switch, no navigate).
      if (plan.id === "growth-enterprise") {
        toast.success("Demo: book-a-call link would open.", {
          description: "Wire to Calendly / Cal.com later.",
        });
        return;
      }

      const newPlan = plan.tier === "ai" ? "ai" : "full";
      setPlan(newPlan);

      // Destination per tier. The plan-pick is psychologically a "I just paid
      // for X — show me X." AI users land on Industry Insights (an AI-plan
      // staple). Growth users land on Launch — the flagship Growth-only
      // feature they just unlocked. Demonstrating the unlock immediately
      // beats dumping them on a generic dashboard.
      const destination = plan.tier === "ai" ? "/insights-v2/feed" : "/launch";

      toast.success(`${plan.name} selected`, {
        description: `Plan switched to ${
          newPlan === "ai" ? "AI plan" : "Full plan"
        } — nav rail updated.`,
      });
      navigate(destination);
    },
    [setPlan, navigate, printMode],
  );

  /* ── Compare-plans CTA (dummy — wires to marketing site later) ── */
  const onCompareClick = useCallback(() => {
    if (printMode) return;
    toast.success("Demo: compare-plans page would open.", {
      description: "Wire to marketing-site /pricing comparison later.",
    });
  }, [printMode]);

  /* ── Esc to close ── */
  useEffect(() => {
    if (printMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, printMode]);

  const plans: PlanDef[] = tier === "ai" ? AI_PLANS_V2 : GROWTH_PLANS_V2;
  const density: "compact" | "wide" = tier === "ai" ? "wide" : "compact";

  /* ── Render ── */
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        printMode && "relative inset-auto",
      )}
      data-design-export="planning-modal-v2"
    >
      {/* Backdrop */}
      {!printMode && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
          onClick={handleClose}
          aria-hidden
        />
      )}

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pick a plan"
        className={cn(
          "relative bg-card border border-border rounded-3xl shadow-2xl",
          "w-[min(1180px,calc(100vw-32px))]",
          "max-h-[calc(100vh-32px)]",
          "p-5",
          "flex flex-col gap-3.5",
        )}
      >
        {/* Header — title + close (compressed to keep more room for cards) */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-foreground leading-tight">
              Pick a plan
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
              {tier === "ai"
                ? "Start solo or roll out across the team. Powered by Genie."
                : "Real ad ops — bulk launch, automation, multi-account reporting."}
            </p>
          </div>
          {!printMode && (
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 h-8 w-8 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </header>

        {/* Controls — all toggles in one row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tier pill toggle */}
          <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-full p-[3px]">
            {(["ai", "growth"] as const).map((t) => {
              const active = tier === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "px-5 py-1.5 rounded-full text-[12.5px] transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground font-medium",
                  )}
                  aria-pressed={active}
                >
                  {t === "ai" ? "AI" : "Growth"}
                </button>
              );
            })}
          </div>

          {/* View segmented — both tiers. Growth Starter/Pro now expose the
              same Direct / Free-trial selection AI has (previously hidden, so
              Growth was trial-only with no instant-access path). Growth
              Enterprise ignores it and stays "Book a call". */}
          {(tier === "ai" || tier === "growth") && (
            <div className="flex items-center gap-[3px] bg-muted/50 border border-border rounded-full p-[3px]">
              {(["direct", "trial"] as const).map((v) => {
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-[12px] transition-colors whitespace-nowrap",
                      active
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground font-medium",
                    )}
                    aria-pressed={active}
                  >
                    {v === "direct" ? "Direct" : "Free trial"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Billing switch */}
          <div className="ml-auto inline-flex items-center gap-2.5 text-[12px]">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "transition-colors",
                billing === "monthly"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() =>
                setBilling(billing === "monthly" ? "annual" : "monthly")
              }
              className={cn(
                "relative w-[38px] h-[21px] rounded-full bg-muted border border-border transition-colors",
                billing === "annual" && "bg-primary/20 border-primary/40",
              )}
              aria-label="Toggle billing cycle"
              aria-pressed={billing === "annual"}
            >
              <span
                className={cn(
                  "absolute top-[1px] h-[15px] w-[15px] rounded-full bg-foreground transition-all duration-200",
                  billing === "annual" ? "left-[20px]" : "left-[2px]",
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={cn(
                "transition-colors",
                billing === "annual"
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Annual
            </button>
            <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/[0.08] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Save 2 mo
            </span>
          </div>
        </div>

        {/* Plan grid — flex-1 so cards fill remaining vertical space; min-h-0
            lets children shrink if a small viewport forces it. */}
        <div
          className={cn(
            "grid gap-3 flex-1 min-h-0",
            tier === "ai"
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-3",
          )}
        >
          {plans.map((plan) => (
            <PlanCardV2
              key={plan.id}
              plan={plan}
              view={view}
              billing={billing}
              onCtaClick={onPlanCta}
              density={density}
            />
          ))}
        </div>

        {/* Footer — Compare CTA + tier cross-link in a single row.
            "Compare all plans" is the dummy outbound — would redirect to
            marketing-site /pricing where the full side-by-side table
            lives. Cards in the modal stay summarised; comparison lives
            outside. */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-[11.5px] text-muted-foreground">
            {tier === "ai" ? (
              <>
                Need full ad ops?{" "}
                <button
                  type="button"
                  onClick={() => setTier("growth")}
                  className="text-primary font-medium hover:underline"
                >
                  See Growth plans →
                </button>
              </>
            ) : (
              <>
                Just need creative generation?{" "}
                <button
                  type="button"
                  onClick={() => setTier("ai")}
                  className="text-primary font-medium hover:underline"
                >
                  See AI plans →
                </button>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={onCompareClick}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-border bg-card hover:bg-muted hover:border-foreground/30 text-[12px] font-semibold text-foreground transition-colors"
            aria-label="Compare all plans (opens marketing site)"
          >
            Compare all plans
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}
