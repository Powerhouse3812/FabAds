import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AUTH_CONCEPT_COPY as copy } from "@/auth-concepts/shared/formSpec";

/**
 * Concept 07 — Hand-drawn journey
 *
 * Cardless, centered form floating on a warm cream page. A handful of loose,
 * hand-sketched SVG doodles (arrow / chart squiggle / target / sparkle) are
 * scattered around it — each "draws itself in" via a staggered stroke-dash
 * animation, then the form settles in behind them.
 */

const DOODLE_STROKE = 480; // generous round number, comfortably longer than any path below

function ArrowDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg
      viewBox="0 0 160 90"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M8 78 C 34 66, 46 40, 78 34 C 104 29, 118 22, 122 14"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 1.3s ease-out ${delayMs}ms forwards`,
        }}
      />
      <path
        d="M104 10 C 111 12, 118 13, 124 15 C 121 21, 119 27, 118 33"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.5s ease-out ${delayMs + 900}ms forwards`,
        }}
      />
    </svg>
  );
}

function ChartDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg
      viewBox="0 0 140 90"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M6 82 L 6 10"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.4s ease-out ${delayMs}ms forwards`,
        }}
      />
      <path
        d="M4 83 L 132 83"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.5s ease-out ${delayMs + 150}ms forwards`,
        }}
      />
      <path
        d="M14 68 C 32 70, 40 58, 52 60 C 66 62, 70 44, 84 38 C 98 32, 104 18, 122 12"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 1.2s ease-out ${delayMs + 350}ms forwards`,
        }}
      />
    </svg>
  );
}

function TargetDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M50 8 C 74 6, 92 24, 91 49 C 90 74, 71 92, 48 91 C 25 90, 8 71, 9 48 C 10 26, 27 9, 50 8"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 1.1s ease-out ${delayMs}ms forwards`,
        }}
      />
      <path
        d="M50 26 C 64 25, 74 35, 73 49 C 72 63, 61 73, 48 72 C 35 71, 26 60, 27 48 C 28 36, 37 27, 50 26"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.9s ease-out ${delayMs + 250}ms forwards`,
        }}
      />
      <path
        d="M50 42 C 56 42, 60 46, 59 51 C 58 56, 54 59, 49 58 C 44 57, 41 53, 42 48 C 43 44, 46 42, 50 42"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.6s ease-out ${delayMs + 450}ms forwards`,
        }}
      />
    </svg>
  );
}

function SparkleDoodle({ className, delayMs }: { className?: string; delayMs: number }) {
  return (
    <svg
      viewBox="0 0 70 70"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M35 4 C 33 20, 32 30, 35 34 C 38 30, 39 20, 35 4"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.5s ease-out ${delayMs}ms forwards`,
        }}
      />
      <path
        d="M35 66 C 37 50, 38 40, 35 36 C 32 40, 31 50, 35 66"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.5s ease-out ${delayMs + 120}ms forwards`,
        }}
      />
      <path
        d="M4 35 C 20 33, 30 32, 34 35 C 30 38, 20 39, 4 35"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.5s ease-out ${delayMs + 240}ms forwards`,
        }}
      />
      <path
        d="M66 35 C 50 37, 40 38, 36 35 C 40 32, 50 31, 66 35"
        style={{
          strokeDasharray: DOODLE_STROKE,
          strokeDashoffset: DOODLE_STROKE,
          animation: `doodle-draw 0.5s ease-out ${delayMs + 360}ms forwards`,
        }}
      />
    </svg>
  );
}

export default function Concept07HandDrawnJourney() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-16"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      {/* Scoped font import for the hand-lettered callout only — does not touch global CSS */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap"
      />

      <style>{`
        @keyframes doodle-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes form-settle {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .concept07-form-settle {
          animation: form-settle 0.4s ease-out 550ms forwards;
          opacity: 0;
        }
        .concept07-callout {
          font-family: "Caveat", cursive;
        }
      `}</style>

      {/* Scattered doodles — positioned around the form, not overlapping it */}
      <ArrowDoodle
        className="pointer-events-none absolute left-[6%] top-[14%] hidden h-24 w-40 -rotate-6 text-stone-500/70 sm:block md:left-[10%]"
        delayMs={0}
      />
      <div className="pointer-events-none absolute left-[6%] top-[6%] hidden -rotate-2 sm:block md:left-[11%]">
        <span className="concept07-callout text-3xl text-stone-600/80">ready to launch?</span>
      </div>

      <ChartDoodle
        className="pointer-events-none absolute bottom-[10%] left-[8%] hidden h-20 w-32 rotate-3 text-stone-500/70 md:block"
        delayMs={280}
      />

      <TargetDoodle
        className="pointer-events-none absolute right-[8%] top-[16%] hidden h-20 w-20 rotate-2 text-stone-500/70 sm:block md:right-[12%]"
        delayMs={560}
      />

      <SparkleDoodle
        className="pointer-events-none absolute bottom-[14%] right-[10%] hidden h-14 w-14 text-stone-500/70 sm:block md:right-[14%]"
        delayMs={840}
      />

      {/* Form — no card wrapper, settles in after the scene draws */}
      <div className="concept07-form-settle relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-800">{copy.heading}</h1>
          <p className="mt-2 text-sm text-stone-500">{copy.subheading}</p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="concept07-email" className="text-sm font-medium text-stone-700">
              {copy.emailLabel}
            </label>
            <input
              id="concept07-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              className="w-full rounded-md border border-stone-300 bg-white/70 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-400/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="concept07-password" className="text-sm font-medium text-stone-700">
              {copy.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="concept07-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={copy.passwordPlaceholder}
                className="w-full rounded-md border border-stone-300 bg-white/70 px-3.5 py-2.5 pr-10 text-sm text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-400/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 transition hover:text-stone-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-stone-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-stone-400 text-stone-700 focus:ring-stone-400/40"
              />
              {copy.rememberLabel}
            </label>
            <a href="#" className="font-medium text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline">
              {copy.forgotLabel}
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            {copy.submitLabel}
          </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-stone-400">
            <span className="h-px flex-1 bg-stone-300" />
            {copy.dividerLabel}
            <span className="h-px flex-1 bg-stone-300" />
          </div>

          <button
            type="button"
            className="w-full rounded-md border border-stone-300 bg-white/70 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-white"
          >
            {copy.googleLabel}
          </button>

          <p className="text-center text-sm text-stone-500">
            {copy.signupPromptLabel}{" "}
            <a href="#" className="font-medium text-stone-700 underline-offset-2 hover:underline">
              {copy.signupLinkLabel}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
