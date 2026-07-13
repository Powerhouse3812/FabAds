import { useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowUpRight,
  User,
  ChevronDown,
  Check,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
import { COUNTRY_CODES } from "@/components/auth/signup/types";

import heroMockup from "@/assets/auth/hero-mockup.png";
import heroLogo from "@/assets/auth/hero-logo.svg";
import fabadsLogoDark from "@/assets/fabads-logo-dark.svg";
import signupPlanLogo from "@/assets/auth/signup-plan-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

const COPY = AUTH_CONCEPT_COPY;
const PLANS_COPY = SIGNUP_PLANS_COPY;
const PROFILE_COPY = SIGNUP_PROFILE_COPY;

// v1.2 retrofit kept: avatar tones are lime-family + neutral. Godmode round
// restores the holographic identity elsewhere (hero field, borders, badges)
// without touching this — the human-trust signal stays calm on purpose.
const AVATARS = [
  { initials: "RA", className: "bg-primary text-primary-foreground" },
  { initials: "MK", className: "bg-primary/45 text-foreground" },
  { initials: "SJ", className: "bg-muted-foreground/30 text-foreground" },
  { initials: "PT", className: "bg-foreground/10 text-foreground" },
];

type ProfileMode = "individual" | "agency";

/** Shared input shell — adds the `.ripple-field` hue-shift micro-interaction
 *  on focus (see <style> below) around every text input in this concept. */
function FieldShell({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="ripple-field relative rounded-[28px]">{children}</div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Radio dot — iridescent gradient fill when selected instead of flat lime,
 *  matching the plan-row gradient border trick. */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
        selected
          ? "radio-dot-selected border-transparent"
          : "border-white/25 bg-white/5",
      )}
    >
      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

/** Plan/trial row shell — selected rows get the rotating conic-gradient
 *  border (the "iridescent animated border" from the brief); unselected
 *  rows stay a plain glass row so the selected one visibly pops. */
function PlanRowShell({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-2xl transition",
        selected ? "plan-border-selected p-[1.5px]" : "border border-white/10 p-0",
      )}
    >
      <div
        className={cn(
          "rounded-[15px] px-4 py-3 backdrop-blur-md transition",
          selected ? "bg-[#0a0a12]/95" : "bg-white/[0.03] hover:bg-white/[0.05]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function Concept05IridescentAI() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = searchParams.get("step") === "2" ? 2 : 1;

  const goTo = (v: "login" | "signup") =>
    setSearchParams(v === "login" ? {} : { view: "signup", step: "1" });
  const goToStep = (s: 1 | 2) => setSearchParams({ view: "signup", step: String(s) });

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // Signup step 1 — plan selection
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>("starter");
  const [sweepKey, setSweepKey] = useState(0);

  // Signup step 2 — profile setup
  const [profileMode, setProfileMode] = useState<ProfileMode>("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [countryCode, setCountryCode] = useState<string>(PROFILE_COPY.phoneCode);
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Hero cursor parallax — the hero-mockup floats a few px opposite the
  // cursor, like a product suspended inside the aurora.
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTilt({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const handleBillingChange = (next: BillingCycle) => {
    setBilling(next);
    setSweepKey((k) => k + 1);
  };

  const selectPlan = (id: SelectablePlanId) => {
    setSelectedPlan(id);
    setExpandedPlan(id);
  };

  const hasPlan = Boolean(selectedPlan);
  const step1CtaLabel = selectedPlan === "trial" ? PLANS_COPY.ctaTrialLabel : PLANS_COPY.ctaPaidLabel;
  const step2CtaLabel = hasPlan ? PROFILE_COPY.submitLabel : PROFILE_COPY.submitDisabledLabel;

  return (
    <div className="dark relative min-h-[100dvh] bg-background text-foreground">
      <style>{`
        /* ============ Holographic / oil-slick field ============
           Layered conic + radial gradients in teal/violet/magenta/amber,
           screen-blended, sitting inside a wrapper whose *filter*
           hue-rotates continuously — that's what keeps the whole field
           sliding through hues together instead of each blob drifting on
           its own palette. Deeper + silkier than the original round: more
           layers, slower rotation, heavier blur. */
        @keyframes holo-hue-rotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .holo-field {
          position: absolute;
          inset: 0;
          animation: holo-hue-rotate 26s linear infinite;
        }
        .holo-layer {
          position: absolute;
          inset: -25%;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .holo-layer-a {
          background: conic-gradient(from 120deg at 30% 25%, #1fb8a8, #8b6bf2, #ec4fa0, #f5a623, #1fb8a8);
          opacity: 0.5;
          filter: blur(50px);
          animation: holo-drift-a 24s ease-in-out infinite;
        }
        .holo-layer-b {
          background: radial-gradient(circle at 72% 62%, #9b6bf5cc, transparent 60%);
          opacity: 0.55;
          filter: blur(38px);
          animation: holo-drift-b 19s ease-in-out infinite;
        }
        .holo-layer-c {
          background: radial-gradient(circle at 38% 82%, #f5a623bb, transparent 55%);
          opacity: 0.4;
          filter: blur(42px);
          animation: holo-drift-c 28s ease-in-out infinite;
        }
        .holo-layer-d {
          background: radial-gradient(circle at 85% 15%, #ec4fa0aa, transparent 55%);
          opacity: 0.35;
          filter: blur(46px);
          animation: holo-drift-d 22s ease-in-out infinite;
        }
        @keyframes holo-drift-a {
          0%, 100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          50% { transform: translate(4%, -5%) scale(1.12) rotate(10deg); }
        }
        @keyframes holo-drift-b {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-5%, 4%) scale(1.18); }
        }
        @keyframes holo-drift-c {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(3%, 5%) scale(1.08); }
        }
        @keyframes holo-drift-d {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-3%, -3%) scale(1.14); }
        }

        /* Dot-grid + concentric rings — kept from the DS round, layered
           INTO the holographic field per Maalik's call (best of both). */
        @keyframes hero-dotgrid-breathe {
          0%, 100% { opacity: 0.07; }
          50% { opacity: 0.13; }
        }
        .hero-dotgrid { animation: hero-dotgrid-breathe 9s ease-in-out infinite; }
        @keyframes hero-ring-pulse {
          0% { transform: scale(0.55); opacity: 0.55; }
          70% { opacity: 0.12; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        .hero-ring {
          position: absolute; inset: 0; margin: auto;
          width: 140px; height: 140px; border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.55);
          animation: hero-ring-pulse 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .hero-ring-2 { animation-delay: 1.6s; }
        .hero-ring-3 { animation-delay: 3.2s; }
        @keyframes hero-line-fade {
          0%, 100% { opacity: 0.14; }
          50% { opacity: 0.3; }
        }
        .hero-lines path { animation: hero-line-fade 10s ease-in-out infinite; }
        .hero-lines path:nth-child(2) { animation-delay: 3.5s; }

        /* Hero mockup — floats gently, edge-glows in shifting hues, and
           shifts a few px opposite the cursor (parallax applied inline). */
        @keyframes hero-mockup-float {
          0%, 100% { transform: translateY(0px) rotate(-1.2deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        .hero-mockup-float { animation: hero-mockup-float 6.5s ease-in-out infinite; }
        @keyframes hero-mockup-glow {
          0%, 100% { filter: drop-shadow(0 12px 40px rgba(139,107,242,0.5)) drop-shadow(0 0 70px rgba(236,79,160,0.28)); }
          50% { filter: drop-shadow(0 12px 46px rgba(31,184,168,0.5)) drop-shadow(0 0 80px rgba(245,166,35,0.28)); }
        }
        .hero-mockup-glow { animation: hero-mockup-glow 8s ease-in-out infinite; }

        /* Circular hover-sweep CTA — recolored iridescent (conic sweep). */
        .hero-cta { position: relative; overflow: hidden; isolation: isolate; }
        .hero-cta::before {
          content: "";
          position: absolute; inset: 0;
          background: conic-gradient(from 0deg, #1fb8a8, #8b6bf2, #ec4fa0, #f5a623, #1fb8a8);
          transform: translateX(-105%);
          transition: transform 380ms cubic-bezier(0.65, 0, 0.35, 1);
          z-index: 0;
        }
        .hero-cta:hover::before { transform: translateX(0%); }
        .hero-cta-arrow { transition: transform 320ms cubic-bezier(0.65, 0, 0.35, 1); position: relative; z-index: 1; }
        .hero-cta:hover .hero-cta-arrow { transform: rotate(45deg); }

        /* Micro-interaction 1 — input focus ripples a brief hue shift
           across the field's edge (pure CSS, retriggers on every
           :focus-within transition). */
        .ripple-field::after {
          content: "";
          position: absolute; inset: -3px;
          border-radius: inherit;
          background: conic-gradient(from 0deg, #1fb8a8, #8b6bf2, #ec4fa0, #f5a623, #1fb8a8);
          filter: blur(7px);
          opacity: 0;
          z-index: -1;
          pointer-events: none;
        }
        .ripple-field:focus-within::after { animation: ripple-pulse 700ms ease-out; }
        @keyframes ripple-pulse {
          0% { opacity: 0.55; transform: scale(0.97); }
          100% { opacity: 0; transform: scale(1.05); }
        }

        /* Micro-interaction 2 — billing toggle fires a fast aurora sweep
           across the hero / ambient field. One-shot, remounted via key. */
        .aurora-sweep {
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.16) 45%, rgba(139,107,242,0.4) 50%, rgba(255,255,255,0.16) 55%, transparent 70%);
        }
        .aurora-sweep-anim { animation: aurora-sweep-move 900ms ease-out forwards; }
        @keyframes aurora-sweep-move {
          from { transform: translateX(-130%) skewX(-8deg); opacity: 1; }
          to { transform: translateX(130%) skewX(-8deg); opacity: 0; }
        }

        /* Micro-interaction 3 — step 1→2 transition slides with a brief
           chromatic offset (remounted via key={step}). */
        .step-slide { animation: step-slide-in 480ms cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes step-slide-in {
          0% { opacity: 0; transform: translateX(26px); filter: drop-shadow(-3px 0 0 rgba(236,79,160,0.55)) drop-shadow(3px 0 0 rgba(31,184,168,0.55)); }
          55% { filter: drop-shadow(-1px 0 0 rgba(236,79,160,0.3)) drop-shadow(1px 0 0 rgba(31,184,168,0.3)); }
          100% { opacity: 1; transform: translateX(0px); filter: drop-shadow(0 0 0 transparent); }
        }

        /* Selected-plan rotating gradient border + selected radio fill +
           Most Popular shimmer — all share the same iridescent palette. */
        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        .plan-border-selected {
          background: conic-gradient(from var(--border-angle), #1fb8a8, #8b6bf2, #ec4fa0, #f5a623, #1fb8a8);
          animation: spin-border 5s linear infinite;
        }
        @keyframes spin-border { to { --border-angle: 360deg; } }
        .radio-dot-selected {
          background: conic-gradient(from 0deg, #1fb8a8, #8b6bf2, #ec4fa0, #f5a623, #1fb8a8);
        }
        .badge-shimmer {
          background-image: linear-gradient(110deg, #1fb8a8, #8b6bf2 30%, #ec4fa0 60%, #f5a623 90%, #1fb8a8);
          background-size: 220% 100%;
          animation: badge-shimmer-move 3.2s linear infinite;
        }
        @keyframes badge-shimmer-move { to { background-position: -220% 0; } }
      `}</style>

      {/* Persistent brand mark — top-left on every view. */}
      <img
        src={fabadsLogoDark}
        alt="FabAds"
        className="pointer-events-none absolute left-6 top-6 z-30 h-5 w-auto opacity-90"
      />

      {view === "login" ? (
        <div className="relative flex min-h-[100dvh] items-stretch">
          {/* Left: holographic hero */}
          <div
            ref={heroRef}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={resetTilt}
            className="relative hidden w-1/2 overflow-hidden lg:block"
          >
            <div className="absolute inset-0 bg-background" />

            {/* oil-slick holographic field */}
            <div className="holo-field">
              <div className="holo-layer holo-layer-a" />
              <div className="holo-layer holo-layer-b" />
              <div className="holo-layer holo-layer-c" />
              <div className="holo-layer holo-layer-d" />
            </div>

            {/* dot grid, layered into the field */}
            <div
              className="hero-dotgrid absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1.6px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* pulsing concentric rings */}
            <div className="absolute inset-0">
              <div className="hero-ring" />
              <div className="hero-ring hero-ring-2" />
              <div className="hero-ring hero-ring-3" />
            </div>

            {/* abstract line paths */}
            <svg
              className="hero-lines absolute inset-0 h-full w-full"
              viewBox="0 0 400 600"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M-20 460 C 90 380, 150 420, 240 300 S 360 140, 420 90"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
              />
              <path
                d="M-30 120 C 70 180, 140 150, 220 230 S 340 380, 430 420"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
              />
            </svg>

            {/* vignette for legibility */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_30%,hsl(var(--background)/0.72)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-transparent to-background/78" />

            {/* headline + brand mark */}
            <div className="absolute left-10 top-12 max-w-sm">
              <img src={heroLogo} alt="FabAds" className="h-6 w-auto opacity-90" />
              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.01em] text-foreground">
                Ads that write, launch, and optimize themselves.
              </h2>
            </div>

            {/* hero-mockup suspended in the aurora, edge-glowing + parallax */}
            <div
              className="absolute inset-x-6 top-[38%] flex justify-center"
              style={{
                transform: `translate(${tilt.x * -18}px, ${tilt.y * -12}px)`,
                transition: "transform 140ms ease-out",
              }}
            >
              <div className="hero-mockup-float">
                <img
                  src={heroMockup}
                  alt=""
                  aria-hidden="true"
                  className="hero-mockup-glow w-[78%] max-w-[280px] rounded-xl"
                />
              </div>
            </div>

            {/* floating avatar-stack card */}
            <div className="absolute bottom-12 left-10 right-10 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {AVATARS.map((a, i) => (
                    <div
                      key={a.initials}
                      style={{ zIndex: AVATARS.length - i }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold ${a.className}`}
                    >
                      {a.initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">4,500+</span>{" "}
                  marketers already in
                </p>
              </div>

              <button
                type="button"
                aria-label="Learn more"
                className="hero-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-foreground/10"
              >
                <ArrowUpRight
                  className="hero-cta-arrow relative z-10 h-[18px] w-[18px] text-foreground"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Right: glassy login form */}
          <div className="relative flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.1)_0%,transparent_55%)]" />

            <div className="relative z-10 w-full max-w-sm">
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                  {COPY.headingEmoji} {COPY.heading}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{COPY.subheading}</p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                <FieldShell label={COPY.emailLabel} htmlFor="iridescent-email">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="iridescent-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={COPY.emailPlaceholder}
                    className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                  />
                </FieldShell>

                <FieldShell label={COPY.passwordLabel} htmlFor="iridescent-password">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="iridescent-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={COPY.passwordPlaceholder}
                    className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </FieldShell>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border bg-foreground/10 accent-primary"
                    />
                    {COPY.rememberLabel}
                  </label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
                  >
                    {COPY.forgotLabel}
                  </button>
                </div>

                <button
                  type="submit"
                  style={{ boxShadow: "0 4px 24px hsl(var(--primary) / 0.35)" }}
                  className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  {COPY.submitLabel}
                </button>

                <div className="my-2 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {COPY.dividerLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 py-2.5 text-sm font-medium text-foreground backdrop-blur-md transition hover:bg-foreground/10"
                >
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
                  {COPY.googleLabel}
                </button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {COPY.signupPromptLabel}{" "}
                  <button
                    type="button"
                    onClick={() => goTo("signup")}
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    {COPY.signupLinkLabel}
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Signup — ambient holographic field behind a centered glass panel,
           shared across both steps for one continuous ID. */
        <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10">
          <div className="absolute inset-0 bg-background" />
          <div className="holo-field" style={{ opacity: 0.75 }}>
            <div className="holo-layer holo-layer-a" />
            <div className="holo-layer holo-layer-b" />
            <div className="holo-layer holo-layer-c" />
            <div className="holo-layer holo-layer-d" />
          </div>
          <div
            className="hero-dotgrid absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1.6px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_20%,hsl(var(--background)/0.82)_100%)]" />
          {sweepKey > 0 && (
            <div
              key={sweepKey}
              className="aurora-sweep aurora-sweep-anim pointer-events-none absolute inset-0 z-20"
            />
          )}

          <div key={`step-${step}`} className="step-slide relative z-10 w-full max-w-md">
            <div
              className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl sm:p-8"
              style={{ boxShadow: "0 40px 100px -30px rgba(139,107,242,0.45)" }}
            >
              {step === 1 ? (
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col items-center gap-5">
                  <img src={signupPlanLogo} alt="FabAds" className="h-6 w-auto" />

                  <div className="text-center">
                    <h1 className="text-xl font-bold text-foreground">{PLANS_COPY.heading}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{PLANS_COPY.subheading}</p>
                  </div>

                  {/* stepper */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("font-semibold", step === 1 ? "text-foreground" : "text-muted-foreground")}>
                      1. {PLANS_COPY.stepOneLabel}
                    </span>
                    <span className="h-px w-8 bg-white/15" />
                    <span className="text-muted-foreground">2. {PLANS_COPY.stepTwoLabel}</span>
                  </div>

                  {/* billing toggle — fires the aurora sweep micro-interaction */}
                  <div className="relative flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => handleBillingChange("monthly")}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition",
                        billing === "monthly" ? "bg-white/15 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {PLANS_COPY.monthlyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBillingChange("annual")}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition",
                        billing === "annual" ? "bg-white/15 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {PLANS_COPY.annualLabel}
                    </button>
                    <img
                      src={save20Scribble}
                      alt={ANNUAL_SAVINGS_LABEL}
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-14 -top-7 h-11 w-[70px] select-none"
                    />
                  </div>

                  <div role="radiogroup" aria-label="Plan" className="flex w-full flex-col gap-3">
                    <PlanRowShell selected={selectedPlan === "trial"} onClick={() => selectPlan("trial")}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <RadioDot selected={selectedPlan === "trial"} />
                          <span className="text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                          {TRIAL_PLAN.chip}
                        </span>
                      </div>
                    </PlanRowShell>

                    {PAID_PLANS.map((plan) => {
                      const price = priceForBilling(plan, billing);
                      const isDiscounted = billing === "annual" && plan.annualMonthlyPrice !== plan.monthlyPrice;
                      const savings = annualSavings(plan);
                      const isSelected = selectedPlan === plan.id;
                      const isExpanded = expandedPlan === plan.id;

                      return (
                        <PlanRowShell key={plan.id} selected={isSelected} onClick={() => selectPlan(plan.id)}>
                          <div className="flex flex-wrap items-center gap-2">
                            <RadioDot selected={isSelected} />
                            <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                              {plan.name} —{" "}
                              {isDiscounted && (
                                <span className="text-muted-foreground line-through">${plan.monthlyPrice}</span>
                              )}{" "}
                              ${price}
                              {billing === "annual" && (
                                <span className="font-normal text-muted-foreground"> / month</span>
                              )}
                            </span>

                            <div className="ml-auto flex items-center gap-2">
                              {billing === "annual" && (
                                <span className="whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                  Save ${savings} / billed yearly
                                </span>
                              )}
                              {plan.mostPopular && (
                                <span className="badge-shimmer whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-white">
                                  Most Popular
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPlan(isExpanded ? null : plan.id);
                                }}
                                aria-label={isExpanded ? "Collapse plan details" : "Expand plan details"}
                                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                              >
                                <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                              </button>
                            </div>
                          </div>

                          <p className="mt-1 pl-6 text-xs text-muted-foreground">{plan.subtitle}</p>

                          {isExpanded && plan.features && (
                            <div className="mt-3 grid grid-cols-1 gap-y-1.5 pl-6 sm:grid-cols-2">
                              {plan.features.map((feature) => (
                                <div key={feature} className="flex items-center gap-1.5 text-xs text-foreground">
                                  <Check className="h-3 w-3 shrink-0 text-primary-text" aria-hidden="true" />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          )}
                        </PlanRowShell>
                      );
                    })}
                  </div>

                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex w-full items-center justify-end gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {PLANS_COPY.planDetailsLabel}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>

                  <div className="flex w-full flex-col items-center gap-2">
                    <button
                      type="button"
                      disabled={!hasPlan}
                      onClick={() => goToStep(2)}
                      style={{ boxShadow: hasPlan ? "0 4px 24px hsl(var(--primary) / 0.35)" : undefined }}
                      className={cn(
                        "w-full rounded-full py-2.5 text-sm font-semibold transition",
                        hasPlan
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "cursor-not-allowed bg-white/10 text-muted-foreground",
                      )}
                    >
                      {step1CtaLabel}
                    </button>
                    <p className="text-sm text-muted-foreground">
                      {PLANS_COPY.loginPromptLabel}{" "}
                      <button
                        type="button"
                        onClick={() => goTo("login")}
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        {PLANS_COPY.loginLinkLabel}
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col items-center gap-5">
                  <img src={signupPlanLogo} alt="FabAds" className="h-6 w-auto" />

                  <div className="text-center">
                    <h1 className="text-xl font-bold text-foreground">{PROFILE_COPY.heading}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{PROFILE_COPY.subheading}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">1. {PLANS_COPY.stepOneLabel}</span>
                    <span className="h-px w-8 bg-white/15" />
                    <span className="font-semibold text-foreground">2. {PLANS_COPY.stepTwoLabel}</span>
                  </div>

                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setProfileMode("individual")}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition",
                        profileMode === "individual" ? "bg-white/15 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {PROFILE_COPY.individualTabLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMode("agency")}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-medium transition",
                        profileMode === "agency" ? "bg-white/15 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {PROFILE_COPY.agencyTabLabel}
                    </button>
                  </div>

                  <div className="flex w-full flex-col gap-4">
                    {profileMode === "individual" ? (
                      <>
                        <FieldShell label={PROFILE_COPY.fullNameLabel} htmlFor="iridescent-fullname">
                          <User
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <input
                            id="iridescent-fullname"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={PROFILE_COPY.fullNamePlaceholder}
                            className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                          />
                        </FieldShell>
                        <FieldShell label={PROFILE_COPY.emailLabel} htmlFor="iridescent-signup-email">
                          <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <input
                            id="iridescent-signup-email"
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder={PROFILE_COPY.emailPlaceholder}
                            className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                          />
                        </FieldShell>
                      </>
                    ) : (
                      <>
                        <FieldShell label={PROFILE_COPY.agencyNameLabel} htmlFor="iridescent-agency-name">
                          <User
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <input
                            id="iridescent-agency-name"
                            type="text"
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder={PROFILE_COPY.agencyNamePlaceholder}
                            className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                          />
                        </FieldShell>
                        <FieldShell label={PROFILE_COPY.adminEmailLabel} htmlFor="iridescent-admin-email">
                          <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <input
                            id="iridescent-admin-email"
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder={PROFILE_COPY.adminEmailPlaceholder}
                            className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                          />
                        </FieldShell>
                      </>
                    )}

                    <FieldShell label={PROFILE_COPY.phoneLabel} htmlFor="iridescent-phone">
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          aria-label="Country code"
                          className="w-[92px] shrink-0 rounded-[28px] border border-border bg-foreground/5 px-2 text-sm text-foreground outline-none backdrop-blur-md"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-background text-foreground">
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          id="iridescent-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={PROFILE_COPY.phonePlaceholder}
                          className="relative z-10 flex-1 rounded-[28px] border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                        />
                      </div>
                    </FieldShell>

                    <FieldShell
                      label={PROFILE_COPY.setPasswordLabel}
                      htmlFor="iridescent-signup-password"
                      hint={PROFILE_COPY.passwordHint}
                    >
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <input
                        id="iridescent-signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder={PROFILE_COPY.passwordPlaceholder}
                        className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </FieldShell>

                    <FieldShell label={PROFILE_COPY.confirmPasswordLabel} htmlFor="iridescent-confirm-password">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <input
                        id="iridescent-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={PROFILE_COPY.passwordPlaceholder}
                        className="relative z-10 w-full rounded-[28px] border border-border bg-foreground/5 px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition focus:border-primary/40 focus:bg-foreground/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </FieldShell>
                  </div>

                  <div className="flex w-full items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex-1 rounded-full border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-foreground backdrop-blur-md transition hover:bg-white/10"
                    >
                      {PROFILE_COPY.backLabel}
                    </button>
                    <button
                      type="submit"
                      disabled={!hasPlan}
                      style={{ boxShadow: hasPlan ? "0 4px 24px hsl(var(--primary) / 0.35)" : undefined }}
                      className={cn(
                        "flex-[2] rounded-full py-2.5 text-sm font-semibold transition",
                        hasPlan
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "cursor-not-allowed bg-white/10 text-muted-foreground",
                      )}
                    >
                      {step2CtaLabel}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
