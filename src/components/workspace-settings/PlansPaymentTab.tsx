import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/contexts/PlanContext";
import { ManageSubscriptionModal } from "./ManageSubscriptionModal";
import { AddonsSection } from "./sections/AddonsSection";
import { PaymentMethodsSection } from "./sections/PaymentMethodsSection";
import { PlanOverviewSection } from "./sections/PlanOverviewSection";
import { ProductsSection } from "./sections/ProductsSection";

/**
 * PlansPaymentTab — composed tab inside `/settings`.
 *
 * Single scrolling surface with 4 sections (Plan Overview · Payment Methods ·
 * Products · Add-ons). Header row carries 3 CTAs:
 *   - Invite member (secondary outline)
 *   - Manage subscription (secondary outline) → opens `<ManageSubscriptionModal />`
 *     via `?manage=open` URL param. Modal lists every active line, toggles
 *     cancellations, shows live total + "from next cycle" banner.
 *   - Upgrade plan (primary lime) → routes to `/planning`.
 *
 * Plan name is read from `usePlan()` so the header tag stays consistent with
 * the rest of the app; everything else (numerics, dates, payment cards) is
 * mocked in `mock-data.ts` for the demo.
 */
export function PlansPaymentTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { plan } = usePlan();

  const planLabel = plan === "ai" ? "AI Plan" : "Growth Plan";

  const openManageSubscription = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("manage", "open");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  return (
    <div className="flex flex-col gap-12 px-5 pb-12">
      {/* Header row: plan tag + actions */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-primary/20 text-[10px] font-bold text-foreground">
            ★
          </span>
          <span className="text-sm font-semibold text-foreground">
            {planLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Invite member
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openManageSubscription}
            aria-haspopup="dialog"
          >
            Manage subscription
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <a href="/planning">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Upgrade plan
            </a>
          </Button>
        </div>
      </header>

      <PlanOverviewSection />
      <PaymentMethodsSection />
      <ProductsSection />
      <AddonsSection />

      {/* Modal mounted at tab level; reads its own open state from URL. */}
      <ManageSubscriptionModal />
    </div>
  );
}
