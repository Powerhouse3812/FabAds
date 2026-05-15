import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";
import { PlanCard } from "./PlanCard";
import {
  AI_PLANS,
  GROWTH_PLANS,
  HEROES,
  ADD_ONS,
  type Tier,
  type View,
  type Billing,
  type PlanDef,
} from "./data";

/**
 * Pricing / plan-picker page. Three orthogonal toggles encoded in URL:
 *   ?tier=ai|growth     — AI vs Growth tier (default ai)
 *   ?view=direct|trial  — Direct purchase vs Free trial (AI tier only)
 *   ?bill=monthly|annual — billing cycle (default monthly)
 *
 * Every toggle click updates URL via setSearchParams (replace history).
 * Deep-link works — paste any URL combo to land on that exact state.
 *
 * CTA on a plan card calls `setPlan("ai" | "full")` via PlanContext +
 * toasts confirmation + navigates to /insights-v2/feed so the user sees
 * the rail update immediately. Enterprise + top-ups toast only.
 *
 * Same content (parsed from URL params) renders identically on the
 * public `/planning-print/:slug` route for html.to.design export.
 */

interface PlanningShellProps {
  /** Forces visible state in print mode. Disables URL writes + CTA actions. */
  printMode?: boolean;
  printState?: { tier: Tier; view: View; billing: Billing };
}

export function PlanningShell({ printMode = false, printState }: PlanningShellProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setPlan } = usePlan();

  // URL state hydration
  const urlTier =
    (searchParams.get("tier") as Tier) === "growth" ? "growth" : "ai";
  const urlView =
    (searchParams.get("view") as View) === "trial" ? "trial" : "direct";
  const urlBilling =
    (searchParams.get("bill") as Billing) === "annual" ? "annual" : "monthly";

  // In print mode we get state from props; otherwise from URL
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

  /* ── Hero content ── */
  const hero = HEROES[tier];
  const { headlineLead, headlineHi, headlineTail } = useMemo(() => {
    // Parse the {highlight} token in HERO headline.
    const m = hero.headline.match(/^(.*?)\{(.+?)\}(.*)$/);
    return {
      headlineLead: m?.[1] ?? hero.headline,
      headlineHi: m?.[2] ?? "",
      headlineTail: m?.[3] ?? "",
    };
  }, [hero.headline]);

  const plans: PlanDef[] = tier === "ai" ? AI_PLANS : GROWTH_PLANS;

  /* ── CTA handlers ── */
  const onPlanCta = useCallback(
    (plan: PlanDef) => {
      if (printMode) return;
      if (plan.id === "growth-enterprise") {
        toast.success("Demo: book-a-call link would open.", {
          description: "Wire to Calendly / Cal.com later.",
        });
        return;
      }
      // Tie to PlanContext: AI tier → "ai", Growth tier → "full"
      const newPlan = plan.tier === "ai" ? "ai" : "full";
      setPlan(newPlan);
      toast.success(`${plan.name} selected`, {
        description: `Plan switched to ${newPlan === "ai" ? "AI plan" : "Full plan"} — nav rail updated.`,
      });
      navigate("/insights-v2/feed");
    },
    [setPlan, navigate, printMode],
  );

  const onAddonCta = useCallback(
    (addOnId: string) => {
      if (printMode) return;
      toast.success(
        addOnId === "credits" ? "Credit top-up demo" : "Competitors add-on demo",
        {
          description: "Wire to billing flow later.",
        },
      );
    },
    [printMode],
  );

  /* ── Render ── */
  return (
    <div
      className={cn(
        "relative min-h-full w-full overflow-x-hidden",
        "px-6 pt-12 pb-20",
      )}
      data-design-export="planning-page"
      style={{
        // Subtle dot grid background (matches welcome screen)
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    >
      <div
        className={cn(
          "relative z-10 mx-auto transition-[max-width] duration-300",
          tier === "ai" ? "max-w-[840px]" : "max-w-[1180px]",
        )}
      >
        {/* HERO */}
        <div className="text-center mb-8">
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-primary/[0.06] border border-primary/25 text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-4">
            {hero.eyebrow}
          </div>
          <h1 className="text-[34px] md:text-[52px] font-bold tracking-tight leading-[1.08] text-foreground mb-3.5">
            {headlineLead}
            <span className="text-primary">{headlineHi}</span>
            {headlineTail}
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-[520px] mx-auto leading-relaxed">
            {hero.sub}
          </p>
        </div>

        {/* TIER TOGGLE (primary) */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-full p-[5px] mx-auto mb-5 w-fit">
          {(["ai", "growth"] as const).map((t) => {
            const active = tier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={cn(
                  "px-9 py-2.5 rounded-full text-[14px] transition-colors whitespace-nowrap",
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

        {/* CONTROLS — view + billing toggles */}
        <div className="flex flex-col items-center gap-3.5 mb-10">
          {/* View toggle — AI tier only (Growth is always trial) */}
          {tier === "ai" && (
            <div className="inline-flex items-center gap-[3px] bg-card border border-border rounded-full p-1">
              {(["direct", "trial"] as const).map((v) => {
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn(
                      "px-5 py-2 rounded-full text-[13px] transition-colors whitespace-nowrap",
                      active
                        ? "bg-primary/15 border border-primary/35 text-primary font-semibold"
                        : "border border-transparent text-muted-foreground hover:text-foreground font-medium",
                    )}
                    aria-pressed={active}
                  >
                    {v === "direct" ? "Direct purchase" : "Free trial"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3.5 text-[13px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "transition-colors",
                billing === "monthly"
                  ? "text-foreground font-medium"
                  : "hover:text-foreground",
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
                "relative w-[42px] h-[23px] rounded-full bg-muted border border-border transition-colors",
                billing === "annual" && "bg-primary/20 border-primary/40",
              )}
              aria-label="Toggle billing cycle"
              aria-pressed={billing === "annual"}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-[17px] w-[17px] rounded-full bg-foreground transition-all duration-200",
                  billing === "annual" ? "left-[21px]" : "left-0.5",
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={cn(
                "transition-colors",
                billing === "annual"
                  ? "text-foreground font-medium"
                  : "hover:text-foreground",
              )}
            >
              Annual
            </button>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-primary bg-primary/[0.08] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Save 2 months
            </span>
          </div>
        </div>

        {/* PLAN GRID */}
        <div
          className={cn(
            "grid gap-[18px] mb-12",
            tier === "ai"
              ? "grid-cols-1 md:grid-cols-2 max-w-[780px] mx-auto"
              : "grid-cols-1 md:grid-cols-3",
          )}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              view={view}
              billing={billing}
              onCtaClick={onPlanCta}
            />
          ))}
        </div>

        {/* ADD-ONS (AI tier only) */}
        {tier === "ai" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-[780px] mx-auto mb-10">
            {ADD_ONS.map((addon) => {
              const Icon = addon.icon;
              const descParts = addon.desc.split("{strong}");
              return (
                <div
                  key={addon.id}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/25 inline-flex items-center justify-center text-primary mb-3.5">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <p className="text-[15px] font-semibold text-foreground leading-tight tracking-tight mb-1.5">
                    {addon.title}
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-3.5 flex-1">
                    {descParts[0]}
                    <strong className="text-primary font-semibold">
                      {addon.descStrong}
                    </strong>
                    {descParts[1]}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddonCta(addon.id)}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] hover:bg-primary/90 transition-colors"
                  >
                    {addon.ctaLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer cross-link */}
        <p className="text-center text-[13px] text-muted-foreground">
          {tier === "ai" ? (
            <>
              Need full ad ops, automation, and multi platform?{" "}
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
      </div>
    </div>
  );
}
