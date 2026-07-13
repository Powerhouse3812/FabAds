import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ChevronDown, ExternalLink } from "lucide-react";
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
  type PaidPlan,
  type SelectablePlanId,
} from "@/components/auth/signup/plans";

import fabadsLogoDark from "@/assets/fabads-logo-dark.svg";
import heroLogo from "@/assets/auth/hero-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";
import signupPlanLogo from "@/assets/auth/signup-plan-logo.svg";
import save20Scribble from "@/assets/auth/signup-save20-scribble.svg";

/**
 * Concept 07 — Hand-drawn journey (GODMODE rework)
 *
 * The sketchbook page, restored. Round 1 stripped this down to gray doodles
 * and Geist-only type per a strict "one font" DS pass — the founder called
 * that "too generic, whitespace wasted, no illustrations." This pass brings
 * the handwriting back, gives the doodles ink/lime/coral color, fills every
 * page edge with a sketch element, and wires the FULL signup wizard
 * (?view=signup&step=1|2) with the same journal treatment: wobbly plan
 * boxes, a marker-scribble selection border, a circled price, and a taped-in
 * product photo like something glued into a notebook.
 *
 * Content is pulled verbatim from formSpec.ts + signup/plans.ts — only the
 * decorative sketchbook captions ("no credit card!", "most people start
 * here", "you're here →") are invented annotations, same license the
 * original round used for "ready to launch?".
 */

const DOODLE_STROKE = 480;

const INK = "text-foreground/75";
const LIME = "text-primary";
const CORAL = "text-[#ef6a52]";

function draw(delayMs: number, durationS = 1.1) {
  return {
    strokeDasharray: DOODLE_STROKE,
    strokeDashoffset: DOODLE_STROKE,
    animation: `doodle-draw ${durationS}s ease-out ${delayMs}ms forwards`,
  };
}

/* ---------------------------------------------------------------- doodles */

function ArrowDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 160 90" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 78 C 34 66, 46 40, 78 34 C 104 29, 118 22, 122 14" style={draw(delayMs, 1.3)} />
      <path d="M104 10 C 111 12, 118 13, 124 15 C 121 21, 119 27, 118 33" style={draw(delayMs + 900, 0.5)} />
    </svg>
  );
}

function ChartDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 140 90" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 82 L 6 10" style={draw(delayMs, 0.4)} />
      <path d="M4 83 L 132 83" style={draw(delayMs + 150, 0.5)} />
      <path d="M14 68 C 32 70, 40 58, 52 60 C 66 62, 70 44, 84 38 C 98 32, 104 18, 122 12" style={draw(delayMs + 350, 1.2)} />
      <path d="M112 8 L 122 12 L 116 22" style={draw(delayMs + 1450, 0.35)} />
    </svg>
  );
}

function TargetDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 8 C 74 6, 92 24, 91 49 C 90 74, 71 92, 48 91 C 25 90, 8 71, 9 48 C 10 26, 27 9, 50 8" style={draw(delayMs, 1.1)} />
      <path d="M50 26 C 64 25, 74 35, 73 49 C 72 63, 61 73, 48 72 C 35 71, 26 60, 27 48 C 28 36, 37 27, 50 26" style={draw(delayMs + 250, 0.9)} />
      <path d="M50 42 C 56 42, 60 46, 59 51 C 58 56, 54 59, 49 58 C 44 57, 41 53, 42 48 C 43 44, 46 42, 50 42" style={draw(delayMs + 450, 0.6)} />
    </svg>
  );
}

function SparkleDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 70 70" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M35 4 C 33 20, 32 30, 35 34 C 38 30, 39 20, 35 4" style={draw(delayMs, 0.5)} />
      <path d="M35 66 C 37 50, 38 40, 35 36 C 32 40, 31 50, 35 66" style={draw(delayMs + 120, 0.5)} />
      <path d="M4 35 C 20 33, 30 32, 34 35 C 30 38, 20 39, 4 35" style={draw(delayMs + 240, 0.5)} />
      <path d="M66 35 C 50 37, 40 38, 36 35 C 40 32, 50 31, 66 35" style={draw(delayMs + 360, 0.5)} />
    </svg>
  );
}

function RocketDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 90 130" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M45 6 C 60 20, 66 46, 63 78 L 27 78 C 24 46, 30 20, 45 6 Z" style={draw(delayMs, 1.1)} />
      <path d="M27 66 C 12 70, 8 84, 6 100 C 18 92, 26 88, 30 80" style={draw(delayMs + 500, 0.7)} />
      <path d="M63 66 C 78 70, 82 84, 84 100 C 72 92, 64 88, 60 80" style={draw(delayMs + 650, 0.7)} />
      <path d="M32 78 L 30 100 L 45 92 L 60 100 L 58 78" style={draw(delayMs + 900, 0.6)} />
      <circle cx="45" cy="38" r="8" style={draw(delayMs + 300, 0.4)} />
      <path d="M20 116 C 26 112, 34 118, 40 114" style={draw(delayMs + 1350, 0.35)} />
      <path d="M50 122 C 56 118, 62 124, 68 120" style={draw(delayMs + 1450, 0.35)} />
    </svg>
  );
}

function GrowthArrowDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 180 110" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 100 L 6 8" style={draw(delayMs, 0.4)} />
      <path d="M4 101 L 168 101" style={draw(delayMs + 120, 0.5)} />
      <path d="M14 84 C 30 88, 34 66, 46 70 C 58 74, 62 50, 76 46 C 92 42, 96 20, 118 12 C 132 7, 144 10, 158 4" style={draw(delayMs + 300, 1.3)} />
      <path d="M144 2 L 160 4 L 152 18" style={draw(delayMs + 1650, 0.35)} />
    </svg>
  );
}

function CoffeeRingDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      style={{ opacity: 0, animation: `doodle-fade 1s ease-out ${delayMs}ms forwards` }}
    >
      <path d="M60 6 C 92 6, 112 30, 112 60 C 112 92, 90 114, 59 113 C 28 112, 7 90, 8 59 C 9 29, 30 7, 60 6 Z" opacity={0.55} />
      <path d="M60 16 C 86 15, 101 34, 101 59 C 101 85, 83 103, 59 102 C 36 101, 18 84, 19 59 C 20 35, 35 17, 60 16 Z" opacity={0.35} />
    </svg>
  );
}

function NotebookMargin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 800" className={className} preserveAspectRatio="none" fill="none">
      <line x1="10" y1="0" x2="10" y2="800" stroke="currentColor" strokeWidth={1.5} opacity={0.25} />
      {[80, 220, 360, 500, 640].map((y) => (
        <circle key={y} cx="10" cy={y} r="4" stroke="currentColor" strokeWidth={1.5} opacity={0.3} fill="none" />
      ))}
    </svg>
  );
}

function MarkerArrowDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 90 60" className={className} fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8 C 30 4, 54 20, 78 42" style={draw(delayMs, 0.6)} />
      <path d="M60 44 L 80 44 L 74 26" style={draw(delayMs + 550, 0.35)} />
    </svg>
  );
}

function EllipseScribble({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 140 60" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M18 30 C 16 10, 46 3, 72 4 C 104 5, 132 14, 128 32 C 124 50, 92 57, 64 56 C 34 55, 20 46, 18 30 Z" style={draw(delayMs, 1)} />
      <path d="M18 30 C 15 42, 44 51, 70 50" style={draw(delayMs + 1000, 0.4)} />
    </svg>
  );
}

function UnderlineScribble({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg viewBox="0 0 110 16" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M2 9 C 24 2, 46 13, 68 6 C 84 1, 96 10, 108 6" style={draw(delayMs, 0.6)} />
    </svg>
  );
}

/* ------------------------------------------------------------- micro-ui */

function HandCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border-2 border-foreground/60 bg-card">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute inset-0 h-full w-full text-primary-text" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M4 10.5 L8.2 14.7 L16 5.3"
            style={{
              strokeDasharray: 26,
              strokeDashoffset: checked ? 0 : 26,
              transition: "stroke-dashoffset 280ms ease-out",
            }}
          />
        </svg>
      </span>
      {label}
    </label>
  );
}

function StampButton({
  className,
  children,
  onClick,
  type = "submit",
  disabled,
}: {
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  const [tick, setTick] = useState(0);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={() => {
        setTick((t) => t + 1);
        onClick?.();
      }}
      className={className}
    >
      <span key={tick} className={tick > 0 ? "inline-flex animate-[stamp-press_320ms_ease-out]" : "inline-flex"}>
        {children}
      </span>
    </button>
  );
}

function useWiggle(id: string) {
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);
  // Key is namespaced per hook instance — multiple wiggle-wrapped doodles
  // render as siblings, and a bare `key={tick}` would collide at 0.
  const wrap = (node: React.ReactNode) => (
    <span key={`${id}-${tick}`} className={tick > 0 ? "inline-block animate-[doodle-wiggle_450ms_ease-in-out]" : "inline-block"}>
      {node}
    </span>
  );
  return { bump, wrap };
}

/** Taped-in photo — the product mockup pasted into the journal like a
 *  Polaroid, crooked frame + two tape strips. */
function TapedPhoto({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative -rotate-2">
        <span className="absolute -left-3 -top-3 z-20 h-6 w-14 -rotate-[24deg] bg-[#ef6a52]/30" />
        <span className="absolute -right-2 -top-2 z-20 h-6 w-12 rotate-[18deg] bg-primary/30" />
        <div className="relative rounded-[4px] bg-card p-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full text-foreground/70" fill="none" stroke="currentColor" strokeWidth={1.4} vectorEffect="non-scaling-stroke">
            <path d="M3 2 C 1 1 0 4 1 8 L 1 92 C 0 97 4 99 8 99 L 92 98 C 97 99 99 95 99 91 L 99 9 C 100 4 96 1 91 2 L 9 1 C 6 1 4 1 3 2 Z" />
          </svg>
          <img src={heroMockup} alt="Fabfunnel product preview" className="h-28 w-40 rounded-[2px] object-cover sm:h-36 sm:w-52" />
          <div className="mt-1.5 flex items-center justify-center gap-1.5 opacity-80">
            <img src={heroLogo} alt="" className="h-3 w-auto" />
            <span className="font-caveat text-sm text-foreground/70">the product ✂</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- plan box */

const WOBBLE_RADIUS: Record<string, string> = {
  trial: "20px 9px 18px 12px",
  starter: "12px 20px 9px 18px",
  growth: "18px 12px 20px 9px",
  pro: "9px 18px 12px 20px",
};
const WOBBLE_ROTATE: Record<string, string> = {
  trial: "-0.35deg",
  starter: "0.5deg",
  growth: "-0.3deg",
  pro: "0.4deg",
};

function ScribbleSelectedBorder() {
  return (
    <svg
      className="pointer-events-none absolute -inset-1.5 h-[calc(100%+12px)] w-[calc(100%+12px)] text-primary"
      viewBox="0 0 300 90"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        d="M10,4 C4,2 2,10 3,18 L2,72 C1,82 6,88 14,87 L286,89 C295,90 298,82 297,72 L298,16 C299,8 293,2 284,3 L16,2 C13,2 11,3 10,4 Z"
        stroke="currentColor"
        strokeWidth={3.5}
        vectorEffect="non-scaling-stroke"
        style={draw(0, 0.7)}
      />
    </svg>
  );
}

function TrialBox({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      style={{ borderRadius: WOBBLE_RADIUS.trial, transform: `rotate(${WOBBLE_ROTATE.trial})` }}
      className={`fab-focus relative flex w-full cursor-pointer items-center justify-between gap-2 border-2 px-4 py-3 transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-foreground/50 bg-card"
      }`}
    >
      {selected && <ScribbleSelectedBorder />}
      <div className="flex items-center gap-2">
        <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${selected ? "border-primary bg-primary" : "border-foreground/50"}`} />
        <span className="text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
      </div>
      <span className="whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
        {TRIAL_PLAN.chip}
      </span>
    </div>
  );
}

function PlanBox({
  plan,
  billing,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
}: {
  plan: PaidPlan;
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
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      style={{ borderRadius: WOBBLE_RADIUS[plan.id], transform: `rotate(${WOBBLE_ROTATE[plan.id]})` }}
      className={`fab-focus relative w-full cursor-pointer border-2 px-4 py-3 transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-foreground/50 bg-card"
      }`}
    >
      {selected && <ScribbleSelectedBorder />}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${selected ? "border-primary bg-primary" : "border-foreground/50"}`} />
        <span className="relative whitespace-nowrap text-sm font-semibold text-foreground">
          {plan.name} -{" "}
          {isDiscounted && <span className="text-muted-foreground line-through">${plan.monthlyPrice}</span>}{" "}
          <span className="relative">
            ${price}
            {plan.id === "starter" && (
              <EllipseScribble className={`pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+24px)] ${CORAL}`} delayMs={1400} />
            )}
          </span>
          {billing === "annual" && <span className="font-normal text-muted-foreground"> / month</span>}
        </span>

        <div className="ml-auto flex items-center gap-2">
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
            className="fab-focus rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {plan.id === "starter" && (
        <span className="font-caveat pointer-events-none absolute -right-2 top-[70%] hidden w-28 -rotate-3 text-base leading-tight text-[#ef6a52] sm:block lg:-right-32 lg:top-1/2">
          most people start here ↖
        </span>
      )}

      <p className="mt-1 pl-6 text-xs text-muted-foreground">{plan.subtitle}</p>

      {expanded && plan.features && (
        <div className="mt-3 grid grid-cols-1 gap-y-1 pl-6 sm:grid-cols-2">
          {plan.features.map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-foreground">
              <span className="text-foreground/60">✓</span>
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- stepper */

function JournalStepper({ current }: { current: 1 | 2 }) {
  return (
    <div className="relative flex items-center gap-3">
      {([1, 2] as const).map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          <div className="relative flex flex-col items-center gap-1">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${
                n === current ? "border-primary bg-primary text-primary-foreground" : "border-foreground/40 text-foreground/60"
              }`}
            >
              {n}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {n === 1 ? plansCopy.stepOneLabel : plansCopy.stepTwoLabel}
            </span>
            {n === current && (
              <span className="font-caveat pointer-events-none absolute -right-16 -top-2 hidden whitespace-nowrap text-base text-[#ef6a52] sm:block">
                you're here →
              </span>
            )}
          </div>
          {i === 0 && <span className="mb-4 h-0 w-8 border-t-2 border-dashed border-foreground/30" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function Concept07HandDrawnJourney() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "signup" ? "signup" : "login";
  const step = view === "signup" && searchParams.get("step") === "2" ? 2 : 1;

  const goToLogin = () => setSearchParams({});
  const goToSignup = () => setSearchParams({ view: "signup" });
  const goToStep1 = () => setSearchParams({ view: "signup", step: "1" });
  const goToStep2 = () => setSearchParams({ view: "signup", step: "2" });

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // signup — step 1
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>("starter");

  // signup — step 2
  const [profileMode, setProfileMode] = useState<"individual" | "agency">("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const arrowWiggle = useWiggle("arrow");
  const targetWiggle = useWiggle("target");
  const chartWiggle = useWiggle("chart");
  const rocketWiggle = useWiggle("rocket");

  const selectPlan = (id: SelectablePlanId) => {
    setSelectedPlan(id);
    setExpandedPlan(id);
  };

  const step1Cta = selectedPlan === "trial" ? plansCopy.ctaTrialLabel : plansCopy.ctaPaidLabel;
  const hasPlan = Boolean(selectedPlan);
  const step2Cta = hasPlan ? profileCopy.submitLabel : profileCopy.submitDisabledLabel;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-background px-6 py-14 lg:px-16">
      {/* Scoped script font — the handwriting accent this concept is built
          around. Re-imported per the "DS leash relaxed" allowance. */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap" />
      <style>{`
        .font-caveat { font-family: "Caveat", cursive; }

        @keyframes doodle-draw { to { stroke-dashoffset: 0; } }
        @keyframes doodle-fade { to { opacity: 1; } }
        @keyframes form-settle {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes stamp-press {
          0% { transform: scale(1) rotate(0deg); }
          40% { transform: scale(0.92) rotate(-2deg); }
          70% { transform: scale(1.05) rotate(1.5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes doodle-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .concept07-form-settle {
          animation: form-settle 0.4s ease-out 550ms forwards;
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .concept07-form-settle { animation: none; opacity: 1; }
          svg [style*="doodle-draw"], svg [style*="doodle-fade"] { animation: none !important; stroke-dashoffset: 0 !important; opacity: 1 !important; }
        }
      `}</style>

      {/* brand sticker, top-left corner of the page */}
      <img
        src={fabadsLogoDark}
        alt="FabAds"
        className="pointer-events-none absolute left-6 top-6 z-20 h-5 w-auto opacity-70 dark:invert lg:left-10 lg:top-8"
      />

      {/* notebook rule down the left margin — present in every view */}
      <NotebookMargin className={`pointer-events-none absolute inset-y-0 left-[3.5%] hidden h-full w-3 lg:block ${INK}`} />

      {/* coffee ring — a permanent stain on the page, every view */}
      <CoffeeRingDoodle delayMs={200} className={`pointer-events-none absolute bottom-[6%] right-[5%] hidden h-24 w-24 text-[#c9a26a] lg:block`} />

      {view === "login" && (
        <>
          {arrowWiggle.wrap(
            <ArrowDoodle
              className={`pointer-events-none absolute left-[8%] top-[16%] hidden h-24 w-40 -rotate-6 ${INK} sm:block md:left-[12%]`}
              delayMs={0}
            />,
          )}
          <div className="pointer-events-none absolute left-[8%] top-[7%] hidden -rotate-2 sm:block md:left-[13%]">
            <span className="font-caveat text-2xl text-foreground/80">ready to launch?</span>
          </div>

          {chartWiggle.wrap(
            <ChartDoodle className={`pointer-events-none absolute bottom-[16%] left-[9%] hidden h-20 w-32 rotate-3 ${LIME} md:block`} delayMs={280} />,
          )}

          {targetWiggle.wrap(
            <TargetDoodle className={`pointer-events-none absolute right-[10%] top-[18%] hidden h-20 w-20 rotate-2 ${INK} sm:block md:right-[14%]`} delayMs={560} />,
          )}

          <SparkleDoodle className={`pointer-events-none absolute bottom-[26%] right-[13%] hidden h-14 w-14 ${CORAL} sm:block md:right-[17%]`} delayMs={840} />

          {rocketWiggle.wrap(
            <RocketDoodle className={`pointer-events-none absolute right-[6%] bottom-[4%] hidden h-28 w-20 rotate-6 ${CORAL} xl:block`} delayMs={950} />,
          )}

          <TapedPhoto className="pointer-events-none absolute left-[7%] bottom-[8%] hidden xl:block" />
        </>
      )}

      {view === "signup" && step === 1 && (
        <>
          <MarkerArrowDoodle
            className={`pointer-events-none absolute left-[3%] top-[30%] hidden h-14 w-20 -rotate-90 ${CORAL} lg:left-[7%] xl:block`}
            delayMs={700}
          />
          <span className="font-caveat pointer-events-none absolute left-[3%] top-[24%] hidden w-28 -rotate-3 text-lg text-[#ef6a52] lg:left-[6%] xl:block">
            no credit card!
          </span>

          <GrowthArrowDoodle className={`pointer-events-none absolute right-[4%] top-[10%] hidden h-24 w-36 rotate-2 ${LIME} xl:block`} delayMs={200} />
          <RocketDoodle className={`pointer-events-none absolute right-[5%] bottom-[6%] hidden h-24 w-16 rotate-6 ${INK} xl:block`} delayMs={500} />
        </>
      )}

      {view === "signup" && step === 2 && (
        <>
          {chartWiggle.wrap(
            <ChartDoodle className={`pointer-events-none absolute left-[4%] top-[20%] hidden h-20 w-32 -rotate-3 ${LIME} lg:block`} delayMs={200} />,
          )}
          {rocketWiggle.wrap(
            <RocketDoodle className={`pointer-events-none absolute right-[5%] top-[14%] hidden h-24 w-16 rotate-6 ${CORAL} lg:block`} delayMs={450} />,
          )}
          <SparkleDoodle className={`pointer-events-none absolute right-[6%] bottom-[10%] hidden h-14 w-14 ${INK} lg:block`} delayMs={700} />
        </>
      )}

      {/* ---------------------------------------------------------- form */}
      <div className={`concept07-form-settle relative z-10 mx-auto w-full ${view === "login" ? "max-w-sm" : "max-w-md"}`}>
        {view === "login" && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                {copy.headingEmoji} {copy.heading}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{copy.subheading}</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label htmlFor="concept07-email" className="text-sm font-medium text-foreground">
                  {copy.emailLabel}
                </label>
                <input
                  id="concept07-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={arrowWiggle.bump}
                  placeholder={copy.emailPlaceholder}
                  className="w-full rounded-[28px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="concept07-password" className="text-sm font-medium text-foreground">
                  {copy.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="concept07-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={targetWiggle.bump}
                    placeholder={copy.passwordPlaceholder}
                    className="w-full rounded-[28px] border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <HandCheckbox id="concept07-remember" checked={rememberMe} onChange={setRememberMe} label={copy.rememberLabel} />
                <a href="#" className="font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                  {copy.forgotLabel}
                </a>
              </div>

              <StampButton type="submit" className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                {copy.submitLabel}
              </StampButton>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {copy.dividerLabel}
                <span className="h-px flex-1 bg-border" />
              </div>

              <button type="button" className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-card/80">
                {copy.googleLabel}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                {copy.signupPromptLabel}{" "}
                <button type="button" onClick={goToSignup} className="font-medium text-foreground underline-offset-2 hover:underline">
                  {copy.signupLinkLabel}
                </button>
              </p>
            </form>
          </>
        )}

        {view === "signup" && step === 1 && (
          <div className="flex w-full flex-col items-center gap-6">
            <img src={signupPlanLogo} alt="FabAds" className="h-[26px] w-auto" />

            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-xl font-bold text-foreground">{plansCopy.heading}</h1>
              <p className="text-sm text-muted-foreground">{plansCopy.subheading}</p>
            </div>

            <JournalStepper current={1} />

            <div className="relative">
              <div className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-foreground/40 bg-card p-0.5">
                {(["monthly", "annual"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBilling(cycle)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      billing === cycle ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cycle === "monthly" ? plansCopy.monthlyLabel : plansCopy.annualLabel}
                  </button>
                ))}
              </div>
              <img src={save20Scribble} alt={ANNUAL_SAVINGS_LABEL} aria-hidden="true" className="pointer-events-none absolute -right-16 -top-6 h-12 w-20 select-none" />
              <UnderlineScribble className={`pointer-events-none absolute -bottom-2 right-[-4px] h-3 w-16 ${LIME}`} delayMs={300} />
            </div>

            <div role="radiogroup" aria-label="Plan" className="flex w-full flex-col gap-4 pt-1">
              <TrialBox selected={selectedPlan === "trial"} onSelect={() => selectPlan("trial")} />
              {PAID_PLANS.map((plan) => (
                <PlanBox
                  key={plan.id}
                  plan={plan}
                  billing={billing}
                  selected={selectedPlan === plan.id}
                  expanded={expandedPlan === plan.id}
                  onSelect={() => selectPlan(plan.id)}
                  onToggleExpand={() => setExpandedPlan((cur) => (cur === plan.id ? null : plan.id))}
                />
              ))}
            </div>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="fab-focus flex w-full items-center justify-end gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
            >
              {plansCopy.planDetailsLabel}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>

            <div className="flex w-full flex-col items-center gap-2">
              <StampButton
                type="button"
                disabled={!selectedPlan}
                onClick={goToStep2}
                className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {step1Cta}
              </StampButton>
              <p className="text-sm text-muted-foreground">
                {plansCopy.loginPromptLabel}{" "}
                <button type="button" onClick={goToLogin} className="fab-focus rounded-sm font-medium text-primary-text hover:underline">
                  {plansCopy.loginLinkLabel}
                </button>
              </p>
            </div>
          </div>
        )}

        {view === "signup" && step === 2 && (
          <div className="flex w-full flex-col items-center gap-6">
            <img src={signupPlanLogo} alt="FabAds" className="h-[26px] w-auto" />

            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-xl font-bold text-foreground">{profileCopy.heading}</h1>
              <p className="text-sm text-muted-foreground">{profileCopy.subheading}</p>
            </div>

            <JournalStepper current={2} />

            <div className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-foreground/40 bg-card p-0.5">
              {(["individual", "agency"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setProfileMode(mode)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    profileMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "individual" ? profileCopy.individualTabLabel : profileCopy.agencyTabLabel}
                </button>
              ))}
            </div>

            <div className="flex w-full flex-col gap-4">
              {profileMode === "individual" ? (
                <>
                  <Field label={profileCopy.fullNameLabel} htmlFor="concept07-fullname">
                    <input
                      id="concept07-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={chartWiggle.bump}
                      placeholder={profileCopy.fullNamePlaceholder}
                      className="w-full rounded-[16px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                    />
                  </Field>
                  <Field label={profileCopy.emailLabel} htmlFor="concept07-signup-email">
                    <input
                      id="concept07-signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder={profileCopy.emailPlaceholder}
                      className="w-full rounded-[16px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label={profileCopy.agencyNameLabel} htmlFor="concept07-agency-name">
                    <input
                      id="concept07-agency-name"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      onFocus={chartWiggle.bump}
                      placeholder={profileCopy.agencyNamePlaceholder}
                      className="w-full rounded-[16px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                    />
                  </Field>
                  <Field label={profileCopy.adminEmailLabel} htmlFor="concept07-admin-email">
                    <input
                      id="concept07-admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder={profileCopy.adminEmailPlaceholder}
                      className="w-full rounded-[16px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                    />
                  </Field>
                </>
              )}

              <Field label={profileCopy.phoneLabel} htmlFor="concept07-phone">
                <div className="flex gap-2">
                  <span className="flex w-16 shrink-0 items-center justify-center rounded-[16px] border border-border bg-muted text-sm text-foreground">
                    {profileCopy.phoneCode}
                  </span>
                  <input
                    id="concept07-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={rocketWiggle.bump}
                    placeholder={profileCopy.phonePlaceholder}
                    className="flex-1 rounded-[16px] border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>
              </Field>

              <div className="space-y-1.5">
                <label htmlFor="concept07-signup-password" className="text-sm font-medium text-foreground">
                  {profileCopy.setPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="concept07-signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onFocus={targetWiggle.bump}
                    placeholder={profileCopy.passwordPlaceholder}
                    className="w-full rounded-[16px] border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{profileCopy.passwordHint}</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="concept07-confirm-password" className="text-sm font-medium text-foreground">
                  {profileCopy.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="concept07-confirm-password"
                    type={showSignupConfirm ? "text" : "password"}
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder={profileCopy.passwordPlaceholder}
                    className="w-full rounded-[16px] border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                    aria-label={showSignupConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                onClick={goToStep1}
                className="h-10 flex-1 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition hover:bg-card/80"
              >
                {profileCopy.backLabel}
              </button>
              <StampButton
                type="button"
                disabled={!hasPlan}
                className="h-10 flex-[2] rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground disabled:opacity-100"
              >
                {step2Cta}
              </StampButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
