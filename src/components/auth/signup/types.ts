/**
 * Shared state shape + validation helpers for the 2-step, plan-first signup
 * wizard (Figma frames 10990:44968 "Plan selection" and 10421:45965 /
 * 10506:50469 "Profile setup"). Pure UI — nothing here talks to Supabase or
 * any UMS endpoint; validation is client-side only, purely to satisfy the
 * "visual validation states" quality bar.
 */
import type { SelectablePlanId } from "@/components/auth/signup/plans";
import { EMAIL_RE, isValidEmail, isValidPassword } from "@/components/auth/validators";

export { EMAIL_RE, isValidEmail, isValidPassword };

export type BillingCycle = "monthly" | "annual";
export type ProfileMode = "individual" | "agency";

export interface SignupFormData {
  // Step 1 — Plan selection
  billing: BillingCycle;
  /** null = nothing chosen. Defaults to "starter" below (matches the Figma
   *  static export, which shows Starter pre-selected AND pre-expanded) —
   *  Step 1 previously seeded this null while still rendering Starter
   *  pre-expanded, which meant "Next" sat disabled with zero explanation
   *  even though the UI visually implied a plan was already chosen (a UX
   *  audit flagged this as a "disabled button without explanation"
   *  regression). The disabled-CTA states (Step 1 "Next" / Step 2 "Please
   *  select a plan to continue") remain reachable by clearing the
   *  selection — there's no code path that requires a plan on mount. */
  selectedPlan: SelectablePlanId | null;

  // Step 2 — Profile setup
  profileMode: ProfileMode;
  /** Individual tab (Figma 10421:45965) */
  fullName: string;
  email: string;
  /** Agency tab (Figma 10506:50469) */
  agencyName: string;
  adminEmail: string;
  countryCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const INITIAL_SIGNUP_DATA: SignupFormData = {
  billing: "monthly",
  selectedPlan: "starter",
  profileMode: "individual",
  fullName: "",
  email: "",
  agencyName: "",
  adminEmail: "",
  countryCode: "+36",
  phone: "",
  password: "",
  confirmPassword: "",
};

/** Figma node under 10421:45965's phone field — the country select shows
 *  "+36" (Hungary flag) as the mock default alongside placeholder
 *  "(20) 123-4567". Brief calls for "a few static options (+1, +36, +44,
 *  +91…)" — kept short since this is pure UI with no real i18n/phone
 *  validation behind it. */
export const COUNTRY_CODES: { code: string; flag: string }[] = [
  { code: "+1", flag: "🇺🇸" },
  { code: "+36", flag: "🇭🇺" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+91", flag: "🇮🇳" },
];
