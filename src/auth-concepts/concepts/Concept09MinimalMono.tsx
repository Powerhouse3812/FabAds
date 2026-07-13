import { useEffect, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_CONCEPT_COPY, SIGNUP_PLANS_COPY, SIGNUP_PROFILE_COPY } from "@/auth-concepts/shared/formSpec";
import {
  PAID_PLANS,
  TRIAL_PLAN,
  ANNUAL_SAVINGS_LABEL,
  priceForBilling,
  annualSavings,
  type SelectablePlanId,
  type BillingCycle,
} from "@/components/auth/signup/plans";

const COPY = AUTH_CONCEPT_COPY;
const PLANS_COPY = SIGNUP_PLANS_COPY;
const PROFILE_COPY = SIGNUP_PROFILE_COPY;

type View = "login" | "signup";
type ProfileMode = "individual" | "agency";

/** Magnetic hover: how far the submit button is allowed to drift toward the
 *  cursor. Kept tiny on purpose — this is a "quiet luxury" concept, the
 *  button should never visibly detach from its neighbours. Shared by every
 *  primary CTA across all three screens (login / plans / profile) — do not
 *  duplicate this math. */
const MAGNETIC_MAX_OFFSET = 7;
const MAGNETIC_STRENGTH = 0.28;

/** Every visible row (field, toggle, CTA, footer line) mounts through this
 *  so the page-load fade-up becomes a staggered cascade instead of one flat
 *  reveal — each row is +40ms behind the one before it. The keyframe itself
 *  (mono-fade-up, defined in the <style> block below) is untouched; only
 *  *where* it's applied changed, from one blanket wrapper to per-row. */
const ROW_MS = 40;

function FadeRow({
  index,
  className,
  children,
  ...rest
}: {
  index: number;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  return (
    <div className={cn("mono-row-fade", className)} style={{ animationDelay: `${index * ROW_MS}ms` }} {...rest}>
      {children}
    </div>
  );
}

/** Text-label toggle with a hairline that grows in under the active option —
 *  used for both Monthly/Annual (plans) and Individual/Agency (profile).
 *  Deliberately not a pill/segmented control: cards and pills are the thing
 *  every other concept already does, this one reads as a printed menu. */
function TextToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-7">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "relative pb-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-200",
            value === opt.value ? "text-white" : "text-white/35 hover:text-white/60",
          )}
        >
          {opt.label}
          <span
            className={cn(
              "absolute inset-x-0 -bottom-px h-px origin-center bg-primary transition-transform duration-300 ease-out",
              value === opt.value ? "scale-x-100" : "scale-x-0",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

export default function Concept09MinimalMono() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = searchParams.get("view") === "signup" ? "signup" : "login";
  const step: 1 | 2 = searchParams.get("step") === "2" ? 2 : 1;

  const goToLogin = () => setSearchParams({});
  const goToSignup = (nextStep: 1 | 2 = 1) => setSearchParams({ view: "signup", step: String(nextStep) });

  // ---- login state ----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // ---- signup / plans state ----
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>(null);

  // ---- signup / profile state ----
  const [profileMode, setProfileMode] = useState<ProfileMode>("individual");
  const [fullName, setFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Tab-focus choreography: the focused field's label lifts + brightens,
  // every *other* field on screen dims ~15% — a typographic spotlight
  // instead of a literal one. Shared across all three screens.
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const dim = (id: string) => (focusedField && focusedField !== id ? "opacity-[0.85]" : "opacity-100");
  const labelClass = (id: string) =>
    cn(
      "text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-200",
      focusedField === id ? "-translate-y-[3px] text-white/85" : focusedField ? "text-white/30" : "text-white/45",
    );

  // Live clock — the one grounding, unmistakably-alive detail at the very
  // bottom edge of the screen. Updates every second; cleaned up on unmount.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const clock = now.toLocaleTimeString("en-US", { hour12: false });

  // Magnetic hover state/ref/handlers — shared across every primary CTA on
  // this page (login submit, plans "Next", profile "Create account").
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });
  const submitRef = useRef<HTMLButtonElement>(null);

  const clamp = (value: number) => Math.max(-MAGNETIC_MAX_OFFSET, Math.min(MAGNETIC_MAX_OFFSET, value));

  const handleMagneticMove = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = submitRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    setMagnet({ x: clamp(dx * MAGNETIC_STRENGTH), y: clamp(dy * MAGNETIC_STRENGTH) });
  };
  const resetMagnetic = () => setMagnet({ x: 0, y: 0 });

  const selectPlan = (id: SelectablePlanId) => setSelectedPlan(id);
  const planCtaLabel = selectedPlan === "trial" ? PLANS_COPY.ctaTrialLabel : PLANS_COPY.ctaPaidLabel;

  return (
    <div className="dark flex min-h-[100dvh] items-center justify-center bg-background px-4 py-24">
      <style>{`
        @keyframes mono-fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .mono-row-fade {
          animation: mono-fade-up 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .mono-input {
          transition: box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
        }
        .mono-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.26);
          background-color: rgba(255, 255, 255, 0.03);
          box-shadow: 0 0 0 4px rgba(143, 184, 33, 0.18);
        }
        .mono-magnetic {
          transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
      `}</style>

      <div className="w-full max-w-[420px]">
        {/* Hairline grid — the frame that makes the whitespace read designed
            rather than leftover. Every zone below is bounded by one of these. */}
        <div className="border-t border-white/10" />

        {view === "login" && (
          <>
            {/* Header zone */}
            <FadeRow index={0} className="flex flex-col items-center gap-3 py-11 text-center">
              <div className="relative inline-flex items-start">
                <h1 className="text-[2.5rem] font-bold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
                  {COPY.heading}
                </h1>
                <span
                  aria-hidden="true"
                  className="ml-1 mt-0.5 select-none text-base opacity-70"
                  style={{ transform: "rotate(14deg)" }}
                >
                  {COPY.headingEmoji}
                </span>
              </div>
              <p className="text-sm text-white/45">{COPY.subheading}</p>
            </FadeRow>

            <div className="border-t border-white/10" />

            {/* Fields zone */}
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8 py-11">
              <FadeRow index={1} className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("email"))}>
                <label htmlFor="mono-email" className={labelClass("email")}>
                  {COPY.emailLabel}
                </label>
                <input
                  id="mono-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={COPY.emailPlaceholder}
                  className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 text-sm text-white placeholder:text-white/25"
                />
              </FadeRow>

              <FadeRow
                index={2}
                className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("password"))}
              >
                <label htmlFor="mono-password" className={labelClass("password")}>
                  {COPY.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="mono-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={COPY.passwordPlaceholder}
                    className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/75"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FadeRow>

              <FadeRow index={3} className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/45">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.02] accent-white"
                  />
                  {COPY.rememberLabel}
                </label>
                <button
                  type="button"
                  className="text-xs text-white/45 underline-offset-2 transition-colors hover:text-white hover:underline"
                >
                  {COPY.forgotLabel}
                </button>
              </FadeRow>

              <FadeRow index={4}>
                <button
                  ref={submitRef}
                  type="submit"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={resetMagnetic}
                  style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)` }}
                  className="group mono-magnetic mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {COPY.submitLabel}
                  <span
                    aria-hidden="true"
                    className="font-mono text-[11px] opacity-30 transition-opacity duration-200 group-hover:opacity-70"
                  >
                    ↵
                  </span>
                </button>
              </FadeRow>

              <FadeRow index={5} className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] uppercase tracking-wide text-white/30">{COPY.dividerLabel}</span>
                <div className="h-px flex-1 bg-white/10" />
              </FadeRow>

              <FadeRow index={6}>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-transparent py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
                >
                  <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
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
                  {COPY.googleLabel}
                </button>
              </FadeRow>
            </form>

            <div className="border-t border-white/10" />

            {/* Footer zone */}
            <FadeRow index={7} className="flex flex-col items-center gap-6 py-9">
              <p className="text-center text-sm text-white/45">
                {COPY.signupPromptLabel}{" "}
                <button
                  type="button"
                  onClick={() => goToSignup(1)}
                  className="font-medium text-white underline-offset-2 hover:underline"
                >
                  {COPY.signupLinkLabel}
                </button>
              </p>
              <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Trusted by 1,200+ performance marketers
              </p>
            </FadeRow>

            <div className="border-t border-white/10" />
          </>
        )}

        {view === "signup" && step === 1 && (
          <>
            {/* Header zone */}
            <FadeRow index={0} className="flex flex-col items-center gap-3 py-10 text-center">
              <StepMarker current={1} />
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">{PLANS_COPY.heading}</h1>
              <p className="text-sm text-white/45">{PLANS_COPY.subheading}</p>
            </FadeRow>

            <div className="border-t border-white/10" />

            {/* Menu zone — the plan "table": name left, price right, hairline
                rules between rows, selection marked only by a lime hairline
                on the left edge. No cards, no pills, no shadows. */}
            <div className="flex flex-col gap-6 py-10">
              <FadeRow index={1} className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {PLANS_COPY.stepOneLabel}
                </span>
                <TextToggle<BillingCycle>
                  value={billing}
                  onChange={setBilling}
                  options={[
                    { value: "monthly", label: PLANS_COPY.monthlyLabel },
                    { value: "annual", label: PLANS_COPY.annualLabel },
                  ]}
                />
              </FadeRow>

              <FadeRow index={2} role="radiogroup" aria-label="Plan" className="flex flex-col">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedPlan === "trial"}
                  onClick={() => selectPlan("trial")}
                  className={cn(
                    "flex items-center justify-between gap-4 border-b border-white/10 py-4 text-left transition-all duration-200",
                    selectedPlan === "trial" ? "border-l border-l-primary pl-3" : "border-l border-l-transparent pl-3",
                  )}
                >
                  <span className="flex flex-col gap-1">
                    <span className={cn("text-sm font-medium", selectedPlan === "trial" ? "text-white" : "text-white/65")}>
                      {TRIAL_PLAN.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                      {TRIAL_PLAN.chip}
                    </span>
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/40">Free</span>
                </button>

                {PAID_PLANS.map((plan) => {
                  const selected = selectedPlan === plan.id;
                  const expanded = expandedPlan === plan.id;
                  return (
                    <div key={plan.id} className="border-b border-white/10">
                      <div
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={() => selectPlan(plan.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") selectPlan(plan.id);
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left transition-all duration-200",
                          selected ? "border-l border-l-primary pl-3" : "border-l border-l-transparent pl-3",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors",
                              selected ? "text-white" : "text-white/65",
                            )}
                          >
                            {plan.name}
                          </span>
                          {plan.mostPopular && (
                            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                              Most popular
                            </span>
                          )}
                          {plan.features && (
                            <button
                              type="button"
                              aria-label={expanded ? "Collapse plan details" : "Expand plan details"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPlan((cur) => (cur === plan.id ? null : plan.id));
                              }}
                              className="text-white/30 transition-colors hover:text-white/70"
                            >
                              <ChevronDown
                                className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-180")}
                              />
                            </button>
                          )}
                        </span>
                        <span className="flex items-baseline gap-2 font-mono tabular-nums">
                          {billing === "annual" && (
                            <span className="text-xs text-white/25 line-through">${plan.monthlyPrice}</span>
                          )}
                          <span className={cn("text-sm", selected ? "text-white" : "text-white/65")}>
                            ${priceForBilling(plan, billing)}
                          </span>
                          <span className="text-[10px] text-white/30">/mo</span>
                        </span>
                      </div>
                      {billing === "annual" && (
                        <p className="pb-3 pl-3 text-right text-[10px] uppercase tracking-[0.12em] text-primary/70">
                          {ANNUAL_SAVINGS_LABEL} · ${annualSavings(plan)} billed yearly
                        </p>
                      )}
                      {expanded && plan.features && (
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/[0.06] py-3 pl-3 text-xs text-white/45">
                          {plan.features.map((f) => (
                            <li key={f} className="truncate">
                              · {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </FadeRow>

              <FadeRow index={3} className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-white/40 underline-offset-2 transition-colors hover:text-white hover:underline"
                >
                  {PLANS_COPY.planDetailsLabel}
                </button>
              </FadeRow>
            </div>

            <div className="border-t border-white/10" />

            {/* Actions + footer zone */}
            <FadeRow index={4} className="flex flex-col items-center gap-5 py-9">
              <button
                ref={submitRef}
                type="button"
                disabled={!selectedPlan}
                onMouseMove={handleMagneticMove}
                onMouseLeave={resetMagnetic}
                onClick={() => goToSignup(2)}
                style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)` }}
                className="group mono-magnetic flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                {planCtaLabel}
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] opacity-30 transition-opacity duration-200 group-hover:opacity-70"
                >
                  ↵
                </span>
              </button>
              <p className="text-center text-sm text-white/45">
                {PLANS_COPY.loginPromptLabel}{" "}
                <button type="button" onClick={goToLogin} className="font-medium text-white underline-offset-2 hover:underline">
                  {PLANS_COPY.loginLinkLabel}
                </button>
              </p>
            </FadeRow>

            <div className="border-t border-white/10" />
          </>
        )}

        {view === "signup" && step === 2 && (
          <>
            {/* Header zone */}
            <FadeRow index={0} className="flex flex-col items-center gap-3 py-10 text-center">
              <StepMarker current={2} />
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">{PROFILE_COPY.heading}</h1>
              <p className="text-sm text-white/45">{PROFILE_COPY.subheading}</p>
            </FadeRow>

            <div className="border-t border-white/10" />

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8 py-10">
              <FadeRow index={1} className="flex justify-center">
                <TextToggle<ProfileMode>
                  value={profileMode}
                  onChange={setProfileMode}
                  options={[
                    { value: "individual", label: PROFILE_COPY.individualTabLabel },
                    { value: "agency", label: PROFILE_COPY.agencyTabLabel },
                  ]}
                />
              </FadeRow>

              {profileMode === "individual" ? (
                <>
                  <FadeRow
                    index={2}
                    className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("fullName"))}
                  >
                    <label htmlFor="mono-fullname" className={labelClass("fullName")}>
                      {PROFILE_COPY.fullNameLabel}
                    </label>
                    <input
                      id="mono-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocusedField("fullName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={PROFILE_COPY.fullNamePlaceholder}
                      className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 text-sm text-white placeholder:text-white/25"
                    />
                  </FadeRow>

                  <FadeRow
                    index={3}
                    className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("profileEmail"))}
                  >
                    <label htmlFor="mono-profile-email" className={labelClass("profileEmail")}>
                      {PROFILE_COPY.emailLabel}
                    </label>
                    <input
                      id="mono-profile-email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      onFocus={() => setFocusedField("profileEmail")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={PROFILE_COPY.emailPlaceholder}
                      className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 text-sm text-white placeholder:text-white/25"
                    />
                  </FadeRow>
                </>
              ) : (
                <>
                  <FadeRow
                    index={2}
                    className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("agencyName"))}
                  >
                    <label htmlFor="mono-agency-name" className={labelClass("agencyName")}>
                      {PROFILE_COPY.agencyNameLabel}
                    </label>
                    <input
                      id="mono-agency-name"
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      onFocus={() => setFocusedField("agencyName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={PROFILE_COPY.agencyNamePlaceholder}
                      className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 text-sm text-white placeholder:text-white/25"
                    />
                  </FadeRow>

                  <FadeRow
                    index={3}
                    className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("adminEmail"))}
                  >
                    <label htmlFor="mono-admin-email" className={labelClass("adminEmail")}>
                      {PROFILE_COPY.adminEmailLabel}
                    </label>
                    <input
                      id="mono-admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      onFocus={() => setFocusedField("adminEmail")}
                      onBlur={() => setFocusedField(null)}
                      placeholder={PROFILE_COPY.adminEmailPlaceholder}
                      className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 text-sm text-white placeholder:text-white/25"
                    />
                  </FadeRow>
                </>
              )}

              <FadeRow index={4} className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("phone"))}>
                <label htmlFor="mono-phone" className={labelClass("phone")}>
                  {PROFILE_COPY.phoneLabel}
                </label>
                <div className="flex items-center gap-2 rounded-[28px] border border-border bg-white/[0.015] pl-4 pr-1">
                  <span className="font-mono text-sm text-white/40">{PROFILE_COPY.phoneCode}</span>
                  <span className="h-4 w-px bg-white/10" />
                  <input
                    id="mono-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={PROFILE_COPY.phonePlaceholder}
                    className="mono-input w-full rounded-[28px] bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/25"
                  />
                </div>
              </FadeRow>

              <FadeRow
                index={5}
                className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("setPassword"))}
              >
                <label htmlFor="mono-set-password" className={labelClass("setPassword")}>
                  {PROFILE_COPY.setPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="mono-set-password"
                    type={showProfilePassword ? "text" : "password"}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    onFocus={() => setFocusedField("setPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={PROFILE_COPY.passwordPlaceholder}
                    className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/75"
                    aria-label={showProfilePassword ? "Hide password" : "Show password"}
                  >
                    {showProfilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/30">{PROFILE_COPY.passwordHint}</p>
              </FadeRow>

              <FadeRow
                index={6}
                className={cn("flex flex-col gap-2.5 transition-opacity duration-300", dim("confirmPassword"))}
              >
                <label htmlFor="mono-confirm-password" className={labelClass("confirmPassword")}>
                  {PROFILE_COPY.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="mono-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={PROFILE_COPY.passwordPlaceholder}
                    className="mono-input w-full rounded-[28px] border border-border bg-white/[0.015] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/75"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FadeRow>

              <FadeRow index={7} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToSignup(1)}
                  className="flex-1 rounded-full border border-border bg-transparent py-3 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
                >
                  {PROFILE_COPY.backLabel}
                </button>
                <button
                  ref={submitRef}
                  type="submit"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={resetMagnetic}
                  style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)` }}
                  className="group mono-magnetic flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {PROFILE_COPY.submitLabel}
                  <span
                    aria-hidden="true"
                    className="font-mono text-[11px] opacity-30 transition-opacity duration-200 group-hover:opacity-70"
                  >
                    ↵
                  </span>
                </button>
              </FadeRow>
            </form>

            <div className="border-t border-white/10" />
          </>
        )}
      </div>

      {/* Grounding detail — a live clock + tagline pinned to the very bottom
          edge of the viewport, in tiny mono-spaced low-opacity caps. The one
          unmistakably-alive element on an otherwise still page. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 border-t border-white/[0.06] bg-background/70 px-6 py-2.5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[420px] items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-white/25">
          <span>FabFunnel — precision for performance marketers</span>
          <span className="tabular-nums">{clock}</span>
        </div>
      </div>
    </div>
  );
}

/** "01 · Plan selection — 02 · Profile setup" step marker. Text only, no
 *  progress bar chrome — the active step is just brighter. */
function StepMarker({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
      <span className={cn(current === 1 && "text-white/70")}>01 · {SIGNUP_PLANS_COPY.stepOneLabel}</span>
      <span className="h-px w-6 bg-white/15" />
      <span className={cn(current === 2 && "text-white/70")}>02 · {SIGNUP_PLANS_COPY.stepTwoLabel}</span>
    </div>
  );
}
