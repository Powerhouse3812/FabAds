import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { SelectablePlanId, BillingCycle } from "@/components/auth/signup/plans";
import { useAuthV2Variant } from "@/auth-v2/shared/useAuthV2Variant";
import { VariantToggle } from "@/auth-v2/shared/VariantToggle";
import DarkStageLogin from "@/auth-v2/variants/dark-stage/DarkStageLogin";
import DarkStageSignup from "@/auth-v2/variants/dark-stage/DarkStageSignup";
import LivingSplitLogin from "@/auth-v2/variants/living-split/LivingSplitLogin";
import LivingSplitSignup from "@/auth-v2/variants/living-split/LivingSplitSignup";

type AuthV2View = "login" | "signup";
type AccountType = "individual" | "agency";

const VALID_PLAN_IDS: SelectablePlanId[] = ["trial", "starter", "growth", "pro"];
const DEFAULT_PLAN_ID: SelectablePlanId = "growth";
const DEFAULT_BILLING: BillingCycle = "monthly";

function parsePlanId(raw: string | null): SelectablePlanId {
  return VALID_PLAN_IDS.includes(raw as SelectablePlanId) ? (raw as SelectablePlanId) : DEFAULT_PLAN_ID;
}

function parseBilling(raw: string | null): BillingCycle {
  return raw === "annual" ? "annual" : DEFAULT_BILLING;
}

function parseView(raw: string | null): AuthV2View {
  return raw === "signup" ? "signup" : "login";
}

/**
 * /auth-v2 — standalone exploration surface for the 2 final signup/login
 * designs (Dark Stage, Living Split), synthesized from client feedback on
 * the 11-concept gallery at /auth-concepts. Separate from that gallery and
 * from the live /auth screens — neither is touched by this page.
 *
 * Plan + billing arrive from an upstream pricing page via URL (?plan=&billing=),
 * with a sensible default when absent — there is no plan-picker here anymore,
 * only a read-only PlanOverviewCard inside each signup variant.
 */
export default function AuthV2Page() {
  const { variant } = useAuthV2Variant();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>("individual");

  const view = parseView(searchParams.get("view"));
  const planId = useMemo(() => parsePlanId(searchParams.get("plan")), [searchParams]);
  const billing = useMemo(() => parseBilling(searchParams.get("billing")), [searchParams]);

  function handleViewChange(next: AuthV2View) {
    if (next === "login") {
      setAccountType("individual");
    }
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("view", next);
        return params;
      },
      { replace: false },
    );
  }

  const commonProps = {
    view,
    onViewChange: handleViewChange,
    accountType,
    onAccountTypeChange: setAccountType,
    planId,
    billing,
  };

  const Variant =
    variant === "dark-stage"
      ? view === "login"
        ? DarkStageLogin
        : DarkStageSignup
      : view === "login"
        ? LivingSplitLogin
        : LivingSplitSignup;

  return (
    <>
      <Variant {...commonProps} />
      <VariantToggle />
    </>
  );
}
