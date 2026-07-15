import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, BarChart3, Rocket, Activity, Radar } from "lucide-react";
import type { SelectablePlanId, BillingCycle } from "@/components/auth/signup/plans";
import { AUTH_V2_LOGIN_COPY } from "@/auth-v2/shared/copy";

import heroMockup from "@/assets/auth/hero-mockup.png";
import heroLogo from "@/assets/auth/hero-logo.svg";

/**
 * "Living Split" — LOGIN screen.
 *
 * Left: an inset "window" panel holding the real product mockup — breathes
 * gently on an infinite loop, settles in on mount, and carries a handful of
 * glass feature chips that idle-float AND parallax against the cursor
 * (mirrors Concept06ScatteredDesk.tsx's rAF-throttled page-level mousemove
 * technique). Two soft glow blobs drift slowly underneath for atmosphere
 * (mirrors Concept02BlobDivide.tsx / Concept10NatureSplit.tsx glow blobs).
 *
 * Right: clean, airy form column, light theme, pill inputs, one-word
 * "half-highlight" heading treatment (mirrors Concept10NatureSplit.tsx's
 * splitAtWord/Highlight helper) and a staggered fade+rise entrance.
 *
 * Keyframes in this file are all prefixed `ls-login-*` to avoid clashing
 * with the Living Split SIGNUP screen's `ls-signup-*` keyframes if both
 * land in the same global stylesheet scope.
 */

export interface AuthV2CommonProps {
  view: "login" | "signup";
  onViewChange: (next: "login" | "signup") => void;
  accountType: "individual" | "agency";
  onAccountTypeChange: (next: "individual" | "agency") => void;
  planId: SelectablePlanId;
  billing: BillingCycle;
}

const COPY = AUTH_V2_LOGIN_COPY;

/** Splits `full` around the first occurrence of `word` for the half-highlight
 *  heading treatment — same technique as Concept10NatureSplit's splitAtWord. */
function splitAtWord(full: string, word: string): [string, string, string] {
  const idx = full.indexOf(word);
  if (idx === -1) return [full, "", ""];
  return [full.slice(0, idx), word, full.slice(idx + word.length)];
}

function Highlight({ children }: { children: string }) {
  return (
    <span className="relative z-0 inline-block px-0.5">
      <span
        className="ls-login-highlight-mark absolute inset-y-1 left-0 -z-10 w-full rounded-[6px] bg-primary/70"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

interface FeatureChip {
  id: string;
  label: string;
  Icon: typeof BarChart3;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  parallaxStrength: number;
  floatDuration: string;
  floatDelayMs: number;
  entranceDelayMs: number;
}

const FEATURE_CHIPS: FeatureChip[] = [
  {
    id: "live",
    label: "Live campaigns",
    Icon: BarChart3,
    top: "12%",
    left: "8%",
    parallaxStrength: 10,
    floatDuration: "6s",
    floatDelayMs: 0,
    entranceDelayMs: 150,
  },
  {
    id: "ctr",
    label: "+24% CTR",
    Icon: Rocket,
    top: "22%",
    right: "9%",
    parallaxStrength: 16,
    floatDuration: "5.4s",
    floatDelayMs: 400,
    entranceDelayMs: 350,
  },
  {
    id: "auto",
    label: "Auto-optimized",
    Icon: Activity,
    bottom: "24%",
    left: "6%",
    parallaxStrength: 8,
    floatDuration: "6.6s",
    floatDelayMs: 900,
    entranceDelayMs: 550,
  },
  {
    id: "monitor",
    label: "24/7 monitoring",
    Icon: Radar,
    bottom: "12%",
    right: "10%",
    parallaxStrength: 13,
    floatDuration: "5.9s",
    floatDelayMs: 1300,
    entranceDelayMs: 750,
  },
];

const pillInput =
  "w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground";

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

export default function LivingSplitLogin(props: AuthV2CommonProps) {
  const { onViewChange } = props;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // Page-level, rAF-throttled cursor parallax for the floating feature chips
  // — mirrors Concept06ScatteredDesk.tsx's technique: raw mousemove events
  // are coalesced into `latestEvent`, and only the queued rAF actually
  // commits a state update, so we never re-render more than once per frame.
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const latestEvent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
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

  const [loginLead, loginMark, loginTail] = splitAtWord(COPY.heading, "Fab-Funnel");
  const year = new Date().getFullYear();

  return (
    <div className="authv2-force-light relative flex min-h-[100dvh] w-full overflow-hidden bg-background">
      <style>{`
        /* Living Split is spec'd as always-light, independent of the app's
           active theme (next-themes toggles class="dark" on <html>, and
           Tailwind's dark: selector matches ANY ancestor with that class —
           merely omitting "dark" here wouldn't stop it cascading in). Pin
           every token this screen touches back to its :root light value so
           it renders correctly even when the rest of the app is dark. */
        .authv2-force-light {
          --background: 0 0% 100%;
          --foreground: 265 4% 12.9%;
          --card: 0 0% 100%;
          --card-foreground: 265 4% 12.9%;
          --primary: 75 71% 43%;
          --primary-foreground: 0 0% 7%;
          --primary-text: 75 84% 25%;
          --secondary: 248 0.7% 96.8%;
          --secondary-foreground: 266 4% 20.8%;
          --muted: 248 0.7% 96.8%;
          --muted-foreground: 257 4.6% 55.4%;
          --border: 256 1.3% 92.9%;
          --input: 256 1.3% 92.9%;
          --ring: 257 4% 70.4%;
          --error-text: 354 84% 44%;
          --warning-text: 34 100% 26%;
          --success-text: 105 95% 24%;
        }
        @keyframes ls-login-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes ls-login-settle-in {
          0% { opacity: 0; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ls-login-glow-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(18px, -14px) scale(1.08); }
        }
        @keyframes ls-login-glow-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-16px, 12px) scale(1.05); }
        }
        @keyframes ls-login-chip-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ls-login-chip-in {
          0% { opacity: 0; transform: translateY(14px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ls-login-field-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ls-login-highlight-paint {
          0% { transform: rotate(-1.5deg) scaleX(0); }
          100% { transform: rotate(-1.5deg) scaleX(1); }
        }

        .ls-login-panel {
          animation: ls-login-settle-in 0.6s ease-out both,
            ls-login-breathe 7s ease-in-out 0.6s infinite;
        }
        .ls-login-glow-a { animation: ls-login-glow-drift-a 14s ease-in-out infinite; }
        .ls-login-glow-b { animation: ls-login-glow-drift-b 17s ease-in-out infinite; }
        .ls-login-chip {
          opacity: 0;
          animation: ls-login-chip-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            ls-login-chip-float var(--ls-login-float-duration, 6s) ease-in-out infinite;
        }
        .ls-login-field {
          opacity: 0;
          animation: ls-login-field-in 0.4s ease-out forwards;
        }
        .ls-login-highlight-mark {
          transform-origin: left center;
          animation: ls-login-highlight-paint 0.55s ease-out forwards;
          animation-delay: 200ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .ls-login-panel,
          .ls-login-glow-a,
          .ls-login-glow-b,
          .ls-login-chip,
          .ls-login-field,
          .ls-login-highlight-mark {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Left — living product panel */}
      <div className="relative hidden w-1/2 shrink-0 items-center justify-center p-8 lg:flex">
        <div className="ls-login-panel relative h-full w-full overflow-hidden rounded-[32px] shadow-2xl">
          <img
            src={heroMockup}
            alt="FabAds dashboard on laptop and mobile, showing live campaign performance"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* color-grade + atmosphere over the product photo */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(10,18,13,0.55)_0%,rgba(19,32,24,0.2)_45%,rgba(10,19,16,0.6)_100%)]" />
          <div className="ls-login-glow-a pointer-events-none absolute -left-16 -top-14 h-72 w-72 rounded-full bg-primary/25 blur-3xl mix-blend-screen" />
          <div className="ls-login-glow-b pointer-events-none absolute bottom-[-14%] right-[-10%] h-80 w-80 rounded-full bg-primary/25 blur-3xl mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent_0%,rgba(8,14,10,0.7)_100%)]" />

          {/* brand chrome */}
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <img src={heroLogo} alt="FabAds" className="h-5 w-auto" />
            <div className="text-xs text-white/60">© {year} FabAds</div>
          </div>

          {/* floating feature chips — idle float + cursor parallax */}
          {FEATURE_CHIPS.map((chip) => {
            const parallaxX = mouse.x * chip.parallaxStrength;
            const parallaxY = mouse.y * chip.parallaxStrength;
            return (
              <div
                key={chip.id}
                className="absolute z-20"
                style={{
                  top: chip.top,
                  left: chip.left,
                  right: chip.right,
                  bottom: chip.bottom,
                  transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
                  transition: "transform 120ms ease-out",
                }}
              >
                <div
                  className="ls-login-chip"
                  style={
                    {
                      animationDelay: `${chip.entranceDelayMs}ms, ${chip.entranceDelayMs + chip.floatDelayMs}ms`,
                      "--ls-login-float-duration": chip.floatDuration,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-xl backdrop-blur-md">
                    <chip.Icon className="h-3 w-3 text-primary-text" aria-hidden="true" />
                    <span className="text-xs font-medium text-white">{chip.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — form column */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-[-0.01em] text-foreground">
            <span aria-hidden="true">{COPY.headingEmoji}</span> {loginLead}
            {loginMark && <Highlight>{loginMark}</Highlight>}
            {loginTail}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{COPY.subheading}</p>

          <div className="ls-login-field mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Takes less than a minute
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="ls-login-field" style={{ animationDelay: "80ms" }}>
              <FieldLabel htmlFor="ls-login-email">{COPY.emailLabel}</FieldLabel>
              <input
                id="ls-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={COPY.emailPlaceholder}
                className={pillInput}
              />
            </div>

            <div className="ls-login-field" style={{ animationDelay: "160ms" }}>
              <FieldLabel htmlFor="ls-login-password">{COPY.passwordLabel}</FieldLabel>
              <div className="relative">
                <input
                  id="ls-login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={COPY.passwordPlaceholder}
                  className={`${pillInput} pr-10`}
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

            <div
              className="ls-login-field flex items-center justify-between pt-1"
              style={{ animationDelay: "240ms" }}
            >
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                {COPY.rememberLabel}
              </label>
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-sm font-medium text-primary-text hover:underline"
              >
                {COPY.forgotLabel}
              </button>
            </div>

            <button
              type="submit"
              className="ls-login-field w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              style={{ animationDelay: "320ms" }}
            >
              {COPY.submitLabel}
            </button>

            <div className="ls-login-field flex items-center gap-3 pt-1" style={{ animationDelay: "400ms" }}>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {COPY.dividerLabel}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              className="ls-login-field flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted active:scale-[0.98]"
              style={{ animationDelay: "480ms" }}
            >
              <GoogleIcon />
              {COPY.googleLabel}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {COPY.signupPromptLabel}{" "}
            <button
              type="button"
              onClick={() => onViewChange("signup")}
              className="font-medium text-primary-text hover:underline"
            >
              {COPY.signupLinkLabel}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
