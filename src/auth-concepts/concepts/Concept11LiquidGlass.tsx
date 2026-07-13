import { useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sun,
  Moon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  ArrowLeft,
  Check,
  type LucideIcon,
} from "lucide-react";

import heroLogoWhite from "@/assets/auth/hero-logo.svg";
import fabFunnelDarkInkWordmark from "@/assets/fabads-logo-light.png";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

import { AUTH_CONCEPT_COPY, SIGNUP_PLANS_COPY, SIGNUP_PROFILE_COPY } from "@/auth-concepts/shared/formSpec";
import {
  PAID_PLANS,
  TRIAL_PLAN,
  ANNUAL_SAVINGS_LABEL,
  priceForBilling,
  annualSavings,
  type BillingCycle,
  type SelectablePlanId,
} from "@/components/auth/signup/plans";
import { COUNTRY_CODES } from "@/components/auth/signup/types";

/**
 * Concept 11 — Liquid Glass. The flagship of the 11-direction auth
 * exploration (Maalik's explicit pick: "Where is the Liquid glass version?
 * I liked that one the most.") — replicates the FEEL of the app's own
 * glassDark/glassLight nav variants (deep-navy or frosty-pink base, large
 * gradient orbs drifting BEHIND a backdrop-blur glass plate so the blur
 * visibly smears them) and pours FabFunnel's real login/signup content
 * into it.
 *
 * URL contract: ?glass=dark|light (default dark) · ?view=login|signup
 * (default login) · ?step=1|2 (signup only, default 1) — all three compose
 * on one route via useSearchParams, per brief.
 *
 * Pure UI: no validation, no backend, preventDefault on every submit.
 * Content is verbatim from shared/formSpec + signup/plans — never
 * hardcoded here.
 */

const COPY = AUTH_CONCEPT_COPY;
const PLANS_COPY = SIGNUP_PLANS_COPY;
const PROFILE_COPY = SIGNUP_PROFILE_COPY;

type GlassMode = "dark" | "light";
type AuthView = "login" | "signup";
type AccountType = "individual" | "agency";

interface GlassTheme {
  base: string;
  plate: string;
  plateBorder: string;
  plateShadow: string;
  specular: string;
  text: string;
  muted: string;
  fieldBg: string;
  fieldBorder: string;
  tabActive: string;
  chipBg: string;
  chipText: string;
  orbColors: string[];
}

const DARK_THEME: GlassTheme = {
  base: "radial-gradient(120% 90% at 20% -10%, #1c2b52 0%, #0d1327 45%, #060910 100%)",
  plate: "rgba(16, 20, 34, 0.55)",
  plateBorder: "rgba(255,255,255,0.14)",
  plateShadow: "0 30px 90px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
  specular: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%)",
  text: "#F3F5FA",
  muted: "rgba(226,229,240,0.62)",
  fieldBg: "rgba(255,255,255,0.05)",
  fieldBorder: "rgba(255,255,255,0.12)",
  tabActive: "rgba(255,255,255,0.14)",
  chipBg: "#0c0c0c",
  chipText: "#ffffff",
  orbColors: ["#5B6EF5", "#8B5CF6", "#C3EB42", "#3E7BFA", "#B368F0", "#79E0C9"],
};

const LIGHT_THEME: GlassTheme = {
  base: "radial-gradient(120% 90% at 20% -10%, #FFF1E9 0%, #FFEAF1 45%, #FBE3EA 100%)",
  plate: "rgba(255,255,255,0.5)",
  plateBorder: "rgba(255,255,255,0.8)",
  plateShadow: "0 30px 80px -25px rgba(190,120,140,0.35), 0 0 0 1px rgba(255,255,255,0.55) inset",
  specular: "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0) 60%)",
  text: "#2C2320",
  muted: "rgba(60,48,44,0.62)",
  fieldBg: "rgba(255,255,255,0.4)",
  fieldBorder: "rgba(150,110,100,0.18)",
  tabActive: "rgba(255,255,255,0.85)",
  chipBg: "#1c1c1c",
  chipText: "#ffffff",
  orbColors: ["#FFC1DE", "#FFD9B0", "#C3EB42", "#FF9FC0", "#BFE6C9", "#FFE1A8"],
};

interface OrbDef {
  id: string;
  top: string;
  left: string;
  size: number;
  depth: number;
  drift: "a" | "b" | "c" | "d" | "e" | "f";
  duration: string;
  delay: string;
}

const ORBS: OrbDef[] = [
  { id: "orb-a", top: "-12%", left: "6%", size: 440, depth: 10, drift: "a", duration: "26s", delay: "0s" },
  { id: "orb-b", top: "55%", left: "-10%", size: 360, depth: 16, drift: "b", duration: "32s", delay: "-4s" },
  { id: "orb-c", top: "2%", left: "68%", size: 460, depth: 22, drift: "c", duration: "28s", delay: "-9s" },
  { id: "orb-d", top: "66%", left: "74%", size: 380, depth: 14, drift: "d", duration: "34s", delay: "-14s" },
  { id: "orb-e", top: "32%", left: "36%", size: 300, depth: 28, drift: "e", duration: "24s", delay: "-6s" },
  { id: "orb-f", top: "82%", left: "38%", size: 340, depth: 18, drift: "f", duration: "30s", delay: "-11s" },
];

export default function Concept11LiquidGlass() {
  const [searchParams, setSearchParams] = useSearchParams();

  const glass: GlassMode = searchParams.get("glass") === "light" ? "light" : "dark";
  const isDark = glass === "dark";
  const view: AuthView = searchParams.get("view") === "signup" ? "signup" : "login";
  const step: 1 | 2 = view === "signup" && searchParams.get("step") === "2" ? 2 : 1;
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const updateParams = (patch: Record<string, string | undefined>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === undefined) next.delete(key);
          else next.set(key, value);
        });
        return next;
      },
      { replace: true },
    );
  };

  const goToView = (next: AuthView) =>
    updateParams({ view: next === "login" ? undefined : "signup", step: undefined });
  const goToStep = (next: 1 | 2) => updateParams({ step: next === 1 ? undefined : "2" });
  const toggleGlass = () => updateParams({ glass: isDark ? "light" : undefined });

  // ---- login ----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // ---- signup step 1 (plans) ----
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId>("starter");
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // ---- signup step 2 (profile) ----
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [countryCode, setCountryCode] = useState<string>(PROFILE_COPY.phoneCode);
  const [phone, setPhone] = useState("");
  const [setPasswordValue, setSetPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ---- cursor parallax ----
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const px = (e.clientX / window.innerWidth - 0.5) * 2;
    const py = (e.clientY / window.innerHeight - 0.5) * 2;
    setParallax({ x: px, y: py });
  };

  const isPlansStep = view === "signup" && step === 1;
  const showTabs = !(view === "signup" && step === 2);
  const ctaLabel = selectedPlan === "trial" ? PLANS_COPY.ctaTrialLabel : PLANS_COPY.ctaPaidLabel;

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMouseMove}
      className="glass11-root relative min-h-[100dvh] w-full overflow-hidden"
      style={{ color: theme.text }}
    >
      <style>{GLASS11_STYLES}</style>

      {/* base gradient — dual layer crossfade (gradients don't interpolate under transition, opacity crossfade does) */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
        style={{ background: DARK_THEME.base, opacity: isDark ? 1 : 0 }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
        style={{ background: LIGHT_THEME.base, opacity: isDark ? 0 : 1 }}
      />

      {/* orb field — sits BEHIND the glass plate; the plate's backdrop-blur smears these as they drift */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {ORBS.map((orb, i) => (
          <div
            key={orb.id}
            className="absolute"
            style={{
              top: orb.top,
              left: orb.left,
              width: orb.size,
              height: orb.size,
              transform: `translate3d(${parallax.x * orb.depth}px, ${parallax.y * orb.depth}px, 0)`,
              transition: "transform 500ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div
              className={`glass11-drift-${orb.drift} relative h-full w-full`}
              style={{ animationDuration: orb.duration, animationDelay: orb.delay }}
            >
              <div
                className="absolute inset-0 rounded-full transition-opacity duration-700 ease-out"
                style={{ background: DARK_THEME.orbColors[i], opacity: isDark ? 0.5 : 0, filter: "blur(70px)" }}
              />
              <div
                className="absolute inset-0 rounded-full transition-opacity duration-700 ease-out"
                style={{ background: LIGHT_THEME.orbColors[i], opacity: isDark ? 0 : 0.55, filter: "blur(70px)" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* sun / moon glass toggle */}
      <button
        type="button"
        onClick={toggleGlass}
        aria-label={isDark ? "Switch to light glass" : "Switch to dark glass"}
        className="glass11-toggle fixed right-5 top-5 z-30 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-xl sm:right-6 sm:top-6"
        style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, boxShadow: theme.plateShadow }}
      >
        <span className="relative block h-4 w-4">
          <Sun
            className="absolute inset-0 h-4 w-4 transition-all duration-500"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)",
              color: theme.text,
            }}
          />
          <Moon
            className="absolute inset-0 h-4 w-4 transition-all duration-500"
            style={{
              opacity: isDark ? 0 : 1,
              transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0deg) scale(1)",
              color: theme.text,
            }}
          />
        </span>
      </button>

      {/* content */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-14">
        <div
          className="glass11-plate relative w-full overflow-hidden rounded-[28px] backdrop-blur-2xl transition-[max-width] duration-500 ease-out"
          style={{
            maxWidth: isPlansStep ? 620 : 480,
            background: theme.plate,
            border: `1px solid ${theme.plateBorder}`,
            boxShadow: theme.plateShadow,
          }}
        >
          {/* specular top highlight */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[28px]"
            style={{ background: theme.specular }}
          />
          {/* thin edge ring */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />

          <div className="relative flex flex-col gap-6 p-7 sm:p-9">
            {/* wordmark — white ink on dark glass, dark ink on light glass */}
            <div className="flex justify-center">
              <span className="relative block h-6 w-[132px]">
                <img
                  src={heroLogoWhite}
                  alt="FabFunnel"
                  className="absolute inset-0 h-6 w-auto object-contain object-left transition-opacity duration-500"
                  style={{ opacity: isDark ? 1 : 0 }}
                />
                <img
                  src={fabFunnelDarkInkWordmark}
                  alt="FabFunnel"
                  className="absolute inset-0 h-6 w-auto object-contain object-left transition-opacity duration-500"
                  style={{ opacity: isDark ? 0 : 1 }}
                />
              </span>
            </div>

            {/* login / signup segmented switch — active highlight slides */}
            {showTabs && (
              <div
                className="relative mx-auto grid w-full max-w-[260px] grid-cols-2 rounded-full p-1"
                style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}` }}
              >
                <div
                  className="absolute inset-y-1 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    width: "calc(50% - 4px)",
                    left: 4,
                    transform: view === "login" ? "translateX(0)" : "translateX(100%)",
                    background: theme.tabActive,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => goToView("login")}
                  className="relative z-10 rounded-full py-2 text-sm font-medium"
                  style={{ color: theme.text }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => goToView("signup")}
                  className="relative z-10 rounded-full py-2 text-sm font-medium"
                  style={{ color: theme.text }}
                >
                  Sign up
                </button>
              </div>
            )}

            {/* signup step indicator */}
            {view === "signup" && (
              <div className="flex items-center justify-center gap-2">
                <StepPill active={step === 1} index={1} label={PLANS_COPY.stepOneLabel} theme={theme} />
                <div className="h-px w-6" style={{ background: theme.fieldBorder }} />
                <StepPill active={step === 2} index={2} label={PLANS_COPY.stepTwoLabel} theme={theme} />
              </div>
            )}

            {/* crossfading content per view/step */}
            <div key={`${view}-${step}`} className="glass11-fade-in flex flex-col gap-5">
              {view === "login" && (
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {COPY.headingEmoji} {COPY.heading}
                    </h1>
                    <p className="mt-1.5 text-sm" style={{ color: theme.muted }}>
                      {COPY.subheading}
                    </p>
                  </div>

                  <GlassField
                    id="g11-email"
                    label={COPY.emailLabel}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder={COPY.emailPlaceholder}
                    icon={Mail}
                    theme={theme}
                    isDark={isDark}
                    autoComplete="email"
                  />
                  <GlassField
                    id="g11-password"
                    label={COPY.passwordLabel}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    placeholder={COPY.passwordPlaceholder}
                    icon={Lock}
                    theme={theme}
                    isDark={isDark}
                    autoComplete="current-password"
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2"
                        style={{ color: theme.muted }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs" style={{ color: theme.muted }}>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-3.5 w-3.5 rounded"
                        style={{ accentColor: "hsl(var(--primary))" }}
                      />
                      {COPY.rememberLabel}
                    </label>
                    <button
                      type="button"
                      className="text-xs underline-offset-2 hover:underline"
                      style={{ color: theme.muted }}
                    >
                      {COPY.forgotLabel}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="glass11-cta w-full rounded-full py-2.5 text-sm font-bold"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {COPY.submitLabel}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1" style={{ background: theme.fieldBorder }} />
                    <span className="text-xs uppercase tracking-wide" style={{ color: theme.muted }}>
                      {COPY.dividerLabel}
                    </span>
                    <div className="h-px flex-1" style={{ background: theme.fieldBorder }} />
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium"
                    style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text }}
                  >
                    <GoogleIcon />
                    {COPY.googleLabel}
                  </button>

                  <p className="text-center text-xs" style={{ color: theme.muted }}>
                    {COPY.signupPromptLabel}{" "}
                    <button
                      type="button"
                      onClick={() => goToView("signup")}
                      className="font-medium underline-offset-2 hover:underline"
                      style={{ color: theme.text }}
                    >
                      {COPY.signupLinkLabel}
                    </button>
                  </p>
                </form>
              )}

              {view === "signup" && step === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="text-center">
                    <h1 className="text-xl font-bold tracking-tight">{PLANS_COPY.heading}</h1>
                    <p className="mt-1.5 text-sm" style={{ color: theme.muted }}>
                      {PLANS_COPY.subheading}
                    </p>
                  </div>

                  {/* trial row */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("trial")}
                    className="glass11-field relative flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
                    style={{
                      background: theme.fieldBg,
                      border: `1px solid ${selectedPlan === "trial" ? "hsl(var(--primary))" : theme.fieldBorder}`,
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <RadioDot active={selectedPlan === "trial"} theme={theme} />
                      <span className="text-sm font-medium">{TRIAL_PLAN.name}</span>
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={{ background: theme.chipBg, color: theme.chipText }}
                    >
                      {TRIAL_PLAN.chip}
                    </span>
                  </button>

                  {/* paid plan cards */}
                  <div className="flex flex-col gap-3">
                    {PAID_PLANS.map((plan) => {
                      const selected = selectedPlan === plan.id;
                      const price = priceForBilling(plan, billing);
                      const savings = annualSavings(plan);
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlan(plan.id)}
                          className="relative w-full overflow-hidden rounded-2xl px-4 py-3.5 text-left"
                          style={{
                            background: theme.fieldBg,
                            border: `1px solid ${selected ? "transparent" : theme.fieldBorder}`,
                          }}
                        >
                          {selected && (
                            <span
                              key={`${plan.id}-glow`}
                              className="glass11-plan-glow pointer-events-none absolute inset-0 rounded-2xl"
                              style={{
                                boxShadow:
                                  "0 0 0 1.5px hsl(var(--primary)), 0 0 26px hsl(var(--primary) / 0.35)",
                              }}
                            />
                          )}
                          <div className="relative z-10 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="mt-0.5">
                                <RadioDot active={selected} theme={theme} />
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold">{plan.name}</span>
                                  {plan.mostPopular && (
                                    <span
                                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                      style={{
                                        background: "hsl(var(--primary))",
                                        color: "hsl(var(--primary-foreground))",
                                      }}
                                    >
                                      Most Popular
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs" style={{ color: theme.muted }}>
                                  {plan.subtitle}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {billing === "annual" && (
                                <div className="text-xs line-through" style={{ color: theme.muted }}>
                                  ${plan.monthlyPrice}
                                </div>
                              )}
                              <div className="text-base font-bold">
                                ${price}
                                <span className="text-xs font-normal" style={{ color: theme.muted }}>
                                  /mo
                                </span>
                              </div>
                              {billing === "annual" && (
                                <div
                                  className="mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{ background: "hsl(var(--primary) / 0.18)", color: "hsl(var(--primary-text))" }}
                                >
                                  Save ${savings} / billed yearly
                                </div>
                              )}
                            </div>
                          </div>

                          {plan.id === "starter" && showPlanDetails && plan.features && (
                            <ul className="relative z-10 mt-3 grid grid-cols-1 gap-1.5 border-t pt-3 text-xs sm:grid-cols-2" style={{ borderColor: theme.fieldBorder, color: theme.muted }}>
                              {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-1.5">
                                  <Check className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* billing toggle + save20 scribble */}
                  <div className="flex items-center justify-center gap-1">
                    <div
                      className="relative flex rounded-full p-1"
                      style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}` }}
                    >
                      <div
                        className="absolute inset-y-1 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        style={{
                          width: "calc(50% - 4px)",
                          left: 4,
                          transform: billing === "monthly" ? "translateX(0)" : "translateX(100%)",
                          background: theme.tabActive,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setBilling("monthly")}
                        className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium"
                        style={{ color: theme.text }}
                      >
                        {PLANS_COPY.monthlyLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBilling("annual")}
                        className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium"
                        style={{ color: theme.text }}
                      >
                        {PLANS_COPY.annualLabel}
                      </button>
                    </div>
                    <img src={save20Scribble} alt={ANNUAL_SAVINGS_LABEL} className="-ml-1 h-9 w-14" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPlanDetails((v) => !v)}
                    className="-mt-1 text-center text-xs underline-offset-2 hover:underline"
                    style={{ color: theme.muted }}
                  >
                    {PLANS_COPY.planDetailsLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="glass11-cta w-full rounded-full py-2.5 text-sm font-bold"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {ctaLabel}
                  </button>

                  <p className="text-center text-xs" style={{ color: theme.muted }}>
                    {PLANS_COPY.loginPromptLabel}{" "}
                    <button
                      type="button"
                      onClick={() => goToView("login")}
                      className="font-medium underline-offset-2 hover:underline"
                      style={{ color: theme.text }}
                    >
                      {PLANS_COPY.loginLinkLabel}
                    </button>
                  </p>
                </div>
              )}

              {view === "signup" && step === 2 && (
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
                  <div className="text-center">
                    <h1 className="text-xl font-bold tracking-tight">{PROFILE_COPY.heading}</h1>
                    <p className="mt-1.5 text-sm" style={{ color: theme.muted }}>
                      {PROFILE_COPY.subheading}
                    </p>
                  </div>

                  <div
                    className="relative mx-auto grid w-full max-w-[240px] grid-cols-2 rounded-full p-1"
                    style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}` }}
                  >
                    <div
                      className="absolute inset-y-1 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{
                        width: "calc(50% - 4px)",
                        left: 4,
                        transform: accountType === "individual" ? "translateX(0)" : "translateX(100%)",
                        background: theme.tabActive,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setAccountType("individual")}
                      className="relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium"
                      style={{ color: theme.text }}
                    >
                      <User className="h-3.5 w-3.5" />
                      {PROFILE_COPY.individualTabLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("agency")}
                      className="relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium"
                      style={{ color: theme.text }}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {PROFILE_COPY.agencyTabLabel}
                    </button>
                  </div>

                  {accountType === "individual" ? (
                    <>
                      <GlassField
                        id="g11-fullname"
                        label={PROFILE_COPY.fullNameLabel}
                        type="text"
                        value={fullName}
                        onChange={setFullName}
                        placeholder={PROFILE_COPY.fullNamePlaceholder}
                        icon={User}
                        theme={theme}
                        isDark={isDark}
                        autoComplete="name"
                      />
                      <GlassField
                        id="g11-signup-email"
                        label={PROFILE_COPY.emailLabel}
                        type="email"
                        value={signupEmail}
                        onChange={setSignupEmail}
                        placeholder={PROFILE_COPY.emailPlaceholder}
                        icon={Mail}
                        theme={theme}
                        isDark={isDark}
                        autoComplete="email"
                      />
                    </>
                  ) : (
                    <>
                      <GlassField
                        id="g11-agency-name"
                        label={PROFILE_COPY.agencyNameLabel}
                        type="text"
                        value={agencyName}
                        onChange={setAgencyName}
                        placeholder={PROFILE_COPY.agencyNamePlaceholder}
                        icon={Building2}
                        theme={theme}
                        isDark={isDark}
                      />
                      <GlassField
                        id="g11-admin-email"
                        label={PROFILE_COPY.adminEmailLabel}
                        type="email"
                        value={adminEmail}
                        onChange={setAdminEmail}
                        placeholder={PROFILE_COPY.adminEmailPlaceholder}
                        icon={Mail}
                        theme={theme}
                        isDark={isDark}
                        autoComplete="email"
                      />
                    </>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: theme.muted }}>
                      {PROFILE_COPY.phoneLabel}
                    </label>
                    <div className="flex gap-2">
                      <div
                        className={`glass11-field ${isDark ? "glass11-field-dark" : "glass11-field-light"} relative w-[104px] shrink-0`}
                        style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}` }}
                      >
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          aria-label="Country code"
                          className="relative z-10 w-full appearance-none bg-transparent px-3 py-2.5 text-sm outline-none"
                          style={{ color: theme.text }}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} style={{ color: "#1a1a1a" }}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <span className="glass11-sweep" />
                      </div>
                      <div
                        className={`glass11-field ${isDark ? "glass11-field-dark" : "glass11-field-light"} relative flex-1`}
                        style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}` }}
                      >
                        <Phone
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{ color: theme.muted }}
                          aria-hidden="true"
                        />
                        <input
                          id="g11-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={PROFILE_COPY.phonePlaceholder}
                          autoComplete="tel-national"
                          className="relative z-10 w-full bg-transparent px-10 py-2.5 text-sm outline-none placeholder:opacity-60"
                          style={{ color: theme.text }}
                        />
                        <span className="glass11-sweep" />
                      </div>
                    </div>
                  </div>

                  <GlassField
                    id="g11-set-password"
                    label={PROFILE_COPY.setPasswordLabel}
                    type={showSetPassword ? "text" : "password"}
                    value={setPasswordValue}
                    onChange={setSetPasswordValue}
                    placeholder={PROFILE_COPY.passwordPlaceholder}
                    icon={Lock}
                    theme={theme}
                    isDark={isDark}
                    autoComplete="new-password"
                    hint={PROFILE_COPY.passwordHint}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowSetPassword((v) => !v)}
                        aria-label={showSetPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2"
                        style={{ color: theme.muted }}
                      >
                        {showSetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <GlassField
                    id="g11-confirm-password"
                    label={PROFILE_COPY.confirmPasswordLabel}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder={PROFILE_COPY.passwordPlaceholder}
                    icon={Lock}
                    theme={theme}
                    isDark={isDark}
                    autoComplete="new-password"
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2"
                        style={{ color: theme.muted }}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium"
                      style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}`, color: theme.text }}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {PROFILE_COPY.backLabel}
                    </button>
                    <button
                      type="submit"
                      className="glass11-cta flex-[2] rounded-full py-2.5 text-sm font-bold"
                      style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                    >
                      {PROFILE_COPY.submitLabel}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small step-progress pill for the signup header (uses real copy from SIGNUP_PLANS_COPY). */
function StepPill({ active, index, label, theme }: { active: boolean; index: number; label: string; theme: GlassTheme }) {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: active ? theme.text : theme.muted, fontWeight: active ? 600 : 500 }}>
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
        style={{
          background: active ? "hsl(var(--primary))" : theme.fieldBg,
          color: active ? "hsl(var(--primary-foreground))" : theme.muted,
          border: `1px solid ${active ? "transparent" : theme.fieldBorder}`,
        }}
      >
        {index}
      </span>
      {label}
    </span>
  );
}

function RadioDot({ active, theme }: { active: boolean; theme: GlassTheme }) {
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
      style={{ border: `1.5px solid ${active ? "hsl(var(--primary))" : theme.fieldBorder}` }}
    >
      {active && <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />}
    </span>
  );
}

/** Glass input field — icon + input on a semi-transparent, backdrop-blurred
 *  surface. Focus brightens the surface + draws a lime edge (via the
 *  glass11-field-dark/light :focus-within rules in GLASS11_STYLES) and
 *  sweeps a one-shot refraction highlight across the field. */
function GlassField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  theme,
  isDark,
  trailing,
  hint,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: LucideIcon;
  theme: GlassTheme;
  isDark: boolean;
  trailing?: ReactNode;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: theme.muted }}>
        {label}
      </label>
      <div
        className={`glass11-field ${isDark ? "glass11-field-dark" : "glass11-field-light"} relative`}
        style={{ background: theme.fieldBg, border: `1px solid ${theme.fieldBorder}` }}
      >
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: theme.muted }}
          aria-hidden="true"
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="relative z-10 w-full bg-transparent px-10 py-2.5 text-sm outline-none placeholder:opacity-60"
          style={{ color: theme.text }}
        />
        {trailing}
        <span className="glass11-sweep" />
      </div>
      {hint && (
        <p className="text-xs" style={{ color: theme.muted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2 1.4-4.6 2.1-7.6 2.1-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 40.9 16.2 45.5 24 45.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.4 36 44.5 31 44.5 25c0-1.5-.2-3-.9-4.5z"
      />
    </svg>
  );
}

const GLASS11_STYLES = `
  .glass11-root, .glass11-root * {
    transition: background-color 400ms ease, border-color 400ms ease, box-shadow 400ms ease, color 400ms ease, transform 400ms ease, opacity 400ms ease;
  }

  .glass11-fade-in { animation: glass11-fade-in 380ms ease; }
  @keyframes glass11-fade-in {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .glass11-plan-glow { animation: glass11-plan-glow 700ms ease-out; }
  @keyframes glass11-plan-glow {
    0% { opacity: 0; transform: scale(0.97); }
    40% { opacity: 1; transform: scale(1.015); }
    100% { opacity: 0.9; transform: scale(1); }
  }

  .glass11-cta { transition: transform 200ms ease, filter 200ms ease, background-color 400ms ease; }
  .glass11-cta:hover { transform: translateY(-1px); filter: brightness(1.05); }
  .glass11-cta:active { transform: translateY(0); }

  .glass11-toggle { transition: background-color 400ms ease, border-color 400ms ease, transform 200ms ease; }
  .glass11-toggle:hover { transform: scale(1.06); }

  .glass11-field { position: relative; overflow: hidden; border-radius: 14px; }
  .glass11-field .glass11-sweep {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
    transform: translateX(-120%);
    opacity: 0;
  }
  .glass11-field:focus-within .glass11-sweep {
    animation: glass11-sweep 900ms ease;
  }
  @keyframes glass11-sweep {
    0% { transform: translateX(-120%); opacity: 0; }
    15% { opacity: 1; }
    100% { transform: translateX(120%); opacity: 0; }
  }
  .glass11-field-dark:focus-within {
    background: rgba(255,255,255,0.1) !important;
    border-color: hsl(var(--primary)) !important;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.18);
  }
  .glass11-field-light:focus-within {
    background: rgba(255,255,255,0.7) !important;
    border-color: hsl(var(--primary)) !important;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.18);
  }

  .glass11-drift-a { animation-name: glass11-drift-a; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
  .glass11-drift-b { animation-name: glass11-drift-b; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
  .glass11-drift-c { animation-name: glass11-drift-c; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
  .glass11-drift-d { animation-name: glass11-drift-d; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
  .glass11-drift-e { animation-name: glass11-drift-e; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
  .glass11-drift-f { animation-name: glass11-drift-f; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }

  @keyframes glass11-drift-a {
    0% { transform: translate(0, 0); } 33% { transform: translate(60px, -40px); } 66% { transform: translate(-30px, 30px); } 100% { transform: translate(0, 0); }
  }
  @keyframes glass11-drift-b {
    0% { transform: translate(0, 0); } 50% { transform: translate(-50px, 35px); } 100% { transform: translate(0, 0); }
  }
  @keyframes glass11-drift-c {
    0% { transform: translate(0, 0); } 40% { transform: translate(-45px, -35px); } 75% { transform: translate(25px, 20px); } 100% { transform: translate(0, 0); }
  }
  @keyframes glass11-drift-d {
    0% { transform: translate(0, 0); } 50% { transform: translate(40px, 45px); } 100% { transform: translate(0, 0); }
  }
  @keyframes glass11-drift-e {
    0% { transform: translate(0, 0); } 30% { transform: translate(35px, 25px); } 65% { transform: translate(-40px, -20px); } 100% { transform: translate(0, 0); }
  }
  @keyframes glass11-drift-f {
    0% { transform: translate(0, 0); } 50% { transform: translate(-30px, -45px); } 100% { transform: translate(0, 0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .glass11-drift-a, .glass11-drift-b, .glass11-drift-c, .glass11-drift-d, .glass11-drift-e, .glass11-drift-f {
      animation: none !important;
    }
    .glass11-fade-in, .glass11-plan-glow { animation: none !important; }
  }
` as const;
