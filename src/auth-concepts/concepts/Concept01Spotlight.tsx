import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  ChevronDown,
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
  type PaidPlan,
  type SelectablePlanId,
  type BillingCycle,
} from "@/components/auth/signup/plans";
import heroMockup from "@/assets/auth/hero-mockup.png";
import heroLogo from "@/assets/auth/hero-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

const COPY = AUTH_CONCEPT_COPY;

const INPUT_BASE =
  "w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-text focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]";

/** Dust motes drifting inside the light beam — only meant to read within
 *  the hot core / glow region, not across the whole scene. */
const MOTES: { top: string; left: string; size: number; anim: string; duration: string; delay: string }[] = [
  { top: "8%", left: "42%", size: 4, anim: "mote-float-a", duration: "9s", delay: "-1s" },
  { top: "14%", left: "58%", size: 3, anim: "mote-float-b", duration: "11s", delay: "-4s" },
  { top: "22%", left: "37%", size: 5, anim: "mote-float-c", duration: "8s", delay: "-2.5s" },
  { top: "6%", left: "50%", size: 3, anim: "mote-float-b", duration: "13s", delay: "-6s" },
  { top: "28%", left: "62%", size: 4, anim: "mote-float-a", duration: "10s", delay: "-3s" },
  { top: "18%", left: "46%", size: 2, anim: "mote-float-c", duration: "7s", delay: "-1.5s" },
  { top: "33%", left: "53%", size: 3, anim: "mote-float-a", duration: "12s", delay: "-5s" },
  { top: "10%", left: "34%", size: 2, anim: "mote-float-b", duration: "9.5s", delay: "-2s" },
];

function PlanRow({
  plan,
  billing,
  selected,
  onSelect,
  expanded,
  onToggleExpand,
  index,
}: {
  plan: PaidPlan;
  billing: BillingCycle;
  selected: boolean;
  onSelect: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  index: number;
}) {
  const price = priceForBilling(plan, billing);
  const savings = annualSavings(plan);

  return (
    <div
      className="plan-row-rise overflow-hidden rounded-xl"
      style={{ animationDelay: `${80 + index * 70}ms` }}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className={`relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left backdrop-blur-md transition-all ${
          selected
            ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.45),0_0_28px_hsl(var(--primary)/0.22)]"
            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
        }`}
      >
        {plan.mostPopular && (
          <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            Most Popular
          </span>
        )}
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected ? "border-primary-text" : "border-muted-foreground/50"
          }`}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-primary-text" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {plan.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {plan.subtitle}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="flex items-baseline gap-1.5">
            {billing === "annual" && (
              <span className="text-xs text-muted-foreground/60 line-through">
                ${plan.monthlyPrice}
              </span>
            )}
            <span className="text-sm font-bold text-foreground">
              ${price}
              <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
            </span>
          </span>
          {billing === "annual" && (
            <span className="mt-0.5 block text-[10px] text-primary-text">
              {ANNUAL_SAVINGS_LABEL} · save ${savings}/yr
            </span>
          )}
        </span>
      </button>

      {plan.features && plan.features.length > 0 && (
        <div className="pl-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex items-center gap-1 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {SIGNUP_PLANS_COPY.planDetailsLabel}
            <ChevronDown
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pb-3 pr-2 text-[11px] text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f} className="truncate">
                    · {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Concept01Spotlight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = searchParams.get("step") === "2" ? 2 : 1;

  const goTo = (v: "login" | "signup") =>
    setSearchParams(v === "login" ? {} : { view: "signup" });
  const goToStep = (s: 1 | 2) =>
    setSearchParams(s === 1 ? { view: "signup" } : { view: "signup", step: "2" });

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // signup — step 1 (plans)
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>(null);

  // signup — step 2 (profile)
  const [profileTab, setProfileTab] = useState<"individual" | "agency">("individual");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [setPasswordVal, setSetPasswordVal] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // signature mouse-tilt on the glass card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const MAX_DEG = 6;
    setTilt({ x: -(py - 0.5) * 2 * MAX_DEG, y: (px - 0.5) * 2 * MAX_DEG });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  // spotlight glow lerps toward the cursor — direct DOM writes via ref so
  // this never trips a React re-render on every mousemove.
  const glowLayerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let curX = 50;
    let curY = 50;
    let targetX = 50;
    let targetY = 50;
    const onMove = (e: globalThis.MouseEvent) => {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      targetX = 50 + (nx - 0.5) * 14;
      targetY = 50 + (ny - 0.5) * 10;
    };
    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      const el = glowLayerRef.current;
      if (el) {
        el.style.setProperty("--mx", `${curX}%`);
        el.style.setProperty("--my", `${curY}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const canSubmitProfile = selectedPlan !== null;
  const wide = view === "signup" && step === 1;

  return (
    // "dark" forced — this concept's identity is a fixed dark spotlight
    // scene, not the app theme. Tokens below resolve to real dark values.
    <div className="dark relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-12">
      <style>{`
        @keyframes spotlight-glow-pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .spotlight-glow-pulse { animation: spotlight-glow-pulse 5s ease-in-out infinite; }

        @keyframes mote-float-a {
          0%, 100% { transform: translate(0, 0); opacity: 0.35; }
          50% { transform: translate(6px, -16px); opacity: 0.85; }
        }
        @keyframes mote-float-b {
          0%, 100% { transform: translate(0, 0); opacity: 0.25; }
          50% { transform: translate(-10px, -9px); opacity: 0.7; }
        }
        @keyframes mote-float-c {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(4px, 11px); opacity: 0.9; }
        }
        .mote-float-a { animation: mote-float-a ease-in-out infinite; }
        .mote-float-b { animation: mote-float-b ease-in-out infinite; }
        .mote-float-c { animation: mote-float-c ease-in-out infinite; }

        @keyframes studio-drift {
          0%, 100% { transform: translate(0, 0) rotate(-2deg); }
          50% { transform: translate(-8px, -6px) rotate(-1.4deg); }
        }
        .studio-drift { animation: studio-drift 22s ease-in-out infinite; }

        @keyframes plan-row-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .plan-row-rise { animation: plan-row-rise 0.45s ease-out both; }

        @keyframes step-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-fade-in { animation: step-fade-in 0.4s ease-out both; }

        @keyframes scribble-pop {
          0% { opacity: 0; transform: scale(0.5) rotate(-14deg); }
          60% { opacity: 1; transform: scale(1.08) rotate(-5deg); }
          100% { opacity: 1; transform: scale(1) rotate(-6deg); }
        }
        .scribble-pop { animation: scribble-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      {/* subtle brand mark — fills the lonely top-left corner */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-6 z-10 h-5 w-auto opacity-40"
      />

      {/* Layered background: dark studio + hero hardware in the shadows +
          warm cursor-following spotlight + dust motes + vignette */}
      <div className="pointer-events-none absolute inset-0">
        {/* base — monochrome depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--card))_0%,hsl(var(--background))_100%)]" />

        {/* the product itself, sitting in the dark just beyond the light —
            desaturated, dim, barely there until you look for it */}
        {/* wrapper holds the -50% centering; the drift keyframe (which
            animates `transform`) lives on the inner img so it can't clobber
            the centering translate. */}
        <div className="absolute bottom-[-14%] left-1/2 w-[135%] max-w-4xl -translate-x-1/2">
          <img
            src={heroMockup}
            alt=""
            aria-hidden="true"
            className="studio-drift w-full opacity-[0.13] grayscale blur-[2px] contrast-125"
          />
        </div>

        {/* warm tungsten spotlight — origin lerps toward the cursor */}
        <div
          ref={glowLayerRef}
          style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}
        >
          <div className="absolute left-1/2 top-[-10%] h-[70%] w-[70%] -translate-x-1/2">
            <div className="spotlight-glow-pulse h-full w-full rounded-full bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,222,170,0.32)_0%,rgba(255,205,140,0.14)_35%,rgba(255,205,140,0)_70%)] blur-2xl" />
          </div>
          <div className="absolute left-1/2 top-[2%] h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,244,220,0.4)_0%,rgba(255,244,220,0)_70%)] blur-xl" />

          {/* dust motes — only ever visible inside the beam */}
          {MOTES.map((m, i) => (
            <div
              key={i}
              className={m.anim}
              style={{
                position: "absolute",
                top: m.top,
                left: m.left,
                width: m.size,
                height: m.size,
                borderRadius: "9999px",
                background: "rgba(255,244,220,0.75)",
                filter: "blur(0.5px)",
                animationDuration: m.duration,
                animationDelay: m.delay,
              }}
            />
          ))}
        </div>

        {/* vignette at edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      {/* Glass card, tilts toward cursor, widens for plan selection */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 200ms ease-out, max-width 500ms ease-out",
        }}
        className={`relative z-10 w-full rounded-2xl border border-border bg-card p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${
          wide ? "max-w-2xl" : "max-w-sm"
        }`}
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {view === "login" ? (
              <>
                {COPY.headingEmoji} {COPY.heading}
              </>
            ) : (
              SIGNUP_PLANS_COPY.heading
            )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view === "login" ? COPY.subheading : SIGNUP_PLANS_COPY.subheading}
          </p>
        </div>

        {view === "signup" && (
          <div className="mb-6 flex items-center justify-center gap-2">
            {[
              { n: 1 as const, label: SIGNUP_PLANS_COPY.stepOneLabel },
              { n: 2 as const, label: SIGNUP_PLANS_COPY.stepTwoLabel },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-6 bg-border" />}
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    step === s.n
                      ? "bg-primary/15 text-primary-text"
                      : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      step === s.n
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {s.n}
                  </span>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {view === "login" && (
          <form
            key="login"
            onSubmit={(e) => e.preventDefault()}
            className="step-fade-in flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="spotlight-email" className="text-xs font-medium text-muted-foreground">
                {COPY.emailLabel}
              </label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                <input
                  id="spotlight-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={COPY.emailPlaceholder}
                  className={INPUT_BASE}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spotlight-password" className="text-xs font-medium text-muted-foreground">
                {COPY.passwordLabel}
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                <input
                  id="spotlight-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={COPY.passwordPlaceholder}
                  className={INPUT_BASE}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border bg-card accent-primary"
                />
                {COPY.rememberLabel}
              </label>
              <button type="button" className="text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline">
                {COPY.forgotLabel}
              </button>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.25)] transition hover:bg-primary/90"
            >
              {COPY.submitLabel}
            </button>

            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{COPY.dividerLabel}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
                <path fill="#4CAF50" d="M24 45.5c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2 1.4-4.6 2.1-7.6 2.1-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 40.9 16.2 45.5 24 45.5z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.4 36 44.5 31 44.5 25c0-1.5-.2-3-.9-4.5z" />
              </svg>
              {COPY.googleLabel}
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {COPY.signupPromptLabel}{" "}
              <button type="button" onClick={() => goTo("signup")} className="font-medium text-foreground underline-offset-2 hover:underline">
                {COPY.signupLinkLabel}
              </button>
            </p>
          </form>
        )}

        {view === "signup" && step === 1 && (
          <div key="step1" className="step-fade-in flex flex-col gap-4">
            <div className="flex items-center justify-center">
              <div className="relative inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
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
                  {SIGNUP_PLANS_COPY.monthlyLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    billing === "annual" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {SIGNUP_PLANS_COPY.annualLabel}
                </button>
                {billing === "annual" && (
                  <img
                    src={save20Scribble}
                    alt={ANNUAL_SAVINGS_LABEL}
                    className="scribble-pop pointer-events-none absolute -right-16 -top-7 h-10 w-auto"
                  />
                )}
              </div>
            </div>

            <div role="radiogroup" aria-label="Select a plan" className="flex flex-col gap-2">
              <div className="plan-row-rise overflow-hidden rounded-xl" style={{ animationDelay: "0ms" }}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedPlan === "trial"}
                  onClick={() => setSelectedPlan("trial")}
                  className={`relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left backdrop-blur-md transition-all ${
                    selectedPlan === "trial"
                      ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.45),0_0_28px_hsl(var(--primary)/0.22)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      selectedPlan === "trial" ? "border-primary-text" : "border-muted-foreground/50"
                    }`}
                  >
                    {selectedPlan === "trial" && <span className="h-2 w-2 rounded-full bg-primary-text" />}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
                  <span className="rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/90">
                    {TRIAL_PLAN.chip}
                  </span>
                </button>
              </div>

              {PAID_PLANS.map((plan, i) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  billing={billing}
                  selected={selectedPlan === plan.id}
                  onSelect={() => setSelectedPlan(plan.id)}
                  expanded={expandedPlan === plan.id}
                  onToggleExpand={() => setExpandedPlan((p) => (p === plan.id ? null : plan.id))}
                  index={i + 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToStep(2)}
              className="mt-1 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.25)] transition hover:bg-primary/90"
            >
              {selectedPlan === "trial" ? SIGNUP_PLANS_COPY.ctaTrialLabel : SIGNUP_PLANS_COPY.ctaPaidLabel}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {SIGNUP_PLANS_COPY.loginPromptLabel}{" "}
              <button type="button" onClick={() => goTo("login")} className="font-medium text-foreground underline-offset-2 hover:underline">
                {SIGNUP_PLANS_COPY.loginLinkLabel}
              </button>
            </p>
          </div>
        )}

        {view === "signup" && step === 2 && (
          <form
            key="step2"
            onSubmit={(e) => e.preventDefault()}
            className="step-fade-in flex flex-col gap-4"
          >
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
                <button
                  type="button"
                  onClick={() => setProfileTab("individual")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    profileTab === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {SIGNUP_PROFILE_COPY.individualTabLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab("agency")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    profileTab === "agency" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {SIGNUP_PROFILE_COPY.agencyTabLabel}
                </button>
              </div>
            </div>

            {profileTab === "individual" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="spotlight-fullname" className="text-xs font-medium text-muted-foreground">
                    {SIGNUP_PROFILE_COPY.fullNameLabel}
                  </label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                    <input
                      id="spotlight-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.fullNamePlaceholder}
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="spotlight-profile-email" className="text-xs font-medium text-muted-foreground">
                    {SIGNUP_PROFILE_COPY.emailLabel}
                  </label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                    <input
                      id="spotlight-profile-email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.emailPlaceholder}
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="spotlight-agencyname" className="text-xs font-medium text-muted-foreground">
                    {SIGNUP_PROFILE_COPY.agencyNameLabel}
                  </label>
                  <div className="group relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                    <input
                      id="spotlight-agencyname"
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.agencyNamePlaceholder}
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="spotlight-adminemail" className="text-xs font-medium text-muted-foreground">
                    {SIGNUP_PROFILE_COPY.adminEmailLabel}
                  </label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                    <input
                      id="spotlight-adminemail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder={SIGNUP_PROFILE_COPY.adminEmailPlaceholder}
                      className={INPUT_BASE}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spotlight-phone" className="text-xs font-medium text-muted-foreground">
                {SIGNUP_PROFILE_COPY.phoneLabel}
              </label>
              <div className="flex gap-2">
                <select
                  defaultValue={SIGNUP_PROFILE_COPY.phoneCode}
                  aria-label="Country code"
                  className="w-20 rounded-[28px] border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-primary-text"
                >
                  <option value={SIGNUP_PROFILE_COPY.phoneCode}>{SIGNUP_PROFILE_COPY.phoneCode}</option>
                </select>
                <div className="group relative flex-1">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                  <input
                    id="spotlight-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={SIGNUP_PROFILE_COPY.phonePlaceholder}
                    className={INPUT_BASE}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spotlight-setpassword" className="text-xs font-medium text-muted-foreground">
                {SIGNUP_PROFILE_COPY.setPasswordLabel}
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                <input
                  id="spotlight-setpassword"
                  type={showSetPassword ? "text" : "password"}
                  value={setPasswordVal}
                  onChange={(e) => setSetPasswordVal(e.target.value)}
                  placeholder={SIGNUP_PROFILE_COPY.passwordPlaceholder}
                  className={INPUT_BASE}
                />
                <button
                  type="button"
                  onClick={() => setShowSetPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showSetPassword ? "Hide password" : "Show password"}
                >
                  {showSetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{SIGNUP_PROFILE_COPY.passwordHint}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spotlight-confirmpassword" className="text-xs font-medium text-muted-foreground">
                {SIGNUP_PROFILE_COPY.confirmPasswordLabel}
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                <input
                  id="spotlight-confirmpassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={INPUT_BASE}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-1/3 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                {SIGNUP_PROFILE_COPY.backLabel}
              </button>
              <button
                type="submit"
                disabled={!canSubmitProfile}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.25)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {canSubmitProfile ? SIGNUP_PROFILE_COPY.submitLabel : SIGNUP_PROFILE_COPY.submitDisabledLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
