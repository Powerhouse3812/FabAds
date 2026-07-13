import { useRef, useState, type MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  TrendingUp,
  Gauge,
  Rocket,
  Gift,
  Star,
  BadgePercent,
  User,
  Building2,
  Phone,
  Check,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import {
  AUTH_CONCEPT_COPY as copy,
  SIGNUP_PLANS_COPY as plansCopy,
  SIGNUP_PROFILE_COPY as profileCopy,
} from "@/auth-concepts/shared/formSpec";
import {
  PAID_PLANS,
  TRIAL_PLAN,
  ANNUAL_SAVINGS_LABEL,
  priceForBilling,
  annualSavings,
  type PaidPlan,
  type SelectablePlanId,
  type BillingCycle,
} from "@/components/auth/signup/plans";
import heroMockup from "@/assets/auth/hero-mockup.png";
import fabadsLogoDark from "@/assets/fabads-logo-dark.svg";
import heroLogo from "@/assets/auth/hero-logo.svg";
import signupPlanLogo from "@/assets/auth/signup-plan-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

/**
 * Concept 10 — "Nature split": annotated PRODUCT panel + live stats.
 *
 * Godmode rework: the panel's "photo" is no longer a fake abstract scene —
 * it's the real hero-mockup.png (laptop + phone dashboard composite),
 * full-bleed inside the rounded inset panel, color-graded with a rich
 * gradient atmosphere (glow blobs, horizon lines, bottom scrim). Three
 * annotated pins re-anchor to REAL regions of that mockup: the sparkline
 * chart row → "+24% CTR", the phone's live stats grid → "3.2x ROAS", the
 * phone's Launch Summary card → "500+ launches". On the signup plan-select
 * step, the same three pin slots swap to plan-relevant callouts — one of
 * which is a live tie to whichever plan card is selected on the form side.
 * Toggle via ?view=login|signup, ?step=1|2 on signup.
 */

interface CalloutPin {
  id: string;
  label: string;
  dotClass: string;
  top: string;
  left: string;
  lineLength: string;
  lineRotate: string;
  pinSide: "left" | "right";
  delayMs: number;
  Icon: typeof TrendingUp;
}

/** Anchored to real regions of hero-mockup.png (object-cover, ~11% cropped
 *  off each side): the laptop's CPR/CPC/CTR sparkline row, the phone's live
 *  stats grid, and the phone's Launch Summary card. */
const FEATURE_PINS: CalloutPin[] = [
  {
    id: "ctr",
    label: "+24% CTR",
    dotClass: "bg-primary",
    top: "28%",
    left: "47%",
    lineLength: "38px",
    lineRotate: "-20deg",
    pinSide: "right",
    delayMs: 200,
    Icon: TrendingUp,
  },
  {
    id: "roas",
    label: "3.2x ROAS",
    dotClass: "bg-primary/70",
    top: "40%",
    left: "85%",
    lineLength: "34px",
    lineRotate: "18deg",
    pinSide: "left",
    delayMs: 400,
    Icon: Gauge,
  },
  {
    id: "launches",
    label: "500+ launches",
    dotClass: "bg-primary/50",
    top: "64%",
    left: "82%",
    lineLength: "32px",
    lineRotate: "-14deg",
    pinSide: "left",
    delayMs: 600,
    Icon: Rocket,
  },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.24v3.09C3.2 21.3 7.26 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.15 7.15 0 010-4.58V6.62H1.24a11.93 11.93 0 000 10.76l4.03-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.43-3.43C17.94 1.19 15.24 0 12 0 7.26 0 3.2 2.7 1.24 6.62l4.03 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

/** Splits `full` around the first occurrence of `word` so a heading string
 *  sourced verbatim from formSpec can still carry the signature highlighter
 *  effect behind one of its own words, instead of a hardcoded duplicate. */
function splitAtWord(full: string, word: string): [string, string, string] {
  const idx = full.indexOf(word);
  if (idx === -1) return [full, "", ""];
  return [full.slice(0, idx), word, full.slice(idx + word.length)];
}

function Highlight({ children }: { children: string }) {
  return (
    <span className="relative z-0 inline-block px-0.5">
      <span
        className="naturesplit-highlight-mark absolute inset-y-1 left-0 -z-10 w-full rounded-[6px] bg-primary/70"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

const INPUT_CLASS =
  "w-full rounded-[28px] border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

export default function Concept10NatureSplit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = searchParams.get("step") === "2" ? 2 : 1;
  const goTo = (v: "login" | "signup") =>
    setSearchParams(v === "login" ? {} : { view: "signup" });
  const goToStep = (s: 1 | 2) =>
    setSearchParams(s === 1 ? { view: "signup" } : { view: "signup", step: "2" });

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // signup — step 1 (plans)
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId>("starter");
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>(null);

  // signup — step 2 (profile)
  const [profileTab, setProfileTab] = useState<"individual" | "agency">("individual");
  const [fullName, setFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [setPasswordVal, setSetPasswordVal] = useState("");
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // panel micro-interactions
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handlePanelMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const MAX_DEG = 4;
    setTilt({ rx: -py * 2 * MAX_DEG, ry: px * 2 * MAX_DEG });
  };
  const handlePanelMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  // live tie: the selected plan card's savings echoes into a panel pin
  const tiedPlan = PAID_PLANS.find((p) => p.id === selectedPlan) ?? PAID_PLANS[0];
  const savingsPinLabel =
    selectedPlan === "trial" ? TRIAL_PLAN.chip : `Save $${annualSavings(tiedPlan)}/yr`;

  const planPins: CalloutPin[] = [
    {
      id: "trial",
      label: "90 days free",
      dotClass: "bg-primary",
      top: "18%",
      left: "30%",
      lineLength: "36px",
      lineRotate: "-18deg",
      pinSide: "right",
      delayMs: 200,
      Icon: Gift,
    },
    {
      id: "popular",
      label: "Most popular",
      dotClass: "bg-primary/70",
      top: "48%",
      left: "20%",
      lineLength: "34px",
      lineRotate: "14deg",
      pinSide: "right",
      delayMs: 400,
      Icon: Star,
    },
    {
      id: "savings",
      label: savingsPinLabel,
      dotClass: "bg-primary/50",
      top: "74%",
      left: "55%",
      lineLength: "32px",
      lineRotate: "-12deg",
      pinSide: "right",
      delayMs: 600,
      Icon: BadgePercent,
    },
  ];

  const activePins = view === "signup" && step === 1 ? planPins : FEATURE_PINS;

  const [loginLead, loginMark, loginTail] = splitAtWord(copy.heading, "Fab-Funnel");
  const [signupLead, signupMark, signupTail] = splitAtWord(plansCopy.heading, "smarter");

  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-[100dvh] w-full bg-background">
      <style>{`
        @keyframes naturesplit-pin-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.82); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes naturesplit-pin-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }
        .naturesplit-pin {
          opacity: 0;
          animation: naturesplit-pin-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            naturesplit-pin-pulse 3.6s ease-in-out infinite;
        }
        .naturesplit-pin-body {
          animation: naturesplit-pin-pulse 3.6s ease-in-out infinite;
        }
        @keyframes naturesplit-highlight-paint {
          0% { transform: rotate(-1.5deg) scaleX(0); }
          100% { transform: rotate(-1.5deg) scaleX(1); }
        }
        .naturesplit-highlight-mark {
          transform-origin: left center;
          animation: naturesplit-highlight-paint 0.55s ease-out forwards;
          animation-delay: 200ms;
        }
        @keyframes naturesplit-glow-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(18px, -12px) scale(1.08); }
        }
        @keyframes naturesplit-glow-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-14px, 10px) scale(1.05); }
        }
        .naturesplit-glow-a { animation: naturesplit-glow-drift-a 14s ease-in-out infinite; }
        .naturesplit-glow-b { animation: naturesplit-glow-drift-b 17s ease-in-out infinite; }
        @keyframes naturesplit-scribble-pop {
          0% { opacity: 0; transform: scale(0.5) rotate(-14deg); }
          60% { opacity: 1; transform: scale(1.08) rotate(-5deg); }
          100% { opacity: 1; transform: scale(1) rotate(-6deg); }
        }
        .naturesplit-scribble-pop {
          animation: naturesplit-scribble-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes naturesplit-step-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .naturesplit-step-fade { animation: naturesplit-step-fade 0.4s ease-out both; }
      `}</style>

      {/* Illustration side — rounded inset panel, real product vignette,
          full-bleed hero mockup with a rich gradient atmosphere. */}
      <div className="relative hidden w-1/2 shrink-0 items-center justify-center p-8 lg:flex">
        <div
          ref={panelRef}
          onMouseMove={handlePanelMouseMove}
          onMouseLeave={handlePanelMouseLeave}
          style={{
            transform: `perspective(1400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: "transform 300ms ease-out",
          }}
          className="relative h-full w-full overflow-hidden rounded-[32px] shadow-2xl"
        >
          {/* real product photo — full-bleed, no dead zone */}
          <img
            src={heroMockup}
            alt="FabAds dashboard on laptop and mobile, showing CPR, CPC, CTR and a live launch summary"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* rich gradient atmosphere / color-grade over the photo */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(10,18,13,0.55)_0%,rgba(19,32,24,0.22)_45%,rgba(10,19,16,0.62)_100%)]" />
          <div className="naturesplit-glow-a pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-primary/25 blur-3xl mix-blend-screen" />
          <div className="naturesplit-glow-b pointer-events-none absolute bottom-[-15%] right-[-12%] h-80 w-80 rounded-full bg-primary/30 blur-3xl mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-[62%] h-px bg-white/[0.08]" />
          <div className="pointer-events-none absolute inset-x-0 top-[70%] h-px bg-white/[0.05]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent_0%,rgba(8,14,10,0.72)_100%)]" />

          {/* brand chrome, floating over the scrim */}
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <img src={fabadsLogoDark} alt="FabAds" className="h-5 w-auto" />
            <div className="text-xs text-white/60">
              © {year} FabAds · Live campaign data
            </div>
          </div>

          {/* hover spotlights — soft radial highlight fading in behind
              whichever pin's anchor region is hovered */}
          {activePins.map((pin) => (
            <div
              key={`glow-${pin.id}`}
              className={`pointer-events-none absolute z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary blur-3xl transition-opacity duration-500 ${
                hoveredPinId === pin.id ? "opacity-30" : "opacity-0"
              }`}
              style={{ top: pin.top, left: pin.left }}
            />
          ))}

          {/* Annotated callout pins */}
          {activePins.map((pin) => {
            const isRight = pin.pinSide === "right";
            return (
              <div
                key={pin.id}
                className="absolute z-20"
                style={{ top: pin.top, left: pin.left }}
                onMouseEnter={() => setHoveredPinId(pin.id)}
                onMouseLeave={() => setHoveredPinId(null)}
              >
                <div
                  className="absolute top-1/2 h-px bg-white/50"
                  style={{
                    width: pin.lineLength,
                    left: isRight ? "100%" : undefined,
                    right: isRight ? undefined : "100%",
                    transform: `rotate(${pin.lineRotate})`,
                    transformOrigin: isRight ? "left center" : "right center",
                  }}
                />
                <span
                  className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${pin.dotClass}`}
                  style={{ left: isRight ? "-1px" : "-9px" }}
                />
                <div
                  className="naturesplit-pin absolute"
                  style={{
                    top: "-14px",
                    left: isRight
                      ? `calc(${pin.lineLength} + 6px)`
                      : `calc(-1 * (${pin.lineLength} + 6px))`,
                    animationDelay: `${pin.delayMs}ms, ${pin.delayMs + 500}ms`,
                  }}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-3 py-1.5 shadow-lg">
                    <span className={`h-1.5 w-1.5 rounded-full ${pin.dotClass}`} />
                    <pin.Icon className="h-3 w-3 text-primary-text" />
                    <span className="text-xs font-semibold text-success-text">
                      {pin.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form side */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className={`w-full ${view === "signup" && step === 1 ? "max-w-md" : "max-w-sm"}`}>
          <img src={heroLogo} alt="" aria-hidden="true" className="mb-6 h-5 w-auto opacity-80" />

          {view === "login" ? (
            <>
              <h1 className="text-3xl font-bold tracking-[-0.01em] text-foreground">
                <span aria-hidden="true">{copy.headingEmoji}</span> {loginLead}
                {loginMark && <Highlight>{loginMark}</Highlight>}
                {loginTail}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{copy.subheading}</p>

              <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1.5">
                  <label
                    htmlFor="nature-split-email"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {copy.emailLabel}
                  </label>
                  <input
                    id="nature-split-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="nature-split-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {copy.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="nature-split-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={copy.passwordPlaceholder}
                      className={`${INPUT_CLASS} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    {copy.rememberLabel}
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium text-primary-text transition hover:opacity-80"
                  >
                    {copy.forgotLabel}
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  {copy.submitLabel}
                </button>

                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{copy.dividerLabel}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                >
                  <GoogleIcon />
                  {copy.googleLabel}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {copy.signupPromptLabel}{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo("signup");
                  }}
                  className="font-semibold text-primary-text transition hover:opacity-80"
                >
                  {copy.signupLinkLabel}
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-2">
                <img src={signupPlanLogo} alt="" aria-hidden="true" className="h-5 w-auto" />
                <div className="flex items-center gap-2">
                  {[
                    { n: 1 as const, label: plansCopy.stepOneLabel },
                    { n: 2 as const, label: plansCopy.stepTwoLabel },
                  ].map((s, i) => (
                    <div key={s.n} className="flex items-center gap-2">
                      {i > 0 && <div className="h-px w-5 bg-border" />}
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          step === s.n ? "bg-primary/15 text-primary-text" : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                            step === s.n
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s.n}
                        </span>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {signupLead}
                {signupMark && <Highlight>{signupMark}</Highlight>}
                {signupTail}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {step === 1 ? plansCopy.subheading : profileCopy.subheading}
              </p>

              {step === 1 ? (
                <div key="step1" className="naturesplit-step-fade mt-6 space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1">
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-primary transition-transform duration-300 ease-out"
                        style={{ transform: billing === "monthly" ? "translateX(0%)" : "translateX(100%)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setBilling("monthly")}
                        className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          billing === "monthly" ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {plansCopy.monthlyLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBilling("annual")}
                        className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          billing === "annual" ? "text-primary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {plansCopy.annualLabel}
                      </button>
                      {billing === "annual" && (
                        <img
                          src={save20Scribble}
                          alt={ANNUAL_SAVINGS_LABEL}
                          className="naturesplit-scribble-pop pointer-events-none absolute -right-14 -top-7 h-9 w-auto"
                        />
                      )}
                    </div>
                  </div>

                  <div role="radiogroup" aria-label="Select a plan" className="space-y-2">
                    <div
                      role="radio"
                      aria-checked={selectedPlan === "trial"}
                      tabIndex={0}
                      onClick={() => setSelectedPlan("trial")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedPlan("trial");
                        }
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-colors ${
                        selectedPlan === "trial"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-foreground/[0.03]"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          selectedPlan === "trial" ? "border-primary-text" : "border-muted-foreground/50"
                        }`}
                      >
                        {selectedPlan === "trial" && (
                          <span className="h-2 w-2 rounded-full bg-primary-text" />
                        )}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-foreground">
                        {TRIAL_PLAN.name}
                      </span>
                      <span className="whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium text-background">
                        {TRIAL_PLAN.chip}
                      </span>
                    </div>

                    {PAID_PLANS.map((plan: PaidPlan) => {
                      const price = priceForBilling(plan, billing);
                      const isDiscounted = billing === "annual" && plan.annualMonthlyPrice !== plan.monthlyPrice;
                      const savings = annualSavings(plan);
                      const selected = selectedPlan === plan.id;
                      const expanded = expandedPlan === plan.id;
                      return (
                        <div key={plan.id} className="overflow-hidden rounded-[20px]">
                          <div
                            role="radio"
                            aria-checked={selected}
                            tabIndex={0}
                            onClick={() => setSelectedPlan(plan.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedPlan(plan.id);
                              }
                            }}
                            className={`relative w-full cursor-pointer border px-4 py-3 transition-colors ${
                              selected ? "border-primary bg-primary/5" : "border-border hover:bg-foreground/[0.03]"
                            }`}
                          >
                            {plan.mostPopular && (
                              <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                Most Popular
                              </span>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  selected ? "border-primary-text" : "border-muted-foreground/50"
                                }`}
                              >
                                {selected && <span className="h-2 w-2 rounded-full bg-primary-text" />}
                              </span>
                              <span className="text-sm font-semibold text-foreground">
                                {plan.name} —{" "}
                                {isDiscounted && (
                                  <span className="text-muted-foreground line-through">
                                    ${plan.monthlyPrice}
                                  </span>
                                )}{" "}
                                ${price}
                                {billing === "annual" && (
                                  <span className="font-normal text-muted-foreground">/mo</span>
                                )}
                              </span>
                              <div className="ml-auto flex items-center gap-2">
                                {billing === "annual" && (
                                  <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    Save ${savings} / billed yearly
                                  </span>
                                )}
                                {plan.features && plan.features.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedPlan((p) => (p === plan.id ? null : plan.id));
                                    }}
                                    aria-label={expanded ? "Collapse plan details" : "Expand plan details"}
                                    className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                                  >
                                    <ChevronDown
                                      className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 pl-6 text-xs text-muted-foreground">{plan.subtitle}</p>
                          </div>
                          {plan.features && (
                            <div
                              className="grid bg-primary/5 transition-[grid-template-rows] duration-300 ease-out"
                              style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                            >
                              <div className="overflow-hidden">
                                <div className="grid grid-cols-2 gap-y-1 px-4 py-3 pl-10">
                                  {plan.features.map((feature) => (
                                    <div
                                      key={feature}
                                      className="flex items-center gap-1.5 text-xs text-foreground"
                                    >
                                      <Check className="h-3 w-3 shrink-0 text-foreground/70" aria-hidden="true" />
                                      {feature}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline">
                    {plansCopy.planDetailsLabel}
                  </p>

                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    {selectedPlan === "trial" ? plansCopy.ctaTrialLabel : plansCopy.ctaPaidLabel}
                  </button>

                  <p className="text-center text-sm text-muted-foreground">
                    {plansCopy.loginPromptLabel}{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goTo("login");
                      }}
                      className="font-semibold text-primary-text transition hover:opacity-80"
                    >
                      {plansCopy.loginLinkLabel}
                    </a>
                  </p>
                </div>
              ) : (
                <form
                  key="step2"
                  className="naturesplit-step-fade mt-6 space-y-5"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1">
                      <button
                        type="button"
                        onClick={() => setProfileTab("individual")}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          profileTab === "individual"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <User className="h-3 w-3" />
                        {profileCopy.individualTabLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileTab("agency")}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          profileTab === "agency"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Building2 className="h-3 w-3" />
                        {profileCopy.agencyTabLabel}
                      </button>
                    </div>
                  </div>

                  {profileTab === "individual" ? (
                    <>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="nature-split-fullname"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {profileCopy.fullNameLabel}
                        </label>
                        <input
                          id="nature-split-fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={profileCopy.fullNamePlaceholder}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="nature-split-profile-email"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {profileCopy.emailLabel}
                        </label>
                        <input
                          id="nature-split-profile-email"
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder={profileCopy.emailPlaceholder}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="nature-split-agencyname"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {profileCopy.agencyNameLabel}
                        </label>
                        <input
                          id="nature-split-agencyname"
                          type="text"
                          value={agencyName}
                          onChange={(e) => setAgencyName(e.target.value)}
                          placeholder={profileCopy.agencyNamePlaceholder}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="nature-split-adminemail"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {profileCopy.adminEmailLabel}
                        </label>
                        <input
                          id="nature-split-adminemail"
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder={profileCopy.adminEmailPlaceholder}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="nature-split-phone" className="text-xs font-medium text-muted-foreground">
                      {profileCopy.phoneLabel}
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center rounded-[28px] border border-border bg-card px-3 text-sm text-foreground">
                        {profileCopy.phoneCode}
                      </span>
                      <div className="relative flex-1">
                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="nature-split-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={profileCopy.phonePlaceholder}
                          className={`${INPUT_CLASS} pl-9`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="nature-split-setpassword"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {profileCopy.setPasswordLabel}
                    </label>
                    <div className="relative">
                      <input
                        id="nature-split-setpassword"
                        type={showSetPassword ? "text" : "password"}
                        value={setPasswordVal}
                        onChange={(e) => setSetPasswordVal(e.target.value)}
                        placeholder={profileCopy.passwordPlaceholder}
                        className={`${INPUT_CLASS} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showSetPassword ? "Hide password" : "Show password"}
                      >
                        {showSetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{profileCopy.passwordHint}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="nature-split-confirmpassword"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {profileCopy.confirmPasswordLabel}
                    </label>
                    <div className="relative">
                      <input
                        id="nature-split-confirmpassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${INPUT_CLASS} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex w-1/3 items-center justify-center gap-1.5 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {profileCopy.backLabel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      {profileCopy.submitLabel}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
