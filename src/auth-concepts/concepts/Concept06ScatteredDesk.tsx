import { useState, useRef, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  TrendingUp,
  Target,
  Play,
  Tag,
  BarChart3,
  Sparkles,
  Video,
  Wallet,
  Zap,
  Pin,
  Check,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import heroMockup from "@/assets/auth/hero-mockup.png";
import signupSave20Scribble from "@/assets/auth/signup-save20-scribble.svg";
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

const COPY = AUTH_CONCEPT_COPY;
const PLANS_COPY = SIGNUP_PLANS_COPY;
const PROFILE_COPY = SIGNUP_PROFILE_COPY;

/**
 * Concept 06 — "Scattered desk": cardless collage, godmode round.
 *
 * The form floats bare on a plain page; a dozen tilted "desk object" cards
 * sit scattered near the viewport edges — no longer icon+label chips, each
 * one is a small real visualization (sparkline, area chart, a torn photo).
 * Three layers of life stack on every object: an idle bob, page-level mouse
 * parallax, and a hover response that straightens the tilt, lifts the card,
 * and reveals one extra line of detail. On the signup Plan-selection step
 * the pricing cards themselves take the scattered treatment — tilted
 * polaroids the user can still select as radios.
 */

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** One extra line of detail that fades/collapses in on hover. */
function Reveal({
  show,
  children,
  className,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "overflow-hidden whitespace-nowrap text-[9px] font-medium text-muted-foreground transition-all duration-200 ease-out",
        show ? "mt-1 max-h-4 opacity-100" : "max-h-0 opacity-0",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Jagged "torn paper" silhouette for the desk-photo scatter object. */
const TORN_EDGE_CLIP =
  "polygon(2% 6%, 14% 0%, 29% 4%, 44% 0%, 59% 5%, 76% 1%, 91% 6%, 100% 16%, 95% 32%, 100% 48%, 93% 64%, 100% 79%, 89% 91%, 74% 100%, 58% 94%, 43% 100%, 27% 96%, 12% 100%, 4% 87%, 8% 68%, 1% 52%, 6% 35%, 0% 20%)";

type Chrome = "card" | "pill" | "photo";

interface ScatterObject {
  id: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number; // degrees at rest
  size: string; // tailwind width class
  bobDuration: string;
  bobDelay: string;
  bobAmplitude: number; // px
  parallaxStrength: number; // px of travel at max mouse offset
  chrome: Chrome;
  content: (hovered: boolean) => ReactNode;
}

const SCATTER_OBJECTS: ScatterObject[] = [
  {
    id: "ctr",
    top: "8%",
    left: "6%",
    rotate: -9,
    size: "w-[144px]",
    bobDuration: "5.2s",
    bobDelay: "0s",
    bobAmplitude: 8,
    parallaxStrength: 10,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5 text-primary-text">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            CTR
          </span>
        </div>
        <p className="text-sm font-bold text-success-text">+12.4%</p>
        <svg viewBox="0 0 60 22" className="h-5 w-[60px] text-primary" fill="none" aria-hidden="true">
          <polyline
            points="0,18 10,15 20,16 30,10 40,12 50,5 58,7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="58" cy="7" r="2.5" fill="currentColor" />
        </svg>
        <Reveal show={hovered}>vs last month</Reveal>
      </div>
    ),
  },
  {
    id: "badge-percent",
    top: "14%",
    right: "8%",
    rotate: 7,
    size: "w-[112px]",
    bobDuration: "6.1s",
    bobDelay: "0.6s",
    bobAmplitude: 7,
    parallaxStrength: 16,
    chrome: "pill",
    content: (hovered) => (
      <div className="flex flex-col items-center justify-center gap-0.5 p-4">
        <span className="text-lg font-bold text-primary-foreground">98%</span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-primary-foreground/80">
          Match rate
        </span>
        <Reveal show={hovered} className="text-primary-foreground/75">
          vs 92% avg
        </Reveal>
      </div>
    ),
  },
  {
    id: "campaign-live",
    bottom: "10%",
    left: "5%",
    rotate: 5,
    size: "w-[152px]",
    bobDuration: "4.6s",
    bobDelay: "1.1s",
    bobAmplitude: 9,
    parallaxStrength: 6,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Tag className="h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground">Campaign live</span>
        </div>
        <Reveal show={hovered}>Started 2h ago</Reveal>
      </div>
    ),
  },
  {
    id: "video-play",
    bottom: "16%",
    right: "6%",
    rotate: -6,
    size: "w-[120px]",
    bobDuration: "5.8s",
    bobDelay: "0.3s",
    bobAmplitude: 6,
    parallaxStrength: 14,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col items-center gap-1.5 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
          <Play className="h-4 w-4 fill-primary-foreground text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">Video ad</span>
        <Reveal show={hovered}>0:15 preview</Reveal>
      </div>
    ),
  },
  {
    id: "target",
    top: "42%",
    left: "3%",
    rotate: -11,
    size: "w-[112px]",
    bobDuration: "7s",
    bobDelay: "1.6s",
    bobAmplitude: 10,
    parallaxStrength: 8,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col items-center gap-1 p-3">
        <Target className="h-6 w-6 text-primary-text" aria-hidden="true" />
        <span className="text-[10px] font-medium text-muted-foreground">Audience hit</span>
        <Reveal show={hovered}>92% of goal</Reveal>
      </div>
    ),
  },
  {
    id: "reach",
    top: "48%",
    right: "4%",
    rotate: 10,
    size: "w-[132px]",
    bobDuration: "4.9s",
    bobDelay: "0.9s",
    bobAmplitude: 8,
    parallaxStrength: 12,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-primary-text">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Reach
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">2.1M</p>
        <svg viewBox="0 0 64 22" className="h-5 w-16" aria-hidden="true">
          <path
            d="M0,18 L10,14 L20,16 L30,8 L40,10 L52,4 L64,6 L64,22 L0,22 Z"
            fill="currentColor"
            className="text-primary/15"
          />
          <path
            d="M0,18 L10,14 L20,16 L30,8 L40,10 L52,4 L64,6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />
        </svg>
        <Reveal show={hovered}>+8% this week</Reveal>
      </div>
    ),
  },
  {
    id: "ai-suggest",
    bottom: "3%",
    left: "34%",
    rotate: -4,
    size: "w-[152px]",
    bobDuration: "6.5s",
    bobDelay: "2s",
    bobAmplitude: 7,
    parallaxStrength: 18,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">Genie found a hook</span>
        </div>
        <div className="flex items-center gap-1 pl-0.5" aria-hidden="true">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: "0s" }} />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
        </div>
        <Reveal show={hovered}>"Stop scrolling, start scaling"</Reveal>
      </div>
    ),
  },
  {
    id: "creative-slot",
    top: "3%",
    left: "58%",
    rotate: 8,
    size: "w-[104px]",
    bobDuration: "5.4s",
    bobDelay: "1.3s",
    bobAmplitude: 6,
    parallaxStrength: 20,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col items-center gap-1 p-2.5">
        <Video className="h-5 w-5 text-primary-text" aria-hidden="true" />
        <span className="text-[9px] font-medium text-muted-foreground">3 new assets</span>
        <Reveal show={hovered}>Ready to launch</Reveal>
      </div>
    ),
  },
  {
    id: "budget",
    top: "24%",
    left: "22%",
    rotate: 6,
    size: "w-[164px]",
    bobDuration: "5.6s",
    bobDelay: "0.8s",
    bobAmplitude: 7,
    parallaxStrength: 9,
    chrome: "card",
    content: (hovered) => (
      <div className="flex items-center gap-2 p-3">
        <Wallet className="h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">$2.4k spent today</span>
          <Reveal show={hovered}>22% under budget</Reveal>
        </div>
      </div>
    ),
  },
  {
    id: "impressions",
    top: "66%",
    left: "14%",
    rotate: -7,
    size: "w-[128px]",
    bobDuration: "6.8s",
    bobDelay: "1.9s",
    bobAmplitude: 8,
    parallaxStrength: 11,
    chrome: "card",
    content: (hovered) => (
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-primary-text">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Impressions
          </span>
        </div>
        <p className="text-sm font-bold text-foreground">148K</p>
        <Reveal show={hovered}>+18% week over week</Reveal>
      </div>
    ),
  },
  {
    id: "photo",
    top: "62%",
    right: "14%",
    rotate: -3,
    size: "w-[150px]",
    bobDuration: "5.9s",
    bobDelay: "1.4s",
    bobAmplitude: 6,
    parallaxStrength: 13,
    chrome: "photo",
    content: (hovered) => (
      <div className="relative">
        <Pin
          className="absolute -top-2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 -rotate-45 text-error-text drop-shadow-sm"
          aria-hidden="true"
        />
        <img
          src={heroMockup}
          alt=""
          className="h-[104px] w-[150px] object-cover shadow-[0_10px_24px_rgba(15,23,42,0.2)]"
          style={{ clipPath: TORN_EDGE_CLIP }}
        />
        <span
          className="absolute left-1/2 top-full whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[9px] font-medium text-foreground shadow-sm transition-all duration-200"
          style={{
            transform: `translate(-50%, ${hovered ? "6px" : "0px"})`,
            opacity: hovered ? 1 : 0,
          }}
        >
          Draft creative
        </span>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Polaroid plan radio (Step 1 — Plan selection)
// ---------------------------------------------------------------------------

function PolaroidPlanRadio({
  rotate,
  selected,
  onSelect,
  className,
  children,
}: {
  rotate: number;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const straighten = selected || hover;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative flex w-full flex-col rounded-2xl border-2 bg-card p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.10)] transition-[transform,box-shadow,border-color] duration-300 ease-out",
        selected ? "border-primary shadow-[0_16px_32px_rgba(132,204,22,0.28)]" : "border-border",
        className,
      )}
      style={{
        transform: `rotate(${straighten ? 0 : rotate}deg) translateY(${straighten ? -6 : 0}px)`,
      }}
    >
      {selected && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm">
          <Check className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
        </span>
      )}
      {children}
    </button>
  );
}

const PLAN_ROTATIONS = [3, -2, 2];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Concept06ScatteredDesk() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: "login" | "signup" = searchParams.get("view") === "signup" ? "signup" : "login";
  const step: 1 | 2 = searchParams.get("step") === "2" ? 2 : 1;

  const goToLogin = () => setSearchParams({});
  const goToSignup = () => setSearchParams({ view: "signup" });
  const goToStep = (n: 1 | 2) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", "signup");
    if (n === 1) next.delete("step");
    else next.set("step", "2");
    setSearchParams(next);
  };

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // Signup step 1 — plan selection
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SelectablePlanId | null>("starter");

  // Signup step 2 — profile setup
  const [profileMode, setProfileMode] = useState<"individual" | "agency">("individual");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mouse parallax + per-object hover
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestEvent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: globalThis.MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      latestEvent.current = { x: nx, y: ny };
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          setMouse(latestEvent.current);
          frameRef.current = null;
        });
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const isPlansStep = view === "signup" && step === 1;
  const ctaLabel = selectedPlan === "trial" ? PLANS_COPY.ctaTrialLabel : PLANS_COPY.ctaPaidLabel;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <style>{`
        @keyframes scatter-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(var(--bob-amplitude, -8px)); }
        }
        .scatter-bob {
          animation-name: scatter-bob;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes typing-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
        .typing-dot {
          animation: typing-dot-bounce 1.1s ease-in-out infinite;
        }
      `}</style>

      {/* Desk ambience — soft lamp glow + faint paper-grain dots to kill the
          empty middle distance without adding new chrome. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(100,116,139,0.16) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Scattered desk objects — bob (idle) + parallax (mouse) + hover
          (lift/straighten/reveal), three independent layers of motion. */}
      {SCATTER_OBJECTS.map((obj) => {
        const parallaxX = mouse.x * obj.parallaxStrength;
        const parallaxY = mouse.y * obj.parallaxStrength;
        const hovered = hoveredObject === obj.id;
        return (
          <div
            key={obj.id}
            className="absolute z-0 hidden md:block"
            style={{
              top: obj.top,
              bottom: obj.bottom,
              left: obj.left,
              right: obj.right,
              transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
              transition: "transform 120ms ease-out",
            }}
          >
            <div
              className="scatter-bob"
              style={
                {
                  animationDuration: obj.bobDuration,
                  animationDelay: obj.bobDelay,
                  "--bob-amplitude": `-${obj.bobAmplitude}px`,
                } as React.CSSProperties
              }
            >
              <div
                role="presentation"
                onMouseEnter={() => setHoveredObject(obj.id)}
                onMouseLeave={() => setHoveredObject((cur) => (cur === obj.id ? null : cur))}
                className={cn(
                  obj.size,
                  "transition-[transform,box-shadow,border-color] duration-300 ease-out",
                  obj.chrome === "card" &&
                    "rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
                  obj.chrome === "pill" && "rounded-full border-0 bg-primary shadow-[0_10px_26px_rgba(132,204,22,0.32)]",
                  hovered && obj.chrome !== "photo" && "border-primary/50 shadow-[0_18px_36px_rgba(15,23,42,0.16)]",
                )}
                style={{
                  transform: `rotate(${hovered ? 0 : obj.rotate}deg) translateY(${hovered ? -8 : 0}px) scale(${hovered ? 1.08 : 1})`,
                  zIndex: hovered ? 30 : undefined,
                  filter: hovered && obj.chrome === "photo" ? "drop-shadow(0 16px 30px rgba(15,23,42,0.3))" : undefined,
                }}
              >
                {obj.content(hovered)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Centered, cardless form */}
      <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-12">
        <div className={cn("w-full transition-[max-width] duration-300", isPlansStep ? "max-w-2xl" : "max-w-sm")}>
          {view === "login" && (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold tracking-[-0.01em] text-foreground">
                  <span aria-hidden="true">{COPY.headingEmoji} </span>
                  {COPY.heading}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{COPY.subheading}</p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="scatter-email" className="text-xs font-medium text-muted-foreground">
                    {COPY.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      id="scatter-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={COPY.emailPlaceholder}
                      className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="scatter-password" className="text-xs font-medium text-muted-foreground">
                    {COPY.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      id="scatter-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={COPY.passwordPlaceholder}
                      className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                      className="h-3.5 w-3.5 rounded border-border accent-primary"
                    />
                    {COPY.rememberLabel}
                  </label>
                  <button type="button" className="text-xs font-medium text-primary-text transition hover:opacity-80">
                    {COPY.forgotLabel}
                  </button>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  {COPY.submitLabel}
                </button>

                <div className="my-2 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{COPY.dividerLabel}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <GoogleG />
                  {COPY.googleLabel}
                </button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {COPY.signupPromptLabel}{" "}
                  <button
                    type="button"
                    onClick={goToSignup}
                    className="font-medium text-primary-text transition hover:opacity-80"
                  >
                    {COPY.signupLinkLabel}
                  </button>
                </p>
              </form>
            </>
          )}

          {isPlansStep && (
            <div className="flex flex-col items-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-text">
                {PLANS_COPY.stepOneLabel} · 1/2
              </p>
              <h1 className="mt-2 max-w-md text-center text-2xl font-bold tracking-[-0.01em] text-foreground">
                {PLANS_COPY.heading}
              </h1>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">{PLANS_COPY.subheading}</p>

              <div className="relative mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-300",
                    billing === "monthly" ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {PLANS_COPY.monthlyLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-300",
                    billing === "annual" ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {PLANS_COPY.annualLabel}
                </button>
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1 z-0 w-[calc(50%-4px)] rounded-full bg-primary shadow-sm transition-transform duration-300 ease-out"
                  style={{ transform: billing === "annual" ? "translateX(calc(100% + 4px))" : "translateX(0)" }}
                />
                {billing === "annual" && (
                  <img
                    src={signupSave20Scribble}
                    alt={ANNUAL_SAVINGS_LABEL}
                    className="pointer-events-none absolute -right-14 -top-8 h-12 w-16 rotate-6 animate-in fade-in"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Trial polaroid — its own tilted strip above the paid plans,
                  per the "trial row above paid plans" contract. */}
              <div className="mt-7 w-full max-w-md" role="radiogroup" aria-label="Plan">
                <PolaroidPlanRadio rotate={-2} selected={selectedPlan === "trial"} onSelect={() => setSelectedPlan("trial")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">{TRIAL_PLAN.name}</span>
                    <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                      {TRIAL_PLAN.chip}
                    </span>
                  </div>
                </PolaroidPlanRadio>
              </div>

              {/* Paid plans — polaroid cluster */}
              <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                {PAID_PLANS.map((plan, i) => (
                  <PolaroidPlanRadio
                    key={plan.id}
                    rotate={PLAN_ROTATIONS[i] ?? 0}
                    selected={selectedPlan === plan.id}
                    onSelect={() => setSelectedPlan(plan.id)}
                  >
                    {plan.mostPopular && (
                      <span className="absolute -top-3 left-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                        Most popular
                      </span>
                    )}
                    <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{plan.subtitle}</p>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      {billing === "annual" && (
                        <span className="text-xs text-muted-foreground line-through">${plan.monthlyPrice}</span>
                      )}
                      <span className="text-xl font-bold text-foreground">${priceForBilling(plan, billing)}</span>
                      <span className="text-[11px] text-muted-foreground">/mo</span>
                    </div>
                    {billing === "annual" && (
                      <p className="mt-0.5 text-[10px] font-medium text-success-text">
                        Save ${annualSavings(plan)} / billed yearly
                      </p>
                    )}
                  </PolaroidPlanRadio>
                ))}
              </div>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="mt-4 flex items-center gap-1 self-end text-xs text-muted-foreground transition hover:text-foreground"
              >
                {PLANS_COPY.planDetailsLabel}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => goToStep(2)}
                className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                {ctaLabel}
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {PLANS_COPY.loginPromptLabel}{" "}
                <button type="button" onClick={goToLogin} className="font-medium text-primary-text transition hover:opacity-80">
                  {PLANS_COPY.loginLinkLabel}
                </button>
              </p>
            </div>
          )}

          {view === "signup" && step === 2 && (
            <div className="flex flex-col items-center">
              <h1 className="max-w-sm text-center text-2xl font-bold tracking-[-0.01em] text-foreground">
                {PROFILE_COPY.heading}
              </h1>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">{PROFILE_COPY.subheading}</p>

              <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setProfileMode("individual")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                    profileMode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {PROFILE_COPY.individualTabLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileMode("agency")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                    profileMode === "agency" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {PROFILE_COPY.agencyTabLabel}
                </button>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex w-full flex-col gap-4">
                {profileMode === "individual" ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="scatter-fullname" className="text-xs font-medium text-muted-foreground">
                        {PROFILE_COPY.fullNameLabel}
                      </label>
                      <div className="relative">
                        <User
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <input
                          id="scatter-fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={PROFILE_COPY.fullNamePlaceholder}
                          className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="scatter-signup-email" className="text-xs font-medium text-muted-foreground">
                        {PROFILE_COPY.emailLabel}
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <input
                          id="scatter-signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder={PROFILE_COPY.emailPlaceholder}
                          className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="scatter-agencyname" className="text-xs font-medium text-muted-foreground">
                        {PROFILE_COPY.agencyNameLabel}
                      </label>
                      <input
                        id="scatter-agencyname"
                        type="text"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder={PROFILE_COPY.agencyNamePlaceholder}
                        className="w-full rounded-[28px] border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="scatter-adminemail" className="text-xs font-medium text-muted-foreground">
                        {PROFILE_COPY.adminEmailLabel}
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <input
                          id="scatter-adminemail"
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder={PROFILE_COPY.adminEmailPlaceholder}
                          className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="scatter-phone" className="text-xs font-medium text-muted-foreground">
                    {PROFILE_COPY.phoneLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="flex h-[42px] shrink-0 items-center rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground">
                      {PROFILE_COPY.phoneCode}
                    </span>
                    <input
                      id="scatter-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={PROFILE_COPY.phonePlaceholder}
                      className="w-full flex-1 rounded-[28px] border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="scatter-set-password" className="text-xs font-medium text-muted-foreground">
                    {PROFILE_COPY.setPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      id="scatter-set-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder={PROFILE_COPY.passwordPlaceholder}
                      className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{PROFILE_COPY.passwordHint}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="scatter-confirm-password" className="text-xs font-medium text-muted-foreground">
                    {PROFILE_COPY.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      id="scatter-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={PROFILE_COPY.passwordPlaceholder}
                      className="w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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

                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:-rotate-1 hover:bg-muted"
                  >
                    {PROFILE_COPY.backLabel}
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    {PROFILE_COPY.submitLabel}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z"
      />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
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
