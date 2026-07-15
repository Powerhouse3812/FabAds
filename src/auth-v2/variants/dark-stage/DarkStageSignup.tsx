import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { User, Mail, Building2, Phone, Lock, Eye, EyeOff } from "lucide-react";

import type { SelectablePlanId, BillingCycle } from "@/components/auth/signup/plans";
import { AUTH_V2_SIGNUP_COPY } from "@/auth-v2/shared/copy";
import { PlanOverviewCard } from "@/auth-v2/shared/PlanOverviewCard";
import heroLogo from "@/assets/auth/hero-logo.svg";

export interface AuthV2CommonProps {
  view: "login" | "signup";
  onViewChange: (next: "login" | "signup") => void;
  accountType: "individual" | "agency";
  onAccountTypeChange: (next: "individual" | "agency") => void;
  planId: SelectablePlanId;
  billing: BillingCycle;
}

const COPY = AUTH_V2_SIGNUP_COPY;

const INPUT_BASE =
  "w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-text focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]";

/** Small overlapping avatar-initials stack for the brag stat, tone pattern
 *  lifted verbatim from Concept05IridescentAI.tsx's AVATARS (lime-family +
 *  neutral, calm human-trust signal — not the holographic identity). Kept
 *  in parity with the DarkStageLogin sibling. */
const AVATARS = [
  { initials: "RA", className: "bg-primary text-primary-foreground" },
  { initials: "MK", className: "bg-primary/45 text-foreground" },
  { initials: "SJ", className: "bg-muted-foreground/30 text-foreground" },
];

/** Splits `full` around the first occurrence of `word` so the heading
 *  string (sourced from shared copy) can still carry the signature
 *  half-highlight behind one word without a hardcoded duplicate string.
 *  Mirrors splitAtWord/Highlight in Concept10NatureSplit.tsx, same helper
 *  as DarkStageLogin.tsx. */
function splitAtWord(full: string, word: string): [string, string, string] {
  const idx = full.indexOf(word);
  if (idx === -1) return [full, "", ""];
  return [full.slice(0, idx), word, full.slice(idx + word.length)];
}

function Highlight({ children }: { children: string }) {
  return (
    <span className="relative z-0 inline-block px-0.5">
      <span
        className="darkstage-signup-highlight-mark absolute inset-y-1 left-0 -z-10 w-full rounded-[6px] bg-primary/70"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

/** Signature cursor-driven 3D tilt for the glass card — mirrors the
 *  technique in Concept01Spotlight.tsx and the DarkStageLogin sibling: the
 *  card rests very slightly tilted at idle and permanently straightens for
 *  the session as soon as the user focuses/types into any input
 *  (hasInteracted), blending with the live mouse-tilt via a slower
 *  spring-like transition. */
function useCardTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const MAX_DEG = 5;
    setTilt({ x: -(py - 0.5) * 2 * MAX_DEG, y: (px - 0.5) * 2 * MAX_DEG });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });
  const markInteracted = () => setHasInteracted(true);

  const idleTilt = hasInteracted ? 0 : -1.5;
  const style: CSSProperties = {
    transform: `perspective(1000px) rotate(${idleTilt}deg) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: hasInteracted
      ? "transform 380ms cubic-bezier(0.22,1,0.36,1)"
      : "transform 200ms ease-out",
  };

  return { cardRef, style, handleMouseMove, handleMouseLeave, markInteracted };
}

/** Local password-strength heuristic — client explicitly liked this from
 *  Concept03ReactiveCompanion.tsx, reimplemented standalone here (not
 *  imported): base score 1, +1 for length>=8, +1 for a digit, +1 for a
 *  symbol. 4 tiers, rendered as a single fill bar (not traffic-light
 *  red/yellow/green) using increasing bg-primary opacity. */
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 1;
  if (pw.length >= 8) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const STRENGTH_TIERS = [
  { label: "Weak", opacity: 0.35 },
  { label: "Fair", opacity: 0.55 },
  { label: "Good", opacity: 0.75 },
  { label: "Strong", opacity: 1 },
] as const;

export default function DarkStageSignup(props: AuthV2CommonProps): JSX.Element {
  const { accountType, onAccountTypeChange, onViewChange } = props;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { cardRef, style: tiltStyle, handleMouseMove, handleMouseLeave, markInteracted } =
    useCardTilt();

  // cursor-tracking warm glow — rAF-lerped, writes --mx/--my directly onto
  // the ref so mousemove never triggers a React re-render (mirrors
  // Concept01Spotlight.tsx's glowLayerRef technique, same as DarkStageLogin).
  const glowLayerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

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

  const [headLead, headMark, headTail] = splitAtWord(COPY.heading, "smarter marketing");

  const strength = scorePassword(password);
  const strengthTier = STRENGTH_TIERS[Math.min(strength, 4) - 1];

  return (
    // "dark" forced regardless of app theme — Dark Stage's identity is a
    // fixed dark scene, not the light/dark app setting. Signup is a SINGLE
    // centered column (not split like the login sibling) per client's
    // explicit "signup UI but centered, like onboarding" feedback.
    <div className="dark relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background px-6 py-4">
      <style>{`
        @keyframes darkstage-signup-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .darkstage-signup-rise { animation: darkstage-signup-rise 0.4s ease-out both; }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes darkstage-signup-glow-pulse {
            0%, 100% { opacity: 0.85; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.06); }
          }
          .darkstage-signup-glow-pulse { animation: darkstage-signup-glow-pulse 6s ease-in-out infinite; }

          @keyframes darkstage-signup-ripple {
            0% { transform: scale(0.6); opacity: 0.45; }
            100% { transform: scale(1.9); opacity: 0; }
          }
          .darkstage-signup-ripple { animation: darkstage-signup-ripple 4.6s ease-out infinite; }

          @keyframes darkstage-signup-dotgrid-breathe {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.32; }
          }
          .darkstage-signup-dotgrid-breathe { animation: darkstage-signup-dotgrid-breathe 8.5s ease-in-out infinite; }

          @keyframes darkstage-signup-line-fade-a {
            0%, 100% { opacity: 0.06; }
            50% { opacity: 0.22; }
          }
          @keyframes darkstage-signup-line-fade-b {
            0%, 100% { opacity: 0.04; }
            50% { opacity: 0.16; }
          }
          .darkstage-signup-line-a { animation: darkstage-signup-line-fade-a 10s ease-in-out infinite; }
          .darkstage-signup-line-b { animation: darkstage-signup-line-fade-b 10s ease-in-out infinite; animation-delay: -5s; }

          @keyframes darkstage-signup-ghost-drift {
            0%, 100% { transform: translate(-50%, -50%) translateX(-2%); }
            50% { transform: translate(-50%, -50%) translateX(2%); }
          }
          .darkstage-signup-ghost-drift { animation: darkstage-signup-ghost-drift 22s ease-in-out infinite; }

          @keyframes darkstage-signup-circuit-fade-a {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.22; }
          }
          @keyframes darkstage-signup-circuit-fade-b {
            0%, 100% { opacity: 0.04; }
            50% { opacity: 0.2; }
          }
          @keyframes darkstage-signup-circuit-fade-c {
            0%, 100% { opacity: 0.06; }
            50% { opacity: 0.25; }
          }
          .darkstage-signup-circuit-fade-a { animation: darkstage-signup-circuit-fade-a 11s ease-in-out infinite; animation-delay: -2s; }
          .darkstage-signup-circuit-fade-b { animation: darkstage-signup-circuit-fade-b 13s ease-in-out infinite; animation-delay: -6s; }
          .darkstage-signup-circuit-fade-c { animation: darkstage-signup-circuit-fade-c 9s ease-in-out infinite; animation-delay: -1s; }

          @keyframes darkstage-signup-highlight-paint {
            0% { transform: rotate(-1.5deg) scaleX(0); }
            100% { transform: rotate(-1.5deg) scaleX(1); }
          }
          .darkstage-signup-highlight-mark {
            transform-origin: left center;
            animation: darkstage-signup-highlight-paint 0.55s ease-out forwards;
            animation-delay: 200ms;
          }

          @keyframes darkstage-signup-bar-grow {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .darkstage-signup-bar-grow {
            transform-origin: left center;
            animation: darkstage-signup-bar-grow 0.3s ease-out both;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .darkstage-signup-highlight-mark { transform: rotate(-1.5deg) scaleX(1); }
          .darkstage-signup-bar-grow { transform: scaleX(1); }
          .darkstage-signup-ghost-drift { transform: translate(-50%, -50%); }
          .darkstage-signup-circuit-fade-a { opacity: 0.18; }
          .darkstage-signup-circuit-fade-b { opacity: 0.14; }
          .darkstage-signup-circuit-fade-c { opacity: 0.2; }
        }
      `}</style>

      {/* Ambient full-bleed layer — behind everything, same ambient system
          as DarkStageLogin.tsx: cursor glow, ripple rings, dot-grid, line
          paths, vignette. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--card))_0%,hsl(var(--background))_100%)]" />

        <div
          className="darkstage-signup-dotgrid-breathe absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--foreground)/0.35) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <svg
          className="darkstage-signup-line-a absolute left-[8%] top-[12%] h-[46%] w-[46%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M10 250 C 80 180, 120 220, 160 140 S 260 60, 290 20"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </svg>
        <svg
          className="darkstage-signup-line-b absolute bottom-[10%] right-[6%] h-[40%] w-[40%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M290 40 C 220 90, 200 40, 150 100 S 60 210, 10 260"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </svg>

        {/* Ghost wordmark — oversized, low-opacity outlined watermark that
            gives the ambient scene depth instead of just blur (client felt
            it read "empty"). Sits at z-0 behind the z-10 card; only the
            portion peeking around the card edges is actually visible. */}
        <div
          aria-hidden="true"
          className="darkstage-signup-ghost-drift absolute left-1/2 top-1/2 w-full select-none whitespace-nowrap text-center font-extrabold leading-none"
          style={{
            fontSize: "clamp(120px, 22vw, 260px)",
            color: "transparent",
            WebkitTextStroke: "1.5px hsl(var(--primary) / 0.25)",
            transform: "translate(-50%, -50%)",
          }}
        >
          LAUNCH
        </div>

        {/* Circuit-board style connector traces — angular segments with
            small joint dots, distinct from the smooth line-a/line-b paths
            above, scattered in the corners/edges those don't cover. */}
        <svg
          className="darkstage-signup-circuit-fade-a absolute right-[8%] top-[6%] h-[34%] w-[34%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M250 20 L250 90 L180 90 L180 150"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <circle cx="250" cy="90" r="3" fill="hsl(var(--primary))" />
          <circle cx="180" cy="90" r="3" fill="hsl(var(--primary))" />
        </svg>
        <svg
          className="darkstage-signup-circuit-fade-b absolute bottom-[8%] left-[10%] h-[30%] w-[30%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M20 280 L90 280 L90 200 L160 200"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <circle cx="90" cy="280" r="3" fill="hsl(var(--primary))" />
          <circle cx="90" cy="200" r="3" fill="hsl(var(--primary))" />
        </svg>
        <svg
          className="darkstage-signup-circuit-fade-c absolute left-[4%] top-[38%] h-[22%] w-[26%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M30 40 L120 40 L120 110"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <circle cx="120" cy="40" r="2.5" fill="hsl(var(--primary))" />
        </svg>

        <div ref={glowLayerRef} style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}>
          <div className="absolute left-1/2 top-[6%] h-[70%] w-[70%] -translate-x-1/2">
            <div className="darkstage-signup-glow-pulse h-full w-full rounded-full bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,222,170,0.22)_0%,hsl(var(--primary)/0.14)_35%,rgba(255,205,140,0)_70%)] blur-2xl" />
          </div>
          <div className="absolute left-1/2 top-[20%] h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,244,220,0.28)_0%,rgba(255,244,220,0)_70%)] blur-xl" />

          {[0, 1.5, 3].map((delay, i) => (
            <div
              key={i}
              className="darkstage-signup-ripple absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Logo, pinned top-center — onboarding-style single column, no split
          hero side for signup. */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="darkstage-signup-rise absolute left-1/2 top-8 z-10 h-5 w-auto -translate-x-1/2 opacity-40"
        style={{ animationDelay: "0ms" }}
      />

      {/* CENTERED CARD — single column, wizard/onboarding-style per client
          feedback (the deliberate exception to the split-screen login). */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={tiltStyle}
        className="darkstage-signup-rise relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="mb-2.5 text-center">
          <h1 className="text-lg font-bold leading-snug tracking-tight text-foreground">
            {headLead}
            {headMark && <Highlight>{headMark}</Highlight>}
            {headTail}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{COPY.subheading}</p>
        </div>

        <PlanOverviewCard planId={props.planId} billing={props.billing} className="mb-2.5" />

        {/* Individual / Agency segmented toggle */}
        <div
          role="tablist"
          aria-label="Account type"
          className="mb-2.5 grid grid-cols-2 gap-1 rounded-full border border-border bg-background/60 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={accountType === "individual"}
            onClick={() => onAccountTypeChange("individual")}
            className={`rounded-full py-1.5 text-xs font-medium transition ${
              accountType === "individual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {COPY.individualTabLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={accountType === "agency"}
            onClick={() => onAccountTypeChange("agency")}
            className={`rounded-full py-1.5 text-xs font-medium transition ${
              accountType === "agency"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {COPY.agencyTabLabel}
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2.5">
          {accountType === "individual" ? (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="darkstage-signup-name" className="text-xs font-medium text-muted-foreground">
                  {COPY.fullNameLabel}
                </label>
                <div className="group relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                  <input
                    id="darkstage-signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      markInteracted();
                    }}
                    onFocus={markInteracted}
                    placeholder={COPY.fullNamePlaceholder}
                    className={INPUT_BASE}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="darkstage-signup-email" className="text-xs font-medium text-muted-foreground">
                  {COPY.emailLabel}
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                  <input
                    id="darkstage-signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      markInteracted();
                    }}
                    onFocus={markInteracted}
                    placeholder={COPY.emailPlaceholder}
                    className={INPUT_BASE}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="darkstage-signup-agency" className="text-xs font-medium text-muted-foreground">
                  {COPY.agencyNameLabel}
                </label>
                <div className="group relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                  <input
                    id="darkstage-signup-agency"
                    type="text"
                    value={agencyName}
                    onChange={(e) => {
                      setAgencyName(e.target.value);
                      markInteracted();
                    }}
                    onFocus={markInteracted}
                    placeholder={COPY.agencyNamePlaceholder}
                    className={INPUT_BASE}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="darkstage-signup-admin-email" className="text-xs font-medium text-muted-foreground">
                  {COPY.adminEmailLabel}
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                  <input
                    id="darkstage-signup-admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      markInteracted();
                    }}
                    onFocus={markInteracted}
                    placeholder={COPY.adminEmailPlaceholder}
                    className={INPUT_BASE}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="darkstage-signup-phone" className="text-xs font-medium text-muted-foreground">
              {COPY.phoneLabel}
            </label>
            <div className="group relative flex items-stretch gap-2">
              <div className="flex items-center gap-1.5 rounded-[28px] border border-border bg-card px-3.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {COPY.phoneCode}
              </div>
              <input
                id="darkstage-signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  markInteracted();
                }}
                onFocus={markInteracted}
                placeholder={COPY.phonePlaceholder}
                className="w-full rounded-[28px] border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-text focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="darkstage-signup-password" className="text-xs font-medium text-muted-foreground">
              {COPY.setPasswordLabel}
            </label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
              <input
                id="darkstage-signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  markInteracted();
                }}
                onFocus={markInteracted}
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

            {password.length > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    key={strength}
                    className="darkstage-signup-bar-grow h-full rounded-full bg-primary"
                    style={{ width: `${(strength / 4) * 100}%`, opacity: strengthTier.opacity }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {strengthTier.label}
                </span>
              </div>
            )}

            <p className="mt-0.5 text-[11px] text-muted-foreground">{COPY.passwordHint}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="darkstage-signup-confirm-password" className="text-xs font-medium text-muted-foreground">
              {COPY.confirmPasswordLabel}
            </label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
              <input
                id="darkstage-signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  markInteracted();
                }}
                onFocus={markInteracted}
                placeholder={COPY.passwordPlaceholder}
                className={INPUT_BASE}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.25)] transition hover:bg-primary/90"
          >
            {COPY.submitLabel}
          </button>

          <p className="mt-1 text-center text-xs text-muted-foreground">
            {COPY.loginPromptLabel}{" "}
            <button
              type="button"
              onClick={() => onViewChange("login")}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {COPY.loginLinkLabel}
            </button>
          </p>
        </form>
      </div>

      {/* brag stat — pinned near the bottom, same copy pattern as
          DarkStageLogin.tsx / Concept05IridescentAI.tsx */}
      <div
        className="darkstage-signup-rise absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-card/60 p-3 backdrop-blur-xl"
        style={{ animationDelay: "260ms" }}
      >
        <div className="flex -space-x-2.5">
          {AVATARS.map((a, i) => (
            <div
              key={a.initials}
              style={{ zIndex: AVATARS.length - i }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold ${a.className}`}
            >
              {a.initials}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">4,500+</span> marketers already in
        </p>
      </div>
    </div>
  );
}
