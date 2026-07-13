import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
import heroMockup from "@/assets/auth/hero-mockup.png";
import heroLogo from "@/assets/auth/hero-logo.svg";
import fabAdsLogoDark from "@/assets/fabads-logo-dark.svg";
import signupPlanLogo from "@/assets/auth/signup-plan-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

const COPY = AUTH_CONCEPT_COPY;
const PLANS_COPY = SIGNUP_PLANS_COPY;
const PROFILE_COPY = SIGNUP_PROFILE_COPY;

type SignupStep = 1 | 2;
type ProfileTab = "individual" | "agency";

/** Ink + lime + electric-coral editorial palette — raw hex on purpose (this
 *  exploration track's DS leash is relaxed; lime stays the recurring accent
 *  via --primary, ink/electric are the two new poster colors). */
const INK = "#15130f";
const ELECTRIC = "#ff2d6b";

/** Ghost price-tag scatter — two slightly different layouts per billing
 *  cycle so flipping Monthly/Annual visibly *reshuffles* the collage, not
 *  just re-labels it in place. */
const PRICE_TAG_LAYOUT: Record<
  BillingCycle,
  { top?: string; bottom?: string; left?: string; right?: string; rotate: number; size: string; zone: "ink" | "light" }[]
> = {
  monthly: [
    { top: "8%", left: "3%", rotate: -12, size: "clamp(52px,7vw,92px)", zone: "ink" },
    { bottom: "9%", left: "16%", rotate: 8, size: "clamp(38px,5vw,62px)", zone: "ink" },
    { top: "5%", right: "4%", rotate: -8, size: "clamp(32px,4vw,50px)", zone: "light" },
  ],
  annual: [
    { top: "12%", left: "6%", rotate: -6, size: "clamp(52px,7vw,92px)", zone: "ink" },
    { bottom: "12%", left: "11%", rotate: 12, size: "clamp(38px,5vw,62px)", zone: "ink" },
    { top: "9%", right: "6%", rotate: -4, size: "clamp(32px,4vw,50px)", zone: "light" },
  ],
};

/** Shared Google "G" mark — reused by both the login and signup forms so the
 *  icon markup isn't duplicated per view. */
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

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
        checked ? "border-primary-text bg-primary" : "border-border bg-transparent"
      }`}
      aria-hidden="true"
    >
      {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
    </span>
  );
}

/** Field label — small bold uppercase caption used across both forms. */
function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </label>
  );
}

export default function Concept04TypeTexture() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step: SignupStep = searchParams.get("step") === "2" ? 2 : 1;

  const goToLogin = () => setSearchParams({});
  const goToSignup = () => setSearchParams({ view: "signup" });
  const goToStep = (n: SignupStep) => setSearchParams({ view: "signup", step: String(n) });

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // Step 1 — plan selection
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<SelectablePlanId>("starter");
  const [expandedPlanId, setExpandedPlanId] = useState<SelectablePlanId | null>("starter");

  const selectPlan = (id: SelectablePlanId) => {
    setSelectedPlanId(id);
    setExpandedPlanId(id);
  };
  const toggleExpand = (id: SelectablePlanId) =>
    setExpandedPlanId((current) => (current === id ? null : id));

  const step1CtaLabel = selectedPlanId === "trial" ? PLANS_COPY.ctaTrialLabel : PLANS_COPY.ctaPaidLabel;

  // Step 2 — profile setup
  const [profileTab, setProfileTab] = useState<ProfileTab>("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasPlan = Boolean(selectedPlanId);
  const step2CtaLabel = hasPlan ? PROFILE_COPY.submitLabel : PROFILE_COPY.submitDisabledLabel;

  const ghostLabel = view === "login" ? "SIGN IN" : step === 1 ? "SIGN UP" : "PROFILE";
  const cardMaxWidth = view === "login" ? "max-w-md" : step === 1 ? "max-w-xl" : "max-w-lg";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <style>{`
        @keyframes tt-ghost-drift {
          0% { transform: translateX(-2%); }
          50% { transform: translateX(2%); }
          100% { transform: translateX(-2%); }
        }
        .tt-ghost-drift {
          animation: tt-ghost-drift 22s ease-in-out infinite;
        }
        @keyframes tt-ghost-pulse {
          0% { letter-spacing: -0.05em; opacity: 0; transform: scale(1.08); }
          55% { letter-spacing: 0.07em; opacity: 1; }
          100% { letter-spacing: 0em; opacity: 1; transform: scale(1); }
        }
        .tt-ghost-pulse {
          animation: tt-ghost-pulse 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes tt-card-settle {
          0% { opacity: 0; transform: translate(-50%, -46%) scale(0.97); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .tt-card-settle {
          animation: tt-card-settle 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .tt-card {
          transform: rotate(-1.25deg);
          transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms ease;
        }
        .tt-card:hover {
          transform: rotate(0deg) translateY(-6px) scale(1.012);
        }
        @keyframes tt-tag-in {
          0% { opacity: 0; transform: translateY(16px) scale(0.88); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tt-tag-in {
          animation: tt-tag-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes tt-stamp {
          0% { opacity: 0; transform: translateY(10px) scale(1.05); }
          60% { opacity: 1; transform: translateY(-2px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tt-stamp {
          animation: tt-stamp 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes tt-sticker-wiggle {
          0%, 100% { transform: rotate(-11deg); }
          50% { transform: rotate(-16deg); }
        }
        .tt-sticker {
          animation: tt-sticker-wiggle 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Two-tone editorial clash — deep ink vs light zone, no more polite lime/white */}
      <div className="absolute inset-y-0 left-0 z-0 w-[55%]" style={{ backgroundColor: INK }} />
      <div className="absolute inset-y-0 right-0 z-0 w-[45%] bg-background" />
      {/* Electric seam line marking the color-block boundary */}
      <div
        className="pointer-events-none absolute inset-y-0 left-[55%] z-[2] w-[3px] -translate-x-1/2"
        style={{ backgroundColor: ELECTRIC }}
      />

      {/* Publisher watermark — bottom-left imprint on the ink zone, like a magazine's corner mark */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-6 z-[1] h-8 w-auto opacity-15 sm:h-10"
      />

      {/* Oversized ghost typography per view/step — one-shot tracking-expand pulse on change, continuous drift always-on */}
      <div
        aria-hidden="true"
        className="tt-ghost-drift pointer-events-none absolute inset-y-0 left-0 z-[1] flex w-[55%] items-center justify-center overflow-hidden"
      >
        <span
          key={ghostLabel}
          className="tt-ghost-pulse select-none whitespace-nowrap font-black leading-none"
          style={{
            fontSize: "clamp(150px, 24vw, 280px)",
            WebkitTextStroke: `2px hsl(var(--primary))`,
            color: "transparent",
            opacity: 0.55,
          }}
        >
          {ghostLabel}
        </span>
      </div>

      {/* Ghost price-numeral collage — plans step only, reshuffles with the billing toggle */}
      {view === "signup" && step === 1 && (
        <div key={billing} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
          {PAID_PLANS.map((plan, i) => {
            const layout = PRICE_TAG_LAYOUT[billing][i];
            return (
              <div
                key={plan.id}
                className="absolute"
                style={{
                  top: layout.top,
                  bottom: layout.bottom,
                  left: layout.left,
                  right: layout.right,
                  transform: `rotate(${layout.rotate}deg)`,
                }}
              >
                <span
                  className="tt-tag-in inline-block select-none whitespace-nowrap font-black leading-none"
                  style={{
                    fontSize: layout.size,
                    animationDelay: `${i * 90}ms`,
                    WebkitTextStroke:
                      layout.zone === "ink" ? `1.5px hsl(var(--primary))` : `1.5px ${INK}`,
                    color: "transparent",
                    opacity: layout.zone === "ink" ? 0.4 : 0.16,
                  }}
                >
                  ${priceForBilling(plan, billing)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Decorative rings — electric accent, off-screen bleed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 z-[1] h-[380px] w-[380px] rounded-full border-[3px] opacity-30"
        style={{ borderColor: ELECTRIC }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-20 z-[1] h-[260px] w-[260px] rounded-full border-2 border-foreground/10"
      />

      {/* Paste-up collage — torn-photo clipping of the hero mockup, taped at an angle, tucked behind the card's corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[7%] right-[5%] z-[1] hidden w-[clamp(140px,15vw,200px)] sm:block"
        style={{ transform: "rotate(-7deg)" }}
      >
        <div
          className="relative bg-card p-1.5 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.4)]"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% 90%, 90% 97%, 80% 90%, 70% 97%, 60% 90%, 50% 97%, 40% 90%, 30% 97%, 20% 90%, 10% 97%, 0 90%)",
          }}
        >
          <img src={heroMockup} alt="" className="h-auto w-full object-cover" />
        </div>
        {/* Tape strip */}
        <div
          className="absolute -left-3 -top-2 h-5 w-16 opacity-80 shadow-sm"
          style={{
            transform: "rotate(-28deg)",
            background:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.55) 0 2px, rgba(255,255,255,0) 2px 5px), #d8cdb0",
          }}
        />
      </div>

      {/* Card — straddles the seam, slide-settles on mount, straightens + lifts on hover */}
      <div
        className={`tt-card-settle absolute left-1/2 top-1/2 z-10 w-[92vw] ${cardMaxWidth} sm:left-[58%]`}
      >
        <div className="tt-card rounded-2xl border border-border bg-card p-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] sm:p-9">
          {/* Header */}
          <div className="mb-7">
            {view === "login" ? (
              <img src={fabAdsLogoDark} alt="FabAds" className="mb-4 h-6 w-auto" />
            ) : (
              <div className="mb-4 flex items-center justify-between gap-3">
                <img src={signupPlanLogo} alt="FabAds" className="h-6 w-auto" />
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] ${
                      step === 1
                        ? "border-primary-text bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground/50"
                    }`}
                  >
                    1
                  </span>
                  <span className={step === 1 ? "text-foreground" : "text-muted-foreground/50"}>
                    {PLANS_COPY.stepOneLabel}
                  </span>
                  <span className="h-px w-4 bg-border" />
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] ${
                      step === 2
                        ? "border-primary-text bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground/50"
                    }`}
                  >
                    2
                  </span>
                  <span className={step === 2 ? "text-foreground" : "text-muted-foreground/50"}>
                    {PLANS_COPY.stepTwoLabel}
                  </span>
                </div>
              </div>
            )}

            <h1 className="text-2xl font-bold leading-tight tracking-[-0.01em] text-foreground sm:text-3xl">
              {view === "login" ? (
                <>
                  <span className="mr-1">{COPY.headingEmoji}</span>
                  {COPY.heading}
                </>
              ) : (
                PLANS_COPY.heading
              )}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {view === "login" ? COPY.subheading : PLANS_COPY.subheading}
            </p>
          </div>

          {view === "login" && (
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="tt-email">{COPY.emailLabel}</FieldLabel>
                <input
                  id="tt-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={COPY.emailPlaceholder}
                  className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="tt-password">{COPY.passwordLabel}</FieldLabel>
                <div className="relative">
                  <input
                    id="tt-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={COPY.passwordPlaceholder}
                    className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 pr-9 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary-text"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                  {COPY.rememberLabel}
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 transition hover:text-primary-text hover:underline"
                >
                  {COPY.forgotLabel}
                </button>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[0_10px_24px_-6px_rgba(0,0,0,0.25)] transition hover:bg-primary/90"
              >
                {COPY.submitLabel}
              </button>

              <div className="my-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {COPY.dividerLabel}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-card py-3 text-sm font-bold text-foreground transition hover:border-primary-text/40"
              >
                <GoogleIcon />
                {COPY.googleLabel}
              </button>

              <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                {COPY.signupPromptLabel}{" "}
                <button
                  type="button"
                  onClick={goToSignup}
                  className="font-bold text-foreground underline-offset-2 hover:text-primary-text hover:underline"
                >
                  {COPY.signupLinkLabel}
                </button>
              </p>
            </form>
          )}

          {view === "signup" && step === 1 && (
            <div className="flex flex-col gap-5">
              {/* Billing toggle with the "Save 20%" sticker slapped next to it */}
              <div className="relative mx-auto">
                <div className="flex items-center gap-1 rounded-full border-2 border-border p-1">
                  {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBilling(cycle)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                        billing === cycle
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cycle === "monthly" ? PLANS_COPY.monthlyLabel : PLANS_COPY.annualLabel}
                    </button>
                  ))}
                </div>
                <img
                  src={save20Scribble}
                  alt={ANNUAL_SAVINGS_LABEL}
                  className="tt-sticker pointer-events-none absolute -right-9 -top-6 h-14 w-auto drop-shadow-md"
                />
              </div>

              <div role="radiogroup" aria-label="Plan" className="flex flex-col gap-2.5">
                {/* Trial row */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedPlanId === "trial"}
                  onClick={() => selectPlan("trial")}
                  className={`tt-stamp flex items-center justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                    selectedPlanId === "trial"
                      ? "border-primary-text bg-primary/5"
                      : "border-border hover:border-foreground/25"
                  }`}
                  style={{ animationDelay: "0ms" }}
                >
                  <span className="flex items-center gap-3">
                    <RadioDot checked={selectedPlanId === "trial"} />
                    <span className="text-sm font-bold text-foreground">{TRIAL_PLAN.name}</span>
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: INK }}
                  >
                    {TRIAL_PLAN.chip}
                  </span>
                </button>

                {/* Paid plans */}
                {PAID_PLANS.map((plan, i) => {
                  const selected = selectedPlanId === plan.id;
                  const expanded = expandedPlanId === plan.id;
                  const price = priceForBilling(plan, billing);
                  return (
                    <div
                      key={plan.id}
                      className={`tt-stamp relative rounded-xl border-2 p-3.5 transition ${
                        selected ? "border-primary-text bg-primary/5" : "border-border hover:border-foreground/25"
                      }`}
                      style={{ animationDelay: `${(i + 1) * 90}ms` }}
                    >
                      {plan.mostPopular && (
                        <span
                          className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{ backgroundColor: ELECTRIC, transform: "rotate(-4deg)" }}
                        >
                          Most Popular
                        </span>
                      )}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectPlan(plan.id)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="flex items-start gap-3">
                          <RadioDot checked={selected} />
                          <span>
                            <span className="block text-sm font-bold text-foreground">{plan.name}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{plan.subtitle}</span>
                          </span>
                        </span>
                        <span className="flex flex-col items-end">
                          <span className="flex items-baseline gap-1.5">
                            {billing === "annual" && plan.monthlyPrice !== plan.annualMonthlyPrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${plan.monthlyPrice}
                              </span>
                            )}
                            <span className="text-base font-bold text-foreground">${price}</span>
                            <span className="text-[11px] text-muted-foreground">/mo</span>
                          </span>
                          {billing === "annual" && annualSavings(plan) > 0 && (
                            <span className="mt-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-text">
                              Save ${annualSavings(plan)} / billed yearly
                            </span>
                          )}
                        </span>
                      </button>

                      {plan.features && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(plan.id)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                        >
                          {expanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          Features
                        </button>
                      )}

                      {expanded && plan.features && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-border pt-2.5">
                          {plan.features.map((feature) => (
                            <span key={feature} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary-text" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center justify-end gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {PLANS_COPY.planDetailsLabel}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => goToStep(2)}
                className="mt-1 w-full rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[0_10px_24px_-6px_rgba(0,0,0,0.25)] transition hover:bg-primary/90"
              >
                {step1CtaLabel}
              </button>

              <p className="text-center text-xs font-medium text-muted-foreground">
                {PLANS_COPY.loginPromptLabel}{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-bold text-foreground underline-offset-2 hover:text-primary-text hover:underline"
                >
                  {PLANS_COPY.loginLinkLabel}
                </button>
              </p>
            </div>
          )}

          {view === "signup" && step === 2 && (
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
              {/* Individual / Agency tabs */}
              <div className="flex items-center gap-1 rounded-full border-2 border-border p-1">
                {(["individual", "agency"] as ProfileTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setProfileTab(tab)}
                    className={`flex-1 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                      profileTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "individual" ? PROFILE_COPY.individualTabLabel : PROFILE_COPY.agencyTabLabel}
                  </button>
                ))}
              </div>

              {profileTab === "individual" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="tt-fullname">{PROFILE_COPY.fullNameLabel}</FieldLabel>
                    <input
                      id="tt-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={PROFILE_COPY.fullNamePlaceholder}
                      className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="tt-signup-email">{PROFILE_COPY.emailLabel}</FieldLabel>
                    <input
                      id="tt-signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder={PROFILE_COPY.emailPlaceholder}
                      className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="tt-agency-name">{PROFILE_COPY.agencyNameLabel}</FieldLabel>
                    <input
                      id="tt-agency-name"
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder={PROFILE_COPY.agencyNamePlaceholder}
                      className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel htmlFor="tt-admin-email">{PROFILE_COPY.adminEmailLabel}</FieldLabel>
                    <input
                      id="tt-admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder={PROFILE_COPY.adminEmailPlaceholder}
                      className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="tt-phone">{PROFILE_COPY.phoneLabel}</FieldLabel>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 items-center rounded-full border-2 border-border px-3 text-sm font-bold text-muted-foreground">
                    {PROFILE_COPY.phoneCode}
                  </span>
                  <input
                    id="tt-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={PROFILE_COPY.phonePlaceholder}
                    className="w-full flex-1 rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="tt-set-password">{PROFILE_COPY.setPasswordLabel}</FieldLabel>
                <div className="relative">
                  <input
                    id="tt-set-password"
                    type={showProfilePassword ? "text" : "password"}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder={PROFILE_COPY.passwordPlaceholder}
                    className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 pr-9 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary-text"
                    aria-label={showProfilePassword ? "Hide password" : "Show password"}
                  >
                    {showProfilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{PROFILE_COPY.passwordHint}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="tt-confirm-password">{PROFILE_COPY.confirmPasswordLabel}</FieldLabel>
                <div className="relative">
                  <input
                    id="tt-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={PROFILE_COPY.passwordPlaceholder}
                    className="w-full rounded-[28px] border-b-2 border-border bg-transparent px-1 py-2 pr-9 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary-text"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="flex-1 rounded-full border-2 border-border py-3 text-sm font-bold uppercase tracking-wide text-foreground transition hover:border-primary-text/40"
                >
                  {PROFILE_COPY.backLabel}
                </button>
                <button
                  type="submit"
                  disabled={!hasPlan}
                  className="flex-[2] rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[0_10px_24px_-6px_rgba(0,0,0,0.25)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step2CtaLabel}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
