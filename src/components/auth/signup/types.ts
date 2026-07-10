/**
 * Shared state shape + validation helpers for the 2-step, plan-first signup
 * wizard (Figma frames 10990:44968 "Plan selection" and 10421:45965 /
 * 10506:50469 "Profile setup"). Pure UI — nothing here talks to Supabase or
 * any UMS endpoint; validation is client-side only, purely to satisfy the
 * "visual validation states" quality bar.
 */
import type { SelectablePlanId } from "@/components/auth/signup/plans";

export type BillingCycle = "monthly" | "annual";
export type ProfileMode = "individual" | "agency";

export interface SignupFormData {
  // Step 1 — Plan selection
  billing: BillingCycle;
  /** null = nothing chosen yet — drives the Step 2 disabled-CTA state
   *  ("Please select a plan to continue", Figma node under 10421:45965).
   *  Figma's static export shows Starter pre-selected by default, so that
   *  is seeded below; the null branch exists defensively (e.g. a future
   *  default change, or someone deep-linking straight to ?step=2). */
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

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Matches the Figma caption exactly (10421:45965 "Set Password" field):
 *  "Must be 8 characters, 1 numeric and 1 special character" */
export function isValidPassword(value: string): boolean {
  return value.length >= 8 && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}
