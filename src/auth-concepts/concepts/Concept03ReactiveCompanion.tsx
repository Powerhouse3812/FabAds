import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Gift,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { AUTH_CONCEPT_COPY, SIGNUP_PLANS_COPY, SIGNUP_PROFILE_COPY } from "@/auth-concepts/shared/formSpec";
import {
  ANNUAL_SAVINGS_LABEL,
  PAID_PLANS,
  TRIAL_PLAN,
  annualSavings,
  priceForBilling,
  type BillingCycle,
  type PaidPlan,
  type SelectablePlanId,
} from "@/components/auth/signup/plans";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import fabadsLogoDark from "@/assets/fabads-logo-dark.svg";
import heroLogo from "@/assets/auth/hero-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

const copy = AUTH_CONCEPT_COPY;
const plansCopy = SIGNUP_PLANS_COPY;
const profileCopy = SIGNUP_PROFILE_COPY;

const PLAN_ICON: Record<PaidPlan["id"], typeof Rocket> = {
  starter: Rocket,
  growth: TrendingUp,
  pro: Crown,
};

/** Derive a friendly display name from the email's local part.
 *  "jane.doe@x.com" -> "Jane doe" (dots/underscores/dashes become spaces,
 *  the whole thing is lowercased, then only the very first letter is
 *  capitalized — matches the concept spec's example exactly). */
function deriveDisplayName(email: string): string | null {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return null; // no "@" yet, or nothing before it

  const localPart = email.slice(0, atIndex);
  const cleaned = localPart.replace(/[._-]+/g, " ").trim().toLowerCase();
  if (!cleaned) return null;

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Two-letter initials from a derived display name, for the live avatar
 *  chip — "Jane doe" -> "JD". Falls back to the first letter alone when
 *  there's only one token. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

type StrengthTier = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  tier: StrengthTier;
  label: string;
}

/** Basic heuristic, 0-4 tiers:
 *  - any password at all         -> base tier 1 ("Weak")
 *  - length >= 8                 -> +1 tier
 *  - contains a digit            -> +1 tier
 *  - contains a symbol           -> +1 tier
 *  Traces: "abc" -> 1 (Weak). "abcdefgh1" -> 1+1(len)+1(digit) = 3 (Good).
 *  "abcdefgh1!" -> 1+1(len)+1(digit)+1(symbol) = 4 (Strong). */
function scorePassword(password: string): StrengthResult {
  if (password.length === 0) return { tier: 0, label: "" };

  let tier = 1;
  if (password.length >= 8) tier += 1;
  if (/[0-9]/.test(password)) tier += 1;
  if (/[^A-Za-z0-9]/.test(password)) tier += 1;

  const clamped = Math.min(tier, 4) as StrengthTier;
  const labels: Record<StrengthTier, string> = {
    0: "",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };
  return { tier: clamped, label: labels[clamped] };
}

/** Tier label text color — DS status text tokens (R-series `-text` variants). */
const TIER_TEXT_CLASS: Record<StrengthTier, string> = {
  0: "text-muted-foreground",
  1: "text-error-text",
  2: "text-warning-text",
  3: "text-success-text",
  4: "text-success-text",
};

/** Tier bar fill — lime primary at increasing opacity, not traffic-light colors. */
const TIER_BAR_CLASS: Record<StrengthTier, string> = {
  0: "bg-transparent",
  1: "bg-primary/40",
  2: "bg-primary/60",
  3: "bg-primary/80",
  4: "bg-primary",
};

type ProfileMode = "individual" | "agency";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸" },
  { code: "+36", flag: "🇭🇺" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+91", flag: "🇮🇳" },
];

/** Resolve the currently selected plan into display-ready fields shared by
 *  both the full step-1 companion card and the condensed step-2 chip. */
function resolvePlanSummary(selectedPlan: SelectablePlanId, billing: BillingCycle) {
  if (selectedPlan === "trial") {
    return {
      icon: Gift,
      name: TRIAL_PLAN.name,
      priceLabel: "Free",
      meta: TRIAL_PLAN.chip,
      savingsLabel: null as string | null,
    };
  }
  const plan = PAID_PLANS.find((p) => p.id === selectedPlan) ?? PAID_PLANS[0];
  const price = priceForBilling(plan, billing);
  const savings = annualSavings(plan);
  return {
    icon: PLAN_ICON[plan.id],
    name: plan.name,
    priceLabel: `$${price}/mo`,
    meta: plan.features ? `${plan.features.length} features unlocked` : "Full platform access",
    savingsLabel: billing === "annual" && savings > 0 ? `Save $${savings} / yr` : null,
  };
}

export default function Concept03ReactiveCompanion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = searchParams.get("step") === "2" ? 2 : 1;

  const goTo = (v: "login" | "signup") =>
    setSearchParams(v === "login" ? {} : { view: "signup", step: "1" });
  const goToStep = (s: 1 | 2) => setSearchParams({ view: "signup", step: String(s) });

  // Login form state — independent of signup's, so switching views never
  // leaks one form's values into the other's fields.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  // Signup step 1 — plan selection.
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId>("starter");

  // Signup step 2 — profile setup. Its own field set, kept separate from login.
  const [profileMode, setProfileMode] = useState<ProfileMode>("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+36");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // The companion panel is shared across every view/step — it always reads
  // whichever email/password field is currently on screen, so the same
  // deriveDisplayName/scorePassword functions drive it throughout. Step 1
  // has no email/password field yet, so both resolve to "" there.
  const activeEmail =
    view === "login" ? email : step === 2 ? (profileMode === "individual" ? signupEmail : adminEmail) : "";
  const activePassword = view === "login" ? password : step === 2 ? signupPassword : "";

  const displayName = useMemo(() => deriveDisplayName(activeEmail), [activeEmail]);
  const strength = useMemo(() => scorePassword(activePassword), [activePassword]);
  const showGreeting = displayName !== null;
  const fillPercent = (strength.tier / 4) * 100;
  const initials = displayName ? initialsFrom(displayName) : "";

  const greetingIdleTitle =
    view === "login"
      ? "Sign in to continue"
      : step === 1
        ? "Let's find your plan"
        : "Create an account to continue";
  const greetingIdleSubtitle =
    view === "login"
      ? "We'll greet you by name once you start typing."
      : step === 1
        ? "We'll personalize the next step right after."
        : "We'll greet you by name once you start typing.";
  const greetingActiveTitle =
    view === "signup" ? `Hey, ${displayName ?? ""} — let's get you set up.` : `Hey, ${displayName ?? ""}.`;
  const greetingActiveSubtitle = view === "signup" ? "We're glad you're here." : "Good to see you again.";

  const planSummary = useMemo(() => resolvePlanSummary(selectedPlan, billing), [selectedPlan, billing]);

  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      <style>{`
        @keyframes companion-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .companion-fade-in {
          animation: companion-fade-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes companion-pop {
          0% { transform: scale(0.94); }
          60% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .companion-pop {
          animation: companion-pop 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes chip-pop {
          0% { opacity: 0; transform: scale(0.4) translateY(2px); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .chip-pop {
          animation: chip-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes mockup-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .mockup-float {
          animation: mockup-float 6s ease-in-out infinite;
        }
        @keyframes scribble-in {
          0% { opacity: 0; transform: rotate(-6deg) scale(0.7); }
          100% { opacity: 1; transform: rotate(-6deg) scale(1); }
        }
        .scribble-in {
          animation: scribble-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .fab-label-float {
          transform-origin: left top;
          transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease-out;
        }
        .fab-field:focus-within .fab-label-float {
          transform: translateY(-1px) scale(1.03);
          color: hsl(var(--primary-text));
        }
      `}</style>

      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-12 md:w-1/2 lg:px-20">
        <div className={cn("mx-auto w-full", view === "signup" && step === 1 ? "max-w-md" : "max-w-sm")}>
          <img src={fabadsLogoDark} alt="FabAds" className="mb-8 h-6 w-auto" />

          {view === "login" ? (
            <>
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {copy.headingEmoji} {copy.heading}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{copy.subheading}</p>

              <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="fab-field space-y-1.5">
                  <Label htmlFor="c3-email" className="fab-label-float inline-block">
                    {copy.emailLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="c3-email"
                      type="email"
                      autoComplete="email"
                      placeholder={copy.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className={cn("rounded-[28px]", showGreeting && "pr-11")}
                    />
                    {showGreeting && (
                      <span
                        key={initials}
                        className={cn(
                          "chip-pop absolute inset-y-0 right-2 flex items-center",
                          emailFocused && "ring-2 ring-primary/30 rounded-full",
                        )}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {initials}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="fab-field space-y-1.5">
                  <Label htmlFor="c3-password" className="fab-label-float inline-block">
                    {copy.passwordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="c3-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={copy.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 rounded-[28px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="c3-remember"
                      checked={remember}
                      onCheckedChange={(v) => setRemember(v === true)}
                    />
                    <Label htmlFor="c3-remember" className="text-sm font-normal text-muted-foreground">
                      {copy.rememberLabel}
                    </Label>
                  </div>
                  <a href="#" className="text-sm font-medium text-primary-text hover:opacity-80">
                    {copy.forgotLabel}
                  </a>
                </div>

                <Button type="submit" className="w-full rounded-full">
                  {copy.submitLabel}
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{copy.dividerLabel}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button type="button" variant="outline" className="w-full rounded-full">
                  {copy.googleLabel}
                </Button>

                <p className="pt-2 text-center text-sm text-muted-foreground">
                  {copy.signupPromptLabel}{" "}
                  <button
                    type="button"
                    onClick={() => goTo("signup")}
                    className="font-medium text-primary-text hover:opacity-80"
                  >
                    {copy.signupLinkLabel}
                  </button>
                </p>
              </form>
            </>
          ) : step === 1 ? (
            <>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
                {plansCopy.stepOneLabel} · 1 of 2
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em] text-foreground">{plansCopy.heading}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{plansCopy.subheading}</p>

              {/* Billing toggle */}
              <div className="mt-6 flex items-center gap-3">
                <div className="inline-flex rounded-full border border-border bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setBilling("monthly")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      billing === "monthly"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {plansCopy.monthlyLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling("annual")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      billing === "annual"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {plansCopy.annualLabel}
                  </button>
                </div>
                {billing === "annual" && (
                  <img
                    key="scribble"
                    src={save20Scribble}
                    alt={ANNUAL_SAVINGS_LABEL}
                    className="scribble-in h-7 w-auto"
                  />
                )}
              </div>

              <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Select a plan">
                <PlanRow
                  selected={selectedPlan === "trial"}
                  onSelect={() => setSelectedPlan("trial")}
                  icon={Gift}
                  name={TRIAL_PLAN.name}
                  priceNode={
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                      {TRIAL_PLAN.chip}
                    </span>
                  }
                />
                {PAID_PLANS.map((plan) => {
                  const Icon = PLAN_ICON[plan.id];
                  const price = priceForBilling(plan, billing);
                  const isDiscounted = billing === "annual" && plan.annualMonthlyPrice !== plan.monthlyPrice;
                  const savings = annualSavings(plan);
                  return (
                    <PlanRow
                      key={plan.id}
                      selected={selectedPlan === plan.id}
                      onSelect={() => setSelectedPlan(plan.id)}
                      icon={Icon}
                      name={plan.name}
                      subtitle={plan.subtitle}
                      badge={plan.mostPopular ? "Most Popular" : undefined}
                      priceNode={
                        <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                          {isDiscounted && (
                            <span className="mr-1 text-muted-foreground line-through">${plan.monthlyPrice}</span>
                          )}
                          ${price}
                          <span className="font-normal text-muted-foreground">/mo</span>
                        </span>
                      }
                      trailingNode={
                        billing === "annual" && savings > 0 ? (
                          <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Save ${savings}/yr
                          </span>
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>

              <Button type="button" onClick={() => goToStep(2)} className="mt-6 w-full rounded-full">
                {selectedPlan === "trial" ? plansCopy.ctaTrialLabel : plansCopy.ctaPaidLabel}
              </Button>

              <p className="pt-3 text-center text-sm text-muted-foreground">
                {plansCopy.loginPromptLabel}{" "}
                <button
                  type="button"
                  onClick={() => goTo("login")}
                  className="font-medium text-primary-text hover:opacity-80"
                >
                  {plansCopy.loginLinkLabel}
                </button>
              </p>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
                {plansCopy.stepTwoLabel} · 2 of 2
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em] text-foreground">{profileCopy.heading}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{profileCopy.subheading}</p>

              <Tabs
                value={profileMode}
                onValueChange={(v) => setProfileMode(v as ProfileMode)}
                className="mt-5"
              >
                <TabsList className="h-8">
                  <TabsTrigger value="individual" className="px-3 py-1 text-sm">
                    {profileCopy.individualTabLabel}
                  </TabsTrigger>
                  <TabsTrigger value="agency" className="px-3 py-1 text-sm">
                    {profileCopy.agencyTabLabel}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form className="mt-5 space-y-5" onSubmit={(e) => e.preventDefault()}>
                {profileMode === "individual" ? (
                  <>
                    <div className="fab-field space-y-1.5">
                      <Label htmlFor="c3-full-name" className="fab-label-float inline-block">
                        {profileCopy.fullNameLabel}
                      </Label>
                      <Input
                        id="c3-full-name"
                        autoComplete="name"
                        placeholder={profileCopy.fullNamePlaceholder}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="rounded-[28px]"
                      />
                    </div>
                    <div className="fab-field space-y-1.5">
                      <Label htmlFor="c3-signup-email" className="fab-label-float inline-block">
                        {profileCopy.emailLabel}
                      </Label>
                      <div className="relative">
                        <Input
                          id="c3-signup-email"
                          type="email"
                          autoComplete="email"
                          placeholder={profileCopy.emailPlaceholder}
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className={cn("rounded-[28px]", showGreeting && "pr-11")}
                        />
                        {showGreeting && (
                          <span key={initials} className="chip-pop absolute inset-y-0 right-2 flex items-center">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {initials}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="fab-field space-y-1.5">
                      <Label htmlFor="c3-agency-name" className="fab-label-float inline-block">
                        {profileCopy.agencyNameLabel}
                      </Label>
                      <Input
                        id="c3-agency-name"
                        placeholder={profileCopy.agencyNamePlaceholder}
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        className="rounded-[28px]"
                      />
                    </div>
                    <div className="fab-field space-y-1.5">
                      <Label htmlFor="c3-admin-email" className="fab-label-float inline-block">
                        {profileCopy.adminEmailLabel}
                      </Label>
                      <div className="relative">
                        <Input
                          id="c3-admin-email"
                          type="email"
                          autoComplete="email"
                          placeholder={profileCopy.adminEmailPlaceholder}
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className={cn("rounded-[28px]", showGreeting && "pr-11")}
                        />
                        {showGreeting && (
                          <span key={initials} className="chip-pop absolute inset-y-0 right-2 flex items-center">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {initials}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="fab-field space-y-1.5">
                  <Label htmlFor="c3-phone" className="fab-label-float inline-block">
                    {profileCopy.phoneLabel}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[92px] shrink-0 rounded-[28px]" aria-label="Country code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="c3-phone"
                      type="tel"
                      autoComplete="tel-national"
                      placeholder={profileCopy.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 rounded-[28px]"
                    />
                  </div>
                </div>

                <div className="fab-field space-y-1.5">
                  <Label htmlFor="c3-signup-password" className="fab-label-float inline-block">
                    {profileCopy.setPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="c3-signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={profileCopy.passwordPlaceholder}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pr-10 rounded-[28px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{profileCopy.passwordHint}</p>
                </div>

                <div className="fab-field space-y-1.5">
                  <Label htmlFor="c3-confirm-password" className="fab-label-float inline-block">
                    {profileCopy.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="c3-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={profileCopy.passwordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 rounded-[28px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => goToStep(1)} className="flex-1 rounded-full">
                    {profileCopy.backLabel}
                  </Button>
                  <Button type="submit" className="flex-[2] rounded-full">
                    {profileCopy.submitLabel}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Companion panel — mission control that narrates the whole journey.
          Layered gradient wash (depth, not a flat tint) + orbs + a dimmed
          hero mockup peeking from the bottom edge, so no region is dead
          whitespace regardless of view/step. */}
      <div
        className="relative hidden w-1/2 flex-col overflow-hidden md:flex"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 15% 0%, rgba(163,230,53,0.28), transparent 55%), radial-gradient(120% 100% at 100% 100%, rgba(59,89,15,0.35), transparent 60%), linear-gradient(165deg, #eef8d8 0%, #dcefb2 45%, #c9e78e 100%)",
        }}
      >
        <div className="dark:hidden absolute inset-0 [background:inherit]" aria-hidden="true" />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              "radial-gradient(120% 90% at 15% 0%, rgba(163,230,53,0.16), transparent 55%), radial-gradient(120% 100% at 100% 100%, rgba(163,230,53,0.10), transparent 60%), linear-gradient(165deg, #0f1607 0%, #131e08 45%, #0c1204 100%)",
          }}
        />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col px-8 pt-10">
          <img src={heroLogo} alt="FabAds" className="mb-6 h-4 w-auto opacity-80" />

          <div className="mx-auto w-full max-w-sm space-y-3">
            {/* Journey tracker — reflects exactly where the user is, animates on change */}
            {view === "login" ? (
              <div className="companion-fade-in flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                </span>
                Signing in
              </div>
            ) : (
              <div
                key={step}
                className="companion-fade-in flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur"
              >
                <TrackerNode label={plansCopy.stepOneLabel} active={step === 1} done={step > 1} />
                <div className={cn("h-px flex-1", step > 1 ? "bg-primary" : "bg-border")} />
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className={cn("h-px flex-1", step > 1 ? "bg-primary" : "bg-border")} />
                <TrackerNode label={profileCopy.individualTabLabel === "Individual" ? "Profile" : "Profile"} active={step === 2} done={false} />
              </div>
            )}

            {/* Greeting card — crossfades between neutral and personalized state */}
            <div className="relative h-[92px]">
              <div
                className={`absolute inset-0 flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10 transition-all duration-500 ease-out ${
                  showGreeting ? "pointer-events-none translate-y-1 opacity-0" : "translate-y-0 opacity-100"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{greetingIdleTitle}</p>
                  <p className="text-xs text-muted-foreground">{greetingIdleSubtitle}</p>
                </div>
              </div>

              <div
                key={showGreeting ? displayName ?? "greet" : "none"}
                className={`absolute inset-0 flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10 transition-all duration-500 ease-out ${
                  showGreeting
                    ? "translate-y-0 opacity-100 companion-fade-in"
                    : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{greetingActiveTitle}</p>
                  <p className="text-xs text-muted-foreground">{greetingActiveSubtitle}</p>
                </div>
              </div>
            </div>

            {/* Plan summary card — full on step 1, condensed chip on step 2 */}
            {view === "signup" && step === 1 && (
              <div
                key={`${selectedPlan}-${billing}`}
                className="companion-pop rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
                    <planSummary.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{planSummary.name}</p>
                      <span className="text-sm font-bold text-foreground">{planSummary.priceLabel}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{planSummary.meta}</p>
                      {planSummary.savingsLabel && (
                        <span className="whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary-text">
                          {planSummary.savingsLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === "signup" && step === 2 && (
              <div className="companion-fade-in flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 shadow-sm backdrop-blur">
                <planSummary.icon className="h-3.5 w-3.5 shrink-0 text-primary-text" />
                <span className="text-xs font-semibold text-foreground">
                  {planSummary.name} · {planSummary.priceLabel}
                </span>
                {planSummary.savingsLabel && (
                  <span className="ml-auto whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-text">
                    {planSummary.savingsLabel}
                  </span>
                )}
              </div>
            )}

            {/* Strength card — only meaningful once a password field is on screen */}
            {(view === "login" || step === 2) && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-text">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Password strength</p>
                      <span
                        key={strength.tier}
                        className={`companion-fade-in text-xs font-semibold ${TIER_TEXT_CLASS[strength.tier]}`}
                      >
                        {strength.label || "—"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${TIER_BAR_CLASS[strength.tier]}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              This panel reacts live to what you type — nothing is sent anywhere.
            </p>
          </div>
        </div>

        {/* Product grounding — dimmed hero mockup peeking from the bottom edge,
            masked so it fades into the gradient instead of hard-cropping. */}
        <div className="relative mt-auto flex justify-center overflow-hidden pt-6" aria-hidden="true">
          {/* wrapper holds the static translateY(28%) offset; the float
              keyframe (which animates `transform`) lives on the inner img so
              the two transforms don't collide on one element. */}
          <div className="flex w-[92%] max-w-[420px] justify-center" style={{ transform: "translateY(28%)" }}>
            <img
              src={heroMockup}
              alt=""
              className="mockup-float w-full object-contain opacity-40 grayscale contrast-125 dark:opacity-25"
              style={{
                maskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 70%, transparent 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Journey tracker node — filled + checkmark once past, lime ring when active. */
function TrackerNode({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="h-3 w-3" /> : active ? <Sparkles className="h-3 w-3" /> : ""}
      </span>
      <span className={cn("whitespace-nowrap text-xs font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

interface PlanRowProps {
  selected: boolean;
  onSelect: () => void;
  icon: typeof Rocket;
  name: string;
  subtitle?: string;
  badge?: string;
  priceNode: React.ReactNode;
  trailingNode?: React.ReactNode;
}

/** Compact radio-row plan selector — this concept's own visual identity
 *  (icon chip + lime highlight), not the product's PlanCard styling. */
function PlanRow({ selected, onSelect, icon: Icon, name, subtitle, badge, priceNode, trailingNode }: PlanRowProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "fab-focus flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-all",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          {badge && (
            <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailingNode}
        {priceNode}
      </div>
    </div>
  );
}
