import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  ExternalLink,
  User,
  Mail,
  Phone,
} from "lucide-react";

import {
  AUTH_CONCEPT_COPY,
  SIGNUP_PLANS_COPY,
  SIGNUP_PROFILE_COPY,
} from "@/auth-concepts/shared/formSpec";
import {
  PAID_PLANS,
  TRIAL_PLAN,
  ANNUAL_SAVINGS_LABEL,
  priceForBilling,
  annualSavings,
  type BillingCycle,
  type SelectablePlanId,
} from "@/components/auth/signup/plans";

import fabadsLogoDark from "@/assets/fabads-logo-dark.svg";
import signupPlanLogo from "@/assets/auth/signup-plan-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";
import heroLogo from "@/assets/auth/hero-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

/**
 * Concept 08 — "Stepper in scene" (godmode rework)
 *
 * Split-screen auth. The form side holds the canonical, functionally
 * identical fields. The scene side is where this concept earns its name:
 *
 * - `?view=login` — the scene auto-cycles between two "what's inside"
 *   preview states every 4s (unchanged mechanic from the original demo).
 * - `?view=signup` — the cycle is KILLED. The scene now SYNCS to the real
 *   `?step` the user is on: a literal 2-node stepper (numbered dots +
 *   connecting line + done-check) renders inside the scene, and the whole
 *   atmosphere — gradient, floating glyphs, hero art — re-themes per step.
 *   Step 1 ("Plan selection") gets floating price glyphs and the product
 *   mockup rising out of the floor with a soft reflection. Step 2 ("Profile
 *   setup") gets a completion ring + floating field chips + the hero
 *   wordmark as a watermark. Picking a plan pulses the scene; going back
 *   slides the scene the other way — same position-based transform, so the
 *   direction reverses for free.
 */

type ProfileMode = "individual" | "agency";

interface LoginDemoState {
  eyebrow: string;
  heading: string;
  subcopy: string;
  gradient: string;
  orbPrimary: string;
  orbSecondary: string;
  badgeClass: string;
  iconClass: string;
}

const LOGIN_DEMO_STATES: LoginDemoState[] = [
  {
    eyebrow: "Step 1 of 2",
    heading: "Let's get started",
    subcopy: "Your campaigns, organized in one place.",
    gradient:
      "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(circle at 82% 78%, rgba(163,230,53,0.16), transparent 60%), #14171c",
    orbPrimary: "bg-indigo-400/25",
    orbSecondary: "bg-primary/15",
    badgeClass: "border-white/15 bg-white/5 text-foreground",
    iconClass: "text-foreground/70",
  },
  {
    eyebrow: "Step 2 of 2",
    heading: "Almost there",
    subcopy: "Set up takes less than 2 minutes.",
    gradient:
      "radial-gradient(circle at 25% 25%, rgba(163,230,53,0.4), transparent 55%), radial-gradient(circle at 78% 72%, rgba(250,204,21,0.16), transparent 60%), #15181d",
    orbPrimary: "bg-primary/35",
    orbSecondary: "bg-amber-300/15",
    badgeClass: "border-primary/50 bg-primary/10 text-primary-text",
    iconClass: "text-primary",
  },
];

const CYCLE_MS = 4000;

const STEP1_GRADIENT =
  "radial-gradient(circle at 14% 14%, rgba(163,230,53,0.28), transparent 55%), radial-gradient(circle at 86% 32%, rgba(56,189,248,0.16), transparent 60%), #12151a";
const STEP2_GRADIENT =
  "radial-gradient(circle at 82% 18%, rgba(250,204,21,0.22), transparent 55%), radial-gradient(circle at 18% 82%, rgba(163,230,53,0.24), transparent 60%), #14171d";

/** Purely decorative — floating price glyphs behind the step-1 scene copy.
 *  Zipped by index against PAID_PLANS below. */
const PRICE_GLYPH_POSITIONS: { top: string; left: string; fontSize: number; delay: string }[] = [
  { top: "14%", left: "9%", fontSize: 84, delay: "0s" },
  { top: "58%", left: "74%", fontSize: 116, delay: "1.5s" },
  { top: "9%", left: "68%", fontSize: 60, delay: "3s" },
];

/** Shared Google "G" mark — reused by both the login and signup buttons. */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2 13.9-5.4l-6.4-5.4C29.5 34.9 26.9 36 24 36c-5.4 0-9.9-3.4-11.5-8.2l-6.5 5C9.7 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.6-6.4 7.1l6.4 5.4C39.5 37.5 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function pillClass(active: boolean) {
  return `rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
  }`;
}

function BillingPill({ value, onChange }: { value: BillingCycle; onChange: (v: BillingCycle) => void }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      <button type="button" onClick={() => onChange("monthly")} className={pillClass(value === "monthly")}>
        {SIGNUP_PLANS_COPY.monthlyLabel}
      </button>
      <button type="button" onClick={() => onChange("annual")} className={pillClass(value === "annual")}>
        {SIGNUP_PLANS_COPY.annualLabel}
      </button>
    </div>
  );
}

function ModePill({ value, onChange }: { value: ProfileMode; onChange: (v: ProfileMode) => void }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      <button type="button" onClick={() => onChange("individual")} className={pillClass(value === "individual")}>
        {SIGNUP_PROFILE_COPY.individualTabLabel}
      </button>
      <button type="button" onClick={() => onChange("agency")} className={pillClass(value === "agency")}>
        {SIGNUP_PROFILE_COPY.agencyTabLabel}
      </button>
    </div>
  );
}

function RadioDotInline({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
        selected ? "border-primary" : "border-border"
      }`}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
    </span>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-[28px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary-text";

export default function Concept08StepperInScene() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = searchParams.get("step") === "2" ? 2 : 1;

  const goToView = (v: "login" | "signup") => setSearchParams(v === "login" ? {} : { view: "signup" });
  const goToStep = (next: 1 | 2) =>
    setSearchParams(next === 1 ? { view: "signup" } : { view: "signup", step: "2" });

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Login-only scene demo — auto-cycles, only while the login view is live.
  const [demoStep, setDemoStep] = useState(0);
  useEffect(() => {
    if (view !== "login") return;
    const id = window.setInterval(() => {
      setDemoStep((s) => (s + 1) % LOGIN_DEMO_STATES.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [view]);

  // Signup step 1 — plan selection
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");
  const [pulseTick, setPulseTick] = useState(0);
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (pulseTick === 0) return;
    setPulsing(true);
    const t = window.setTimeout(() => setPulsing(false), 600);
    return () => window.clearTimeout(t);
  }, [pulseTick]);
  const selectPlan = (id: SelectablePlanId) => {
    setSelectedPlan(id);
    setPulseTick((n) => n + 1);
  };
  const ctaLabel = selectedPlan === "trial" ? SIGNUP_PLANS_COPY.ctaTrialLabel : SIGNUP_PLANS_COPY.ctaPaidLabel;
  const selectedPlanName =
    selectedPlan === "trial" ? TRIAL_PLAN.name : PAID_PLANS.find((p) => p.id === selectedPlan)?.name ?? null;

  // Signup step 2 — profile setup
  const [profileMode, setProfileMode] = useState<ProfileMode>("individual");
  const [fullName, setFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="dark flex min-h-[100dvh] w-full bg-background text-foreground">
      <style>{`
        .c08-scene-layer {
          transition: opacity 700ms ease, transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .c08-dot {
          transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1), background-color 500ms ease, opacity 500ms ease;
        }
        .c08-orb {
          animation: c08-drift 9s ease-in-out infinite;
        }
        @keyframes c08-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.06); }
        }
        .c08-plan-pulse {
          background: radial-gradient(circle at 50% 40%, rgba(163,230,53,0.35), transparent 60%);
          animation: c08-pulse-flash 600ms ease-out;
        }
        @keyframes c08-pulse-flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Form side — fixed, canonical fields only */}
      <div className="flex w-full flex-1 items-start justify-center overflow-y-auto px-6 py-14 lg:w-[46%] lg:flex-none">
        <div className={view === "signup" ? "w-full max-w-md" : "w-full max-w-sm"}>
          <img src={fabadsLogoDark} alt="FabAds" className="mb-8 h-6 w-auto" />

          {view === "login" ? (
            <>
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {AUTH_CONCEPT_COPY.heading}{" "}
                <span aria-hidden="true">{AUTH_CONCEPT_COPY.headingEmoji}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{AUTH_CONCEPT_COPY.subheading}</p>

              <form
                className="mt-8 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="space-y-1.5">
                  <label htmlFor="c08-email" className="text-xs font-medium text-muted-foreground">
                    {AUTH_CONCEPT_COPY.emailLabel}
                  </label>
                  <input
                    id="c08-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={AUTH_CONCEPT_COPY.emailPlaceholder}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="c08-password" className="text-xs font-medium text-muted-foreground">
                      {AUTH_CONCEPT_COPY.passwordLabel}
                    </label>
                    <button
                      type="button"
                      className="fab-focus rounded-sm text-xs font-medium text-primary-text hover:opacity-80"
                    >
                      {AUTH_CONCEPT_COPY.forgotLabel}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="c08-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={AUTH_CONCEPT_COPY.passwordPlaceholder}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="fab-focus absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-card accent-primary"
                  />
                  {AUTH_CONCEPT_COPY.rememberLabel}
                </label>

                <button
                  type="submit"
                  className="fab-focus w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {AUTH_CONCEPT_COPY.submitLabel}
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{AUTH_CONCEPT_COPY.dividerLabel}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  className="fab-focus flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                >
                  <GoogleIcon />
                  {AUTH_CONCEPT_COPY.googleLabel}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                {AUTH_CONCEPT_COPY.signupPromptLabel}{" "}
                <button
                  type="button"
                  onClick={() => goToView("signup")}
                  className="fab-focus rounded-sm font-medium text-primary-text hover:opacity-80"
                >
                  {AUTH_CONCEPT_COPY.signupLinkLabel}
                </button>
              </p>
            </>
          ) : step === 1 ? (
            <>
              <img src={signupPlanLogo} alt="FabAds" className="mb-4 h-6 w-auto" />
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {SIGNUP_PLANS_COPY.heading}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{SIGNUP_PLANS_COPY.subheading}</p>

              <div className="relative mt-6 inline-block">
                <BillingPill value={billing} onChange={setBilling} />
                {billing === "annual" && (
                  <img
                    src={save20Scribble}
                    alt={ANNUAL_SAVINGS_LABEL}
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-14 -top-7 h-10 w-16 select-none"
                  />
                )}
              </div>

              <div role="radiogroup" aria-label="Plan" className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedPlan === "trial"}
                  onClick={() => selectPlan("trial")}
                  className={`fab-focus flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedPlan === "trial" ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <RadioDotInline selected={selectedPlan === "trial"} />
                    <span className="text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
                  </span>
                  <span className="whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                    {TRIAL_PLAN.chip}
                  </span>
                </button>

                {PAID_PLANS.map((plan) => {
                  const selected = selectedPlan === plan.id;
                  const price = priceForBilling(plan, billing);
                  const savings = annualSavings(plan);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectPlan(plan.id)}
                      className={`fab-focus flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <RadioDotInline selected={selected} />
                        <span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                            {plan.mostPopular && (
                              <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-text">
                                Most Popular
                              </span>
                            )}
                          </span>
                          <span className="block text-xs text-muted-foreground">{plan.subtitle}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="flex items-baseline justify-end gap-1.5">
                          {billing === "annual" && (
                            <span className="text-xs text-muted-foreground line-through">${plan.monthlyPrice}</span>
                          )}
                          <span className="text-base font-bold text-foreground">${price}</span>
                          <span className="text-xs text-muted-foreground">/mo</span>
                        </span>
                        {billing === "annual" && (
                          <span className="block text-[11px] text-primary-text">
                            Save ${savings} / billed yearly
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="fab-focus mt-3 flex w-full items-center justify-end gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
              >
                {SIGNUP_PLANS_COPY.planDetailsLabel}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>

              <button
                type="button"
                disabled={!selectedPlan}
                onClick={() => goToStep(2)}
                className="fab-focus mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ctaLabel}
              </button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {SIGNUP_PLANS_COPY.loginPromptLabel}{" "}
                <button
                  type="button"
                  onClick={() => goToView("login")}
                  className="fab-focus rounded-sm font-medium text-primary-text hover:opacity-80"
                >
                  {SIGNUP_PLANS_COPY.loginLinkLabel}
                </button>
              </p>
            </>
          ) : (
            <>
              <img src={signupPlanLogo} alt="FabAds" className="mb-4 h-6 w-auto" />
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {SIGNUP_PROFILE_COPY.heading}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{SIGNUP_PROFILE_COPY.subheading}</p>

              <div className="mt-6">
                <ModePill value={profileMode} onChange={setProfileMode} />
              </div>

              <form
                className="mt-6 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                {profileMode === "individual" ? (
                  <>
                    <Field label={SIGNUP_PROFILE_COPY.fullNameLabel} htmlFor="c08-full-name">
                      <input
                        id="c08-full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={SIGNUP_PROFILE_COPY.fullNamePlaceholder}
                        className={inputClass}
                      />
                    </Field>
                    <Field label={SIGNUP_PROFILE_COPY.emailLabel} htmlFor="c08-profile-email">
                      <input
                        id="c08-profile-email"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder={SIGNUP_PROFILE_COPY.emailPlaceholder}
                        className={inputClass}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label={SIGNUP_PROFILE_COPY.agencyNameLabel} htmlFor="c08-agency-name">
                      <input
                        id="c08-agency-name"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder={SIGNUP_PROFILE_COPY.agencyNamePlaceholder}
                        className={inputClass}
                      />
                    </Field>
                    <Field label={SIGNUP_PROFILE_COPY.adminEmailLabel} htmlFor="c08-admin-email">
                      <input
                        id="c08-admin-email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder={SIGNUP_PROFILE_COPY.adminEmailPlaceholder}
                        className={inputClass}
                      />
                    </Field>
                  </>
                )}

                <Field label={SIGNUP_PROFILE_COPY.phoneLabel} htmlFor="c08-phone">
                  <div className="flex gap-2">
                    <span className="flex w-16 shrink-0 items-center justify-center rounded-[28px] border border-border bg-card text-sm text-muted-foreground">
                      {SIGNUP_PROFILE_COPY.phoneCode}
                    </span>
                    <input
                      id="c08-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.phonePlaceholder}
                      className={`${inputClass} flex-1`}
                    />
                  </div>
                </Field>

                <div className="space-y-1.5">
                  <label htmlFor="c08-set-password" className="text-xs font-medium text-muted-foreground">
                    {SIGNUP_PROFILE_COPY.setPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="c08-set-password"
                      type={showProfilePassword ? "text" : "password"}
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.passwordPlaceholder}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword((v) => !v)}
                      aria-label={showProfilePassword ? "Hide password" : "Show password"}
                      className="fab-focus absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showProfilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{SIGNUP_PROFILE_COPY.passwordHint}</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="c08-confirm-password" className="text-xs font-medium text-muted-foreground">
                    {SIGNUP_PROFILE_COPY.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="c08-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.passwordPlaceholder}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="fab-focus absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="fab-focus flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                  >
                    {SIGNUP_PROFILE_COPY.backLabel}
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedPlan}
                    className="fab-focus flex-[2] rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-secondary-foreground disabled:opacity-100"
                  >
                    {selectedPlan ? SIGNUP_PROFILE_COPY.submitLabel : SIGNUP_PROFILE_COPY.submitDisabledLabel}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Scene side — a stage that knows exactly which act it's in */}
      <div className="relative hidden flex-1 overflow-hidden bg-background lg:block">
        {/* Login — auto-cycling preview of what's inside */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: view === "login" ? 1 : 0,
            zIndex: view === "login" ? 1 : 0,
            pointerEvents: "none",
          }}
        >
          {LOGIN_DEMO_STATES.map((s, i) => (
            <div
              key={i}
              className="c08-scene-layer absolute inset-0"
              style={{
                opacity: i === demoStep ? 1 : 0,
                zIndex: i === demoStep ? 1 : 0,
                backgroundImage: s.gradient,
              }}
            >
              <div className={`c08-orb absolute -left-24 top-24 h-72 w-72 rounded-full blur-3xl ${s.orbPrimary}`} />
              <div
                className={`c08-orb absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl ${s.orbSecondary}`}
                style={{ animationDelay: "2s" }}
              />
              {i === 1 && (
                <img
                  src={heroLogo}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-64 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
                />
              )}
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-16 text-center">
                <div
                  className={`mb-6 flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm ${s.badgeClass}`}
                >
                  <CheckCircle2 className={`h-3.5 w-3.5 ${s.iconClass}`} />
                  {s.eyebrow}
                </div>
                <h2 className="max-w-md text-4xl font-bold tracking-[-0.01em] text-foreground">{s.heading}</h2>
                <p className="mt-4 max-w-sm text-base text-muted-foreground">{s.subcopy}</p>
              </div>
            </div>
          ))}

          <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-2">
            {LOGIN_DEMO_STATES.map((_, i) => (
              <span
                key={i}
                className={`c08-dot h-2 rounded-full ${i === demoStep ? "bg-primary" : "bg-foreground/20"}`}
                style={{ width: i === demoStep ? 24 : 8, opacity: i === demoStep ? 1 : 0.7 }}
              />
            ))}
          </div>
        </div>

        {/* Signup — synced to the real step, driven by ?step */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: view === "signup" ? 1 : 0,
            zIndex: view === "signup" ? 1 : 0,
            pointerEvents: "none",
          }}
        >
          {/* Real 2-node stepper — this concept's namesake, literally in the scene */}
          <div className="absolute inset-x-0 top-12 z-20 flex justify-center px-16">
            <div className="flex w-full max-w-xs items-center" role="list" aria-label="Sign up progress">
              {([1, 2] as const).map((n, idx) => {
                const label = n === 1 ? SIGNUP_PLANS_COPY.stepOneLabel : SIGNUP_PLANS_COPY.stepTwoLabel;
                const done = step > n;
                const active = step === n;
                return (
                  <div key={n} className="flex flex-1 flex-col items-center gap-2" role="listitem">
                    <div className="flex w-full items-center">
                      <div
                        className={`h-px flex-1 ${idx === 0 ? "invisible" : done || active ? "bg-primary" : "bg-white/15"}`}
                      />
                      <span
                        className={`c08-dot flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                          done || active
                            ? "bg-primary text-primary-foreground"
                            : "border border-white/20 bg-white/5 text-foreground/60"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : n}
                      </span>
                      <div className={`h-px flex-1 ${idx === 1 ? "invisible" : done ? "bg-primary" : "bg-white/15"}`} />
                    </div>
                    <span
                      className={`text-[11px] font-medium ${active ? "text-foreground" : "text-foreground/50"}`}
                      aria-current={active ? "step" : undefined}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1 — plan selection scene */}
          <div
            className="c08-scene-layer absolute inset-0"
            style={{
              opacity: step === 1 ? 1 : 0,
              zIndex: step === 1 ? 1 : 0,
              transform: `translateX(${step === 1 ? 0 : -64}px)`,
              backgroundImage: STEP1_GRADIENT,
            }}
          >
            <div className="c08-orb absolute -left-16 top-16 h-72 w-72 rounded-full blur-3xl bg-primary/25" />
            <div
              className="c08-orb absolute bottom-10 right-0 h-96 w-96 rounded-full blur-3xl bg-sky-400/15"
              style={{ animationDelay: "2s" }}
            />
            {pulsing && <div className="c08-plan-pulse pointer-events-none absolute inset-0 z-[5]" />}

            {PAID_PLANS.map((plan, i) => {
              const pos = PRICE_GLYPH_POSITIONS[i];
              if (!pos) return null;
              return (
                <span
                  key={plan.id}
                  aria-hidden="true"
                  className="c08-orb absolute select-none font-bold text-foreground/[0.06] blur-[0.5px]"
                  style={{ top: pos.top, left: pos.left, fontSize: pos.fontSize, animationDelay: pos.delay }}
                >
                  ${priceForBilling(plan, billing)}
                </span>
              );
            })}

            <div className="relative z-10 flex h-full flex-col items-center px-16 pt-32 text-center">
              <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary-text backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {SIGNUP_PLANS_COPY.stepOneLabel}
              </div>
              <h2 className="max-w-md text-4xl font-bold tracking-[-0.01em] text-foreground">
                Every plan, one launchpad
              </h2>
              <p className="mt-4 max-w-sm text-base text-muted-foreground">
                Pick a plan now — swap it anytime as your campaigns grow.
              </p>
              {selectedPlanName && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Selected — {selectedPlanName}
                </div>
              )}
            </div>

            {/* Product mockup rising from the floor, with a soft reflection */}
            <div className="absolute inset-x-0 bottom-0 z-[1] flex justify-center overflow-hidden" style={{ height: "46%" }}>
              <div className="relative w-[92%] max-w-[520px]">
                <img
                  src={heroMockup}
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain object-bottom"
                  style={{
                    maskImage: "linear-gradient(to top, black 68%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to top, black 68%, transparent 100%)",
                  }}
                />
                <img
                  src={heroMockup}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-x-0 top-full w-full object-contain object-top opacity-20"
                  style={{
                    transform: "scaleY(-1)",
                    maskImage: "linear-gradient(to bottom, black 0%, transparent 55%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 55%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step 2 — profile setup scene */}
          <div
            className="c08-scene-layer absolute inset-0"
            style={{
              opacity: step === 2 ? 1 : 0,
              zIndex: step === 2 ? 1 : 0,
              transform: `translateX(${step === 2 ? 0 : 64}px)`,
              backgroundImage: STEP2_GRADIENT,
            }}
          >
            <div className="c08-orb absolute -right-16 top-20 h-72 w-72 rounded-full blur-3xl bg-amber-300/20" />
            <div
              className="c08-orb absolute bottom-0 left-0 h-96 w-96 rounded-full blur-3xl bg-primary/25"
              style={{ animationDelay: "2s" }}
            />
            <img
              src={heroLogo}
              alt=""
              aria-hidden="true"
              className="absolute left-1/2 top-[58%] h-56 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
            />

            <div
              className="c08-orb absolute flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/80 backdrop-blur-sm"
              style={{ top: "22%", left: "10%" }}
            >
              <User className="h-3.5 w-3.5 text-primary" />
              {SIGNUP_PROFILE_COPY.fullNameLabel}
            </div>
            <div
              className="c08-orb absolute flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/80 backdrop-blur-sm"
              style={{ top: "68%", left: "14%", animationDelay: "1.2s" }}
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              {SIGNUP_PROFILE_COPY.emailLabel}
            </div>
            <div
              className="c08-orb absolute flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/80 backdrop-blur-sm"
              style={{ top: "30%", left: "70%", animationDelay: "2.4s" }}
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              {SIGNUP_PROFILE_COPY.phoneCode}
            </div>

            <div className="relative z-10 flex h-full flex-col items-center px-16 pt-32 text-center">
              <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary-text backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {SIGNUP_PLANS_COPY.stepTwoLabel}
              </div>
              <h2 className="max-w-md text-4xl font-bold tracking-[-0.01em] text-foreground">
                One profile away from launch
              </h2>
              <p className="mt-4 max-w-sm text-base text-muted-foreground">
                A few details and your workspace is ready to go.
              </p>

              <div
                className="relative mt-6 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ background: "conic-gradient(hsl(var(--primary)) 90%, hsl(var(--border)) 0)" }}
              >
                <div className="flex h-[86%] w-[86%] items-center justify-center rounded-full bg-background/90 backdrop-blur-sm">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
