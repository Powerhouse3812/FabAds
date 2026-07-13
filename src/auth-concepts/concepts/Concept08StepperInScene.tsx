import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react";
import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";

/**
 * Concept 08 — "Stepper in scene"
 *
 * Split-screen login. The form side is fixed and functionally identical to
 * every other concept in this exploration track. The scene side is a small,
 * self-contained demo: it auto-cycles between two "onboarding step" states
 * every ~4s to show how this illustration panel would carry step progress
 * across a real multi-step flow, even though this particular screen is a
 * single-step login.
 */

interface SceneStep {
  gradient: string;
  glow: string;
  eyebrow: string;
  heading: string;
  subcopy: string;
}

const SCENE_STEPS: SceneStep[] = [
  {
    gradient: "from-[#0f2f66] via-[#1554b8] to-[#2f8ff0]",
    glow: "rgba(70,150,255,0.55)",
    eyebrow: "Step 1 of 2",
    heading: "Let's get started",
    subcopy: "Your campaigns, organized in one place.",
  },
  {
    gradient: "from-[#0c3d2c] via-[#158a55] to-[#5be08a]",
    glow: "rgba(90,230,160,0.5)",
    eyebrow: "Step 2 of 2",
    heading: "Almost there",
    subcopy: "Set up takes less than 2 minutes.",
  },
];

const CYCLE_MS = 4000;

export default function Concept08StepperInScene() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % SCENE_STEPS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0c] text-white">
      <style>{`
        @keyframes c08-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .c08-scene-layer {
          transition: opacity 700ms ease;
        }
        .c08-dot {
          transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1), background-color 500ms ease, opacity 500ms ease;
        }
        .c08-orb {
          animation: c08-drift 9s ease-in-out infinite;
        }
        @keyframes c08-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.06); }
        }
      `}</style>

      {/* Form side — fixed, canonical fields only */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-[46%] lg:flex-none">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-sm font-medium text-white/50">
            <Sparkles className="h-4 w-4 text-[#7fb2ff]" />
            FabAds
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {AUTH_CONCEPT_COPY.heading}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {AUTH_CONCEPT_COPY.subheading}
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="c08-email"
                className="text-xs font-medium text-white/60"
              >
                {AUTH_CONCEPT_COPY.emailLabel}
              </label>
              <input
                id="c08-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={AUTH_CONCEPT_COPY.emailPlaceholder}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#4d8dff]/60 focus:bg-white/[0.06]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="c08-password"
                  className="text-xs font-medium text-white/60"
                >
                  {AUTH_CONCEPT_COPY.passwordLabel}
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-[#7fb2ff] hover:text-[#a7c9ff]"
                >
                  {AUTH_CONCEPT_COPY.forgotLabel}
                </button>
              </div>
              <div className="relative">
                <input
                  id="c08-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={AUTH_CONCEPT_COPY.passwordPlaceholder}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#4d8dff]/60 focus:bg-white/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-white/40 hover:text-white/70"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-[#4d8dff]"
              />
              {AUTH_CONCEPT_COPY.rememberLabel}
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#2f7dfd] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3f88ff]"
            >
              {AUTH_CONCEPT_COPY.submitLabel}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40">
                {AUTH_CONCEPT_COPY.dividerLabel}
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.07]"
            >
              <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.4 0 10.3-2 13.9-5.4l-6.4-5.4C29.5 34.9 26.9 36 24 36c-5.4 0-9.9-3.4-11.5-8.2l-6.5 5C9.7 39.6 16.3 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.6-6.4 7.1l6.4 5.4C39.5 37.5 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"
                />
              </svg>
              {AUTH_CONCEPT_COPY.googleLabel}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/50">
            {AUTH_CONCEPT_COPY.signupPromptLabel}{" "}
            <button
              type="button"
              className="font-medium text-[#7fb2ff] hover:text-[#a7c9ff]"
            >
              {AUTH_CONCEPT_COPY.signupLinkLabel}
            </button>
          </p>
        </div>
      </div>

      {/* Scene side — self-contained demo of a stepper-carrying illustration */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {SCENE_STEPS.map((s, i) => (
          <div
            key={i}
            className={`c08-scene-layer absolute inset-0 bg-gradient-to-br ${s.gradient}`}
            style={{
              opacity: i === step ? 1 : 0,
              zIndex: i === step ? 1 : 0,
              pointerEvents: "none",
            }}
          >
            {/* Ambient orbs */}
            <div
              className="c08-orb absolute -left-24 top-24 h-72 w-72 rounded-full blur-3xl"
              style={{ background: s.glow }}
            />
            <div
              className="c08-orb absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl"
              style={{ background: s.glow, animationDelay: "2s" }}
            />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-16 text-center">
              <div className="mb-6 flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {s.eyebrow}
              </div>
              <h2 className="max-w-md text-4xl font-semibold tracking-tight text-white">
                {s.heading}
              </h2>
              <p className="mt-4 max-w-sm text-base text-white/75">
                {s.subcopy}
              </p>
            </div>
          </div>
        ))}

        {/* Dot indicator */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center gap-2">
          {SCENE_STEPS.map((_, i) => (
            <span
              key={i}
              className={`c08-dot h-2 rounded-full ${
                i === step ? "bg-white" : "bg-white/30"
              }`}
              style={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.7 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
