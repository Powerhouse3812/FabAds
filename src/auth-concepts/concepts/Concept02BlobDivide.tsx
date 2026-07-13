import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  BarChart3,
  Rocket,
  Activity,
  ChevronDown,
  Check,
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
  type BillingCycle,
  type SelectablePlanId,
} from "@/components/auth/signup/plans";
import { COUNTRY_CODES } from "@/components/auth/signup/types";
import { cn } from "@/lib/utils";

import heroMockup from "@/assets/auth/hero-mockup.png";
import heroLogo from "@/assets/auth/hero-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

/**
 * Concept 02 — "Blob divide": organic split (GODMODE rework).
 *
 * The illustration side is a hand-authored blob (clip-path polygon) that now
 * acts as a WINDOW into the product — hero-mockup.png clipped inside it,
 * sitting on a deep green-noir gradient, with 3 callout pins re-anchored to
 * real regions of the composite (chart / launch summary / phone stats) so
 * they read as annotations, not decoration. The headline block is pinned to
 * the top of the panel and pins never start before the 40% vertical mark —
 * this is a structural fix for the old "Auto-optimized" pin overlapping the
 * headline, not a coordinate nudge, so it holds at 1280–1600px widths.
 *
 * The blob boundary keeps its slow "breathing" scale loop AND gets a new
 * one-shot clip-path "wobble" that fires whenever the view (login/signup)
 * or signup step changes — the two are separate animations layered on the
 * same clip-path so breathing never stalls while the wobble plays.
 *
 * Signup Step 1 (plan selection) lives on the form side as a real
 * trial-row + accordion plan list (Starter pre-selected, like the real
 * /auth screen); the SELECTED plan echoes live inside the blob side as a
 * glass chip next to the copyright line, tying the two halves together.
 */

const BLOB_CLIP_PATH =
  "polygon(0% 0%, 78% 0%, 84% 6%, 79% 14%, 91% 20%, 100% 28%, 94% 38%, 100% 48%, 88% 56%, 96% 66%, 85% 74%, 92% 84%, 78% 90%, 82% 100%, 0% 100%)";

// Same vertex count as BLOB_CLIP_PATH (browsers interpolate clip-path
// polygons only when point counts match) — jittered midpoints, endpoints
// pinned at 0%/100% so the panel's left edge stays flush against the form.
const BLOB_CLIP_PATH_WOBBLE =
  "polygon(0% 0%, 81% 2%, 88% 8%, 74% 12%, 95% 24%, 97% 32%, 90% 40%, 96% 46%, 84% 60%, 99% 62%, 81% 78%, 95% 82%, 74% 88%, 85% 98%, 0% 100%)";

interface CalloutPin {
  id: string;
  label: string;
  top: string;
  left: string;
  lineWidth: string;
  lineRotate: string;
  delayMs: number;
  floatDelayMs: number;
  Icon: typeof BarChart3;
}

// Re-anchored to the three regions actually visible on hero-mockup.png's
// laptop+phone composite: the performance chart, the launch/automation
// summary panel, and the phone's stats screen. All three sit at or below
// the 40% vertical mark — well clear of the headline block above them.
const PINS: CalloutPin[] = [
  {
    id: "live",
    label: "Live campaigns",
    top: "40%",
    left: "58%",
    lineWidth: "40px",
    lineRotate: "-14deg",
    delayMs: 150,
    floatDelayMs: 0,
    Icon: BarChart3,
  },
  {
    id: "auto",
    label: "Auto-optimized",
    top: "58%",
    left: "17%",
    lineWidth: "32px",
    lineRotate: "10deg",
    delayMs: 380,
    floatDelayMs: 900,
    Icon: Rocket,
  },
  {
    id: "monitor",
    label: "24/7 monitoring",
    top: "72%",
    left: "62%",
    lineWidth: "36px",
    lineRotate: "-8deg",
    delayMs: 610,
    floatDelayMs: 1700,
    Icon: Activity,
  },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.87c2.27-2.09 3.58-5.17 3.58-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3.02c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A11.997 11.997 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.55.39-2.27V6.62H1.28A11.997 11.997 0 0 0 0 12c0 1.93.46 3.76 1.28 5.38l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.62l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

const pillInput =
  "w-full rounded-[28px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary-text focus:ring-2 focus:ring-primary-text/30";

/** Trial row — non-expanding selectable radio row above the paid plans. */
function TrialOptionRow({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border px-4 py-3 transition-all",
        selected
          ? "border-primary-text bg-primary/10 shadow-sm"
          : "border-border hover:border-primary-text/40 hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
            selected ? "border-primary-text" : "border-input",
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-primary-text" />}
        </span>
        <span className="text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
      </div>
      <span className="whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
        {TRIAL_PLAN.chip}
      </span>
    </div>
  );
}

/** Paid-plan accordion row — select + expand independently, like the real Step 1. */
function PlanOptionRow({
  plan,
  billing,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
}: {
  plan: (typeof PAID_PLANS)[number];
  billing: BillingCycle;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}) {
  const price = priceForBilling(plan, billing);
  const isDiscounted = billing === "annual" && plan.annualMonthlyPrice !== plan.monthlyPrice;
  const savings = annualSavings(plan);

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-2xl border px-4 py-3 transition-all",
        selected
          ? "border-primary-text bg-primary/10 shadow-sm"
          : "border-border hover:border-primary-text/40 hover:bg-muted/50",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
            selected ? "border-primary-text" : "border-input",
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-primary-text" />}
        </span>
        <span className="whitespace-nowrap text-sm font-semibold text-foreground">
          {plan.name} -{" "}
          {isDiscounted && (
            <span className="text-muted-foreground line-through">${plan.monthlyPrice}</span>
          )}{" "}
          ${price}
          {billing === "annual" && <span className="font-normal text-muted-foreground"> / month</span>}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          {billing === "annual" && (
            <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Save ${savings} / billed yearly
            </span>
          )}
          {plan.mostPopular && (
            <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              Most Popular
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            aria-label={expanded ? "Collapse plan details" : "Expand plan details"}
            className="rounded-sm p-0.5 text-muted-foreground transition hover:text-foreground"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      <p className="mt-1 pl-6 text-xs text-muted-foreground">{plan.subtitle}</p>

      {expanded && plan.features && (
        <div className="mt-3 grid grid-cols-1 gap-y-1 pl-6 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-1.5 text-xs text-foreground">
              <Check className="h-3 w-3 shrink-0 text-primary-text" aria-hidden="true" />
              {feature}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Concept02BlobDivide() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = searchParams.get("step") === "2" ? 2 : 1;

  const goToLogin = () => setSearchParams({});
  const goToSignup = () => setSearchParams({ view: "signup" });
  const goToStep = (s: 1 | 2) =>
    setSearchParams(s === 1 ? { view: "signup" } : { view: "signup", step: "2" });

  // One-shot blob wobble whenever the view or step changes — remounting the
  // shape stack (via `key`) restarts the finite `blobdivide-morph`
  // animation while the infinite `blobdivide-breathe` loop keeps running
  // alongside it (both are layered on the same elements, see keyframes).
  const [wobbleKey, setWobbleKey] = useState(0);
  useEffect(() => {
    setWobbleKey((k) => k + 1);
  }, [view, step]);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // Signup — step 1 (plan selection)
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>("starter");

  const selectPlan = (id: SelectablePlanId) => {
    setSelectedPlan(id);
    setExpandedPlan(id);
  };

  // Signup — step 2 (profile setup)
  const [profileMode, setProfileMode] = useState<"individual" | "agency">("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [countryCode, setCountryCode] = useState<string>(profileCopy.phoneCode);
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedPaidPlan = PAID_PLANS.find((p) => p.id === selectedPlan) ?? null;
  const echoPrice = selectedPaidPlan ? priceForBilling(selectedPaidPlan, billing) : null;
  const step1CtaLabel = selectedPlan === "trial" ? plansCopy.ctaTrialLabel : plansCopy.ctaPaidLabel;
  const step2CtaLabel = selectedPlan ? profileCopy.submitLabel : profileCopy.submitDisabledLabel;

  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-hidden bg-background">
      <style>{`
        @keyframes blobdivide-breathe {
          0%, 100% { transform: scale(1) translateX(0); }
          50% { transform: scale(1.035) translateX(-1%); }
        }
        @keyframes blobdivide-morph {
          0% { clip-path: ${BLOB_CLIP_PATH}; }
          45% { clip-path: ${BLOB_CLIP_PATH_WOBBLE}; }
          100% { clip-path: ${BLOB_CLIP_PATH}; }
        }
        @keyframes blobdivide-pin-in {
          0% { opacity: 0; transform: translateY(14px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes blobdivide-float-a {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes blobdivide-float-b {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes blobdivide-float-c {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-11px); }
        }
        @keyframes blobdivide-content-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobdivide-scribble-pop {
          0% { transform: scale(0.85) rotate(-6deg); opacity: 0.6; }
          60% { transform: scale(1.12) rotate(-2deg); opacity: 1; }
          100% { transform: scale(1) rotate(-4deg); opacity: 1; }
        }
        .blobdivide-shape {
          animation: blobdivide-breathe 7s ease-in-out infinite;
        }
        .blobdivide-shape.blobdivide-wobble {
          animation-name: blobdivide-breathe, blobdivide-morph;
          animation-duration: 7s, 0.9s;
          animation-timing-function: ease-in-out, cubic-bezier(0.16, 1, 0.3, 1);
          animation-iteration-count: infinite, 1;
        }
        .blobdivide-pin {
          opacity: 0;
          animation: blobdivide-pin-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .blobdivide-pin-float-a { animation-name: blobdivide-pin-in, blobdivide-float-a; }
        .blobdivide-pin-float-b { animation-name: blobdivide-pin-in, blobdivide-float-b; }
        .blobdivide-pin-float-c { animation-name: blobdivide-pin-in, blobdivide-float-c; }
        .blobdivide-content-in {
          animation: blobdivide-content-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .blobdivide-scribble-annual {
          animation: blobdivide-scribble-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Illustration side — the blob is now a window into the real product */}
      <div className="relative hidden w-[56%] shrink-0 overflow-hidden lg:block">
        <div key={wobbleKey} className="absolute inset-0">
          {/* Lime rim tracing the blob boundary */}
          <div
            className="blobdivide-shape blobdivide-wobble absolute -inset-x-12 -inset-y-12 bg-primary/90"
            style={{ clipPath: BLOB_CLIP_PATH }}
          />

          {/* Deep green-noir gradient fill */}
          <div
            className="blobdivide-shape blobdivide-wobble absolute -inset-x-10 -inset-y-10 bg-[radial-gradient(circle_at_26%_16%,#214a37_0%,#0c2318_40%,#050f0a_74%,#020705_100%)]"
            style={{ clipPath: BLOB_CLIP_PATH }}
          />

          {/* The product mockup, clipped to the same blob — the "window" */}
          <img
            src={heroMockup}
            alt=""
            aria-hidden="true"
            className="blobdivide-shape blobdivide-wobble absolute -inset-x-10 -inset-y-10 object-cover opacity-80"
            style={{ clipPath: BLOB_CLIP_PATH }}
          />

          {/* Noir grade over the mockup — heavy in the top-left headline zone,
              falling off toward the pin-anchored feature regions so those stay
              readable. Without this the white laptop screen sits directly
              under the white headline text (verified illegible in review). */}
          <div
            className="blobdivide-shape blobdivide-wobble absolute -inset-x-10 -inset-y-10"
            style={{
              clipPath: BLOB_CLIP_PATH,
              background:
                "linear-gradient(135deg, rgba(2,7,5,0.94) 0%, rgba(2,7,5,0.72) 26%, rgba(2,7,5,0.35) 45%, rgba(2,7,5,0.12) 62%, transparent 78%)",
            }}
          />

          {/* Fine grain texture for richness */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "3px 3px",
            }}
          />

          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)]" />

          {/* Legibility scrims for the headline (top) and footer (bottom) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#020705] via-[#020705]/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020705]/85 to-transparent" />
        </div>

        <div className="relative z-10 flex h-full flex-col p-12 text-white">
          <img src={heroLogo} alt="FabAds" className="h-6 w-auto" />

          {/* Headline block — pinned to the top zone, well clear of the pin band below */}
          <div className="mt-10 max-w-xs">
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.01em]">
              Every campaign, one calm surface.
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Launch, monitor, and optimize across every platform without
              leaving the room.
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3">
            <span className="text-xs text-white/50">
              © {new Date().getFullYear()} FabAds — a product moment.
            </span>

            {/* Live plan echo — reacts to the plan/billing state picked on the form side */}
            {view === "signup" && (
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-lg backdrop-blur-md transition-all">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
                <span className="whitespace-nowrap text-xs font-medium text-white">
                  {selectedPlan === "trial"
                    ? TRIAL_PLAN.name
                    : selectedPaidPlan
                      ? `${selectedPaidPlan.name} — $${echoPrice}/mo`
                      : "Choose a plan"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Annotated callout pins — re-anchored to chart / launch-summary / stats regions */}
        {PINS.map((pin, idx) => {
          const floatClass =
            idx === 0
              ? "blobdivide-pin-float-a"
              : idx === 1
                ? "blobdivide-pin-float-b"
                : "blobdivide-pin-float-c";
          return (
            <div
              key={pin.id}
              className={`blobdivide-pin ${floatClass} group absolute z-20`}
              style={{
                top: pin.top,
                left: pin.left,
                animationDelay: `${pin.delayMs}ms, ${pin.delayMs + pin.floatDelayMs}ms`,
                animationDuration: "0.7s, 5.5s",
                animationIterationCount: "1, infinite",
                animationTimingFunction:
                  "cubic-bezier(0.16, 1, 0.3, 1), ease-in-out",
              }}
            >
              {/* connector line */}
              <div
                className="absolute right-full top-1/2 h-px bg-white/30 transition-colors group-hover:bg-primary"
                style={{
                  width: pin.lineWidth,
                  transform: `rotate(${pin.lineRotate})`,
                  transformOrigin: "right center",
                }}
              />
              <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-xl backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <pin.Icon className="h-3 w-3 text-primary-text" />
                <span className="text-xs font-medium text-white">{pin.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div
          key={`${view}-${step}`}
          className={cn(
            "blobdivide-content-in w-full",
            view === "signup" && step === 1 ? "max-w-md" : "max-w-sm",
          )}
        >
          {view === "login" ? (
            <>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-[-0.01em] text-foreground">
                <span>{copy.heading}</span>
                <span aria-hidden="true">{copy.headingEmoji}</span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{copy.subheading}</p>

              <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <FieldLabel htmlFor="blobdivide-email">{copy.emailLabel}</FieldLabel>
                  <input
                    id="blobdivide-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className={pillInput}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="blobdivide-password">{copy.passwordLabel}</FieldLabel>
                  <div className="relative">
                    <input
                      id="blobdivide-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={copy.passwordPlaceholder}
                      className={cn(pillInput, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary-text/40"
                    />
                    {copy.rememberLabel}
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-sm font-medium text-primary-text hover:underline"
                  >
                    {copy.forgotLabel}
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                >
                  {copy.submitLabel}
                </button>

                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {copy.dividerLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted active:scale-[0.98]"
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
                    goToSignup();
                  }}
                  className="font-medium text-primary-text hover:underline"
                >
                  {copy.signupLinkLabel}
                </a>
              </p>
            </>
          ) : step === 1 ? (
            <>
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {plansCopy.heading}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{plansCopy.subheading}</p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {plansCopy.stepOneLabel}
                </span>
                <div className="relative">
                  <div className="flex items-center gap-0.5 rounded-full bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setBilling("monthly")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition",
                        billing === "monthly"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {plansCopy.monthlyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBilling("annual")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition",
                        billing === "annual"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {plansCopy.annualLabel}
                    </button>
                  </div>
                  <img
                    key={billing}
                    src={save20Scribble}
                    alt={ANNUAL_SAVINGS_LABEL}
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute -right-14 -top-7 h-11 w-16 select-none",
                      billing === "annual" && "blobdivide-scribble-annual",
                    )}
                  />
                </div>
              </div>

              <div role="radiogroup" aria-label="Plan" className="mt-4 flex flex-col gap-2.5">
                <TrialOptionRow
                  selected={selectedPlan === "trial"}
                  onSelect={() => selectPlan("trial")}
                />
                {PAID_PLANS.map((plan) => (
                  <PlanOptionRow
                    key={plan.id}
                    plan={plan}
                    billing={billing}
                    selected={selectedPlan === plan.id}
                    expanded={expandedPlan === plan.id}
                    onSelect={() => selectPlan(plan.id)}
                    onToggleExpand={() =>
                      setExpandedPlan((cur) => (cur === plan.id ? null : plan.id))
                    }
                  />
                ))}
              </div>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="mt-3 block text-right text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {plansCopy.planDetailsLabel}
              </a>

              <button
                type="button"
                onClick={() => goToStep(2)}
                disabled={!selectedPlan}
                className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {step1CtaLabel}
              </button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {plansCopy.loginPromptLabel}{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-medium text-primary-text hover:underline"
                >
                  {plansCopy.loginLinkLabel}
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {profileCopy.heading}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{profileCopy.subheading}</p>

              <div className="mt-6 flex items-center gap-0.5 rounded-full bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setProfileMode("individual")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    profileMode === "individual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {profileCopy.individualTabLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileMode("agency")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    profileMode === "agency"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {profileCopy.agencyTabLabel}
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
                {profileMode === "individual" ? (
                  <>
                    <div>
                      <FieldLabel htmlFor="blobdivide-fullname">{profileCopy.fullNameLabel}</FieldLabel>
                      <input
                        id="blobdivide-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={profileCopy.fullNamePlaceholder}
                        className={pillInput}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="blobdivide-signup-email">{profileCopy.emailLabel}</FieldLabel>
                      <input
                        id="blobdivide-signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder={profileCopy.emailPlaceholder}
                        className={pillInput}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <FieldLabel htmlFor="blobdivide-agency-name">
                        {profileCopy.agencyNameLabel}
                      </FieldLabel>
                      <input
                        id="blobdivide-agency-name"
                        type="text"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder={profileCopy.agencyNamePlaceholder}
                        className={pillInput}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="blobdivide-admin-email">
                        {profileCopy.adminEmailLabel}
                      </FieldLabel>
                      <input
                        id="blobdivide-admin-email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder={profileCopy.adminEmailPlaceholder}
                        className={pillInput}
                      />
                    </div>
                  </>
                )}

                <div>
                  <FieldLabel htmlFor="blobdivide-phone">{profileCopy.phoneLabel}</FieldLabel>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      aria-label="Country code"
                      className="w-[92px] shrink-0 rounded-[28px] border border-border bg-background px-2 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary-text focus:ring-2 focus:ring-primary-text/30"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id="blobdivide-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={profileCopy.phonePlaceholder}
                      className={cn(pillInput, "flex-1")}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="blobdivide-set-password">
                    {profileCopy.setPasswordLabel}
                  </FieldLabel>
                  <div className="relative">
                    <input
                      id="blobdivide-set-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder={profileCopy.passwordPlaceholder}
                      className={cn(pillInput, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{profileCopy.passwordHint}</p>
                </div>

                <div>
                  <FieldLabel htmlFor="blobdivide-confirm-password">
                    {profileCopy.confirmPasswordLabel}
                  </FieldLabel>
                  <div className="relative">
                    <input
                      id="blobdivide-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={profileCopy.passwordPlaceholder}
                      className={cn(pillInput, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                    className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted active:scale-[0.98]"
                  >
                    {profileCopy.backLabel}
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedPlan}
                    className="flex-[2] rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-secondary disabled:text-secondary-foreground"
                  >
                    {step2CtaLabel}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
