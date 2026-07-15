import { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react";

import type { SelectablePlanId, BillingCycle } from "@/components/auth/signup/plans";
import { AUTH_V2_SIGNUP_COPY } from "@/auth-v2/shared/copy";
import { PlanOverviewCard } from "@/auth-v2/shared/PlanOverviewCard";

import fabadsLogoDark from "@/assets/fabads-logo-dark.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";

/**
 * LivingSplitSignup — light-theme, split-screen signup for the auth-v2
 * "Living Split" variant.
 *
 * Signature mechanic: the left image panel is a live readout of form state.
 *   1. accountType crossfade — headline/chips/tint swap between an
 *      Individual and an Agency "scene", mirroring the greeting-crossfade
 *      technique in Concept03ReactiveCompanion.tsx (dual absolutely-stacked
 *      layers, opacity+translateY, ~450ms).
 *   2. focus-reactive field chips — rebuilds Concept08StepperInScene.tsx's
 *      floating field-chip mechanic, but the trigger is field FOCUS (not
 *      plan selection): whichever field is focused, its twin chip on the
 *      panel lights up (dim bg-white/10 -> bg-primary/20, scale 1 -> 1.06,
 *      soft glow), ~280ms.
 *   3. idle parallax on all chips (rAF-throttled mousemove, small per-chip
 *      depth offsets), mirroring Concept06ScatteredDesk.tsx.
 *   4. on-load breathing scale + drifting glow blobs + one-time settle-in.
 *
 * Single-step form only — no stepper, no plan grid, no billing UI. Plan is
 * shown read-only via PlanOverviewCard, placed in the form column above
 * the fields (blended into the light card, not competing with the panel).
 */

export interface AuthV2CommonProps {
  view: "login" | "signup";
  onViewChange: (next: "login" | "signup") => void;
  accountType: "individual" | "agency";
  onAccountTypeChange: (next: "individual" | "agency") => void;
  planId: SelectablePlanId;
  billing: BillingCycle;
}

type ActiveField = "name" | "email" | "phone" | null;
type StrengthTier = 0 | 1 | 2 | 3 | 4;

/** Same heuristic family as Concept03ReactiveCompanion.tsx's scorePassword,
 *  reimplemented locally per contract (auth-v2 must not import concepts). */
function scorePassword(password: string): { tier: StrengthTier; label: string } {
  if (password.length === 0) return { tier: 0, label: "" };
  let tier = 1;
  if (password.length >= 8) tier += 1;
  if (/[0-9]/.test(password)) tier += 1;
  if (/[^A-Za-z0-9]/.test(password)) tier += 1;
  const clamped = Math.min(tier, 4) as StrengthTier;
  const labels: Record<StrengthTier, string> = {
    0: "",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };
  return { tier: clamped, label: labels[clamped] };
}

const TIER_BAR_CLASS: Record<StrengthTier, string> = {
  0: "bg-transparent",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

/** Splits a heading around the first occurrence of `word` so it can carry
 *  the skewed half-highlight bar behind one word (Concept10NatureSplit.tsx
 *  technique) without hardcoding a duplicate string. */
function splitAtWord(full: string, word: string): [string, string, string] {
  const idx = full.indexOf(word);
  if (idx === -1) return [full, "", ""];
  return [full.slice(0, idx), word, full.slice(idx + word.length)];
}

function Highlight({ children }: { children: string }) {
  return (
    <span className="relative z-0 inline-block px-0.5">
      <span
        className="ls-signup-highlight-mark absolute inset-y-1 left-0 -z-10 w-full rounded-[6px] bg-primary/70"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

const INPUT_CLASS =
  "w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary";

interface PanelScene {
  headline: string;
  chips: string[];
  tint: string;
}

const SCENES: Record<"individual" | "agency", PanelScene> = {
  individual: {
    headline: "Built for solo creators and freelancers",
    chips: ["Launch in minutes", "Personal dashboard"],
    tint:
      "radial-gradient(circle at 20% 15%, rgba(163,230,53,0.22), transparent 55%), radial-gradient(circle at 85% 80%, rgba(56,189,248,0.14), transparent 60%)",
  },
  agency: {
    headline: "Built for growing agency teams",
    chips: ["Multi-client workspace", "Team seats included"],
    tint:
      "radial-gradient(circle at 80% 20%, rgba(163,230,53,0.22), transparent 55%), radial-gradient(circle at 15% 85%, rgba(250,204,21,0.14), transparent 60%)",
  },
};

interface FieldChipSpec {
  key: Exclude<ActiveField, null>;
  Icon: typeof User;
  top: string;
  left: string;
  parallaxStrength: number;
}

const FIELD_CHIP_LAYOUT: FieldChipSpec[] = [
  { key: "name", Icon: User, top: "20%", left: "10%", parallaxStrength: 10 },
  { key: "email", Icon: Mail, top: "48%", left: "68%", parallaxStrength: 14 },
  { key: "phone", Icon: Phone, top: "74%", left: "16%", parallaxStrength: 8 },
];

export default function LivingSplitSignup(props: AuthV2CommonProps) {
  const { accountType, onAccountTypeChange, onViewChange, planId, billing } = props;

  const copy = AUTH_V2_SIGNUP_COPY;
  const [signupLead, signupMark, signupTail] = splitAtWord(copy.heading, "smarter");

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Signature mechanic: which field is currently focused
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const focusField = (f: ActiveField) => () => setActiveField(f);
  const blurField = () => setActiveField(null);

  // Idle parallax — rAF-throttled mousemove (Concept06ScatteredDesk.tsx technique)
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const latest = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      latest.current = { x: nx, y: ny };
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          setMouse(latest.current);
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

  const strength = scorePassword(password);
  const fillPercent = (strength.tier / 4) * 100;

  const scene = SCENES[accountType];

  return (
    <div className="authv2-force-light flex min-h-[100dvh] w-full bg-background text-foreground">
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
        @keyframes ls-signup-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .ls-signup-breathe { animation: ls-signup-breathe 7s ease-in-out infinite; }

        @keyframes ls-signup-glow-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(22px, -16px) scale(1.08); }
        }
        @keyframes ls-signup-glow-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-18px, 14px) scale(1.05); }
        }
        .ls-signup-glow-a { animation: ls-signup-glow-a 14s ease-in-out infinite; }
        .ls-signup-glow-b { animation: ls-signup-glow-b 17s ease-in-out infinite; }

        @keyframes ls-signup-settle-in {
          0% { opacity: 0; transform: scale(0.97) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ls-signup-settle-in { animation: ls-signup-settle-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes ls-signup-fade-rise {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .ls-signup-fade-rise { animation: ls-signup-fade-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes ls-signup-highlight-paint {
          0% { transform: rotate(-1.5deg) scaleX(0); }
          100% { transform: rotate(-1.5deg) scaleX(1); }
        }
        .ls-signup-highlight-mark {
          transform-origin: left center;
          animation: ls-signup-highlight-paint 0.55s ease-out forwards;
          animation-delay: 200ms;
        }

        .ls-signup-chip {
          transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 280ms ease,
            box-shadow 280ms ease, border-color 280ms ease;
        }
        .ls-signup-scene {
          transition: opacity 450ms ease, transform 450ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .ls-signup-breathe, .ls-signup-glow-a, .ls-signup-glow-b {
            animation: none !important;
          }
          .ls-signup-settle-in, .ls-signup-fade-rise, .ls-signup-highlight-mark {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .ls-signup-chip, .ls-signup-scene {
            transition-duration: 1ms !important;
          }
        }
      `}</style>

      {/* Left — image / scene panel */}
      <div className="relative hidden overflow-hidden bg-muted/40 p-2 lg:block lg:w-[46%] lg:flex-none">
        <div
          className="ls-signup-settle-in ls-signup-breathe relative h-full w-full overflow-hidden rounded-[28px] border border-border/60 shadow-2xl shadow-black/10"
          style={{ backgroundImage: scene.tint, backgroundColor: "hsl(var(--card))" }}
        >
          <div className="ls-signup-glow-a pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="ls-signup-glow-b pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />

          <img src={fabadsLogoDark} alt="FabAds" className="absolute left-8 top-8 z-20 h-6 w-auto" />

          {/* accountType crossfade — dual stacked scenes */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-14 text-center">
            {(["individual", "agency"] as const).map((key) => {
              const isActive = accountType === key;
              const s = SCENES[key];
              return (
                <div
                  key={key}
                  className={`ls-signup-scene absolute inset-x-0 top-1/3 flex flex-col items-center px-14 text-center ${
                    isActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1.5 opacity-0"
                  }`}
                >
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-foreground/80 backdrop-blur-sm">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {key === "individual" ? copy.individualTabLabel : copy.agencyTabLabel}
                  </div>
                  <h2 className="max-w-sm text-2xl font-bold tracking-[-0.01em] text-foreground">
                    {s.headline}
                  </h2>
                </div>
              );
            })}
          </div>

          {/* focus-reactive field chips */}
          {FIELD_CHIP_LAYOUT.map((chip) => {
            const isActive = activeField === chip.key;
            const label =
              chip.key === "name"
                ? accountType === "individual"
                  ? copy.fullNameLabel
                  : copy.agencyNameLabel
                : chip.key === "email"
                  ? accountType === "individual"
                    ? copy.emailLabel
                    : copy.adminEmailLabel
                  : copy.phoneLabel;
            const px = mouse.x * chip.parallaxStrength;
            const py = mouse.y * chip.parallaxStrength;
            return (
              <div
                key={chip.key}
                className="absolute z-20"
                style={{
                  top: chip.top,
                  left: chip.left,
                  transform: `translate3d(${px}px, ${py}px, 0)`,
                  transition: "transform 120ms ease-out",
                }}
              >
                <div className="relative">
                  {isActive && (
                    <div className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full bg-primary/30 blur-xl" />
                  )}
                  <div
                    className={`ls-signup-chip flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${
                      isActive
                        ? "border-primary/60 bg-primary/20 text-foreground shadow-lg shadow-primary/20"
                        : "border-white/20 bg-white/10 text-foreground/70"
                    }`}
                    style={{ transform: isActive ? "scale(1.06)" : "scale(1)" }}
                  >
                    <chip.Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-foreground/50"}`} />
                    {label}
                  </div>
                </div>
              </div>
            );
          })}

          {/* subtle product mockup, bottom, faded */}
          <div className="absolute inset-x-0 bottom-0 z-[1] flex justify-center overflow-hidden opacity-90" style={{ height: "38%" }}>
            <img
              src={heroMockup}
              alt=""
              aria-hidden="true"
              className="w-[90%] max-w-[440px] object-contain object-bottom"
              style={{
                maskImage: "linear-gradient(to top, black 55%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to top, black 55%, transparent 100%)",
              }}
            />
          </div>

          <p className="absolute bottom-6 left-8 right-8 z-20 text-center text-[11px] text-foreground/50">
            Trusted by performance marketers and agencies worldwide
          </p>
        </div>
      </div>

      {/* Right — single-step signup form */}
      <div className="flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <div className="w-full max-w-md">
          <img src={fabadsLogoDark} alt="FabAds" className="mb-6 h-6 w-auto lg:hidden" />

          <div className="ls-signup-fade-rise" style={{ animationDelay: "40ms" }}>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-foreground">
              {signupLead}
              {signupMark && <Highlight>{signupMark}</Highlight>}
              {signupTail}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subheading}</p>
          </div>

          <div className="ls-signup-fade-rise mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground" style={{ animationDelay: "90ms" }}>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Your details, your pace — nothing here is final until you hit submit.
          </div>

          <div className="ls-signup-fade-rise mt-5" style={{ animationDelay: "120ms" }}>
            <PlanOverviewCard planId={planId} billing={billing} className="bg-muted/30" />
          </div>

          <div className="ls-signup-fade-rise mt-6 inline-flex rounded-full border border-border bg-card p-1" style={{ animationDelay: "150ms" }}>
            <button
              type="button"
              onClick={() => onAccountTypeChange("individual")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                accountType === "individual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {copy.individualTabLabel}
            </button>
            <button
              type="button"
              onClick={() => onAccountTypeChange("agency")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                accountType === "agency"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {copy.agencyTabLabel}
            </button>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {accountType === "individual" ? (
              <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "180ms" }}>
                <label htmlFor="ls-signup-full-name" className="text-xs font-medium text-muted-foreground">
                  {copy.fullNameLabel}
                </label>
                <div className="group relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="ls-signup-full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={focusField("name")}
                    onBlur={blurField}
                    placeholder={copy.fullNamePlaceholder}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>
              </div>
            ) : (
              <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "180ms" }}>
                <label htmlFor="ls-signup-agency-name" className="text-xs font-medium text-muted-foreground">
                  {copy.agencyNameLabel}
                </label>
                <div className="group relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="ls-signup-agency-name"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    onFocus={focusField("name")}
                    onBlur={blurField}
                    placeholder={copy.agencyNamePlaceholder}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>
              </div>
            )}

            {accountType === "individual" ? (
              <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "210ms" }}>
                <label htmlFor="ls-signup-email" className="text-xs font-medium text-muted-foreground">
                  {copy.emailLabel}
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="ls-signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={focusField("email")}
                    onBlur={blurField}
                    placeholder={copy.emailPlaceholder}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>
              </div>
            ) : (
              <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "210ms" }}>
                <label htmlFor="ls-signup-admin-email" className="text-xs font-medium text-muted-foreground">
                  {copy.adminEmailLabel}
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="ls-signup-admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    onFocus={focusField("email")}
                    onBlur={blurField}
                    placeholder={copy.adminEmailPlaceholder}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>
              </div>
            )}

            <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "240ms" }}>
              <label htmlFor="ls-signup-phone" className="text-xs font-medium text-muted-foreground">
                {copy.phoneLabel}
              </label>
              <div className="flex gap-2">
                <span className="flex w-16 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm text-muted-foreground">
                  {copy.phoneCode}
                </span>
                <div className="group relative flex-1">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="ls-signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={focusField("phone")}
                    onBlur={blurField}
                    placeholder={copy.phonePlaceholder}
                    className={`${INPUT_CLASS} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "270ms" }}>
              <label htmlFor="ls-signup-password" className="text-xs font-medium text-muted-foreground">
                {copy.setPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="ls-signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="fab-focus absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="pt-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${TIER_BAR_CLASS[strength.tier]}`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">{strength.label}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{copy.passwordHint}</p>
            </div>

            <div className="ls-signup-fade-rise space-y-1.5" style={{ animationDelay: "300ms" }}>
              <label htmlFor="ls-signup-confirm-password" className="text-xs font-medium text-muted-foreground">
                {copy.confirmPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="ls-signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  className={`${INPUT_CLASS} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="fab-focus absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ls-signup-fade-rise fab-focus mt-1 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              style={{ animationDelay: "330ms" }}
            >
              {copy.submitLabel}
            </button>
          </form>

          <p className="ls-signup-fade-rise mt-6 text-center text-sm text-muted-foreground" style={{ animationDelay: "360ms" }}>
            {copy.loginPromptLabel}{" "}
            <button
              type="button"
              onClick={() => onViewChange("login")}
              className="fab-focus rounded-sm font-medium text-primary hover:opacity-80"
            >
              {copy.loginLinkLabel}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
