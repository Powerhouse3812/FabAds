import { useState } from "react";
import { Eye, EyeOff, TrendingUp, Gauge, Rocket } from "lucide-react";
import { AUTH_CONCEPT_COPY as copy } from "@/auth-concepts/shared/formSpec";

/**
 * Concept 10 — "Nature split": annotated photo + live stats.
 *
 * Split-screen login where the "photo" side is a rounded inset panel — a
 * card floating within its half of the viewport, margin visible on all
 * sides, rather than a full-bleed image. The panel fakes an aspirational
 * campaign-performance scene with layered gradients + soft bar-chart
 * silhouettes, and carries three annotated pin callouts with invented
 * metrics ("+24% CTR", "3.2x ROAS", "500+ launches"). The headline on the
 * form side carries a highlighter-marker reveal behind one keyword.
 */

interface CalloutPin {
  id: string;
  label: string;
  dotClass: string;
  top: string;
  left: string;
  lineLength: string;
  lineRotate: string;
  pinSide: "left" | "right";
  delayMs: number;
  Icon: typeof TrendingUp;
}

const PINS: CalloutPin[] = [
  {
    id: "ctr",
    label: "+24% CTR",
    dotClass: "bg-[#baff29]",
    top: "16%",
    left: "62%",
    lineLength: "34px",
    lineRotate: "-22deg",
    pinSide: "right",
    delayMs: 200,
    Icon: TrendingUp,
  },
  {
    id: "roas",
    label: "3.2x ROAS",
    dotClass: "bg-sky-300",
    top: "46%",
    left: "12%",
    lineLength: "30px",
    lineRotate: "16deg",
    pinSide: "left",
    delayMs: 400,
    Icon: Gauge,
  },
  {
    id: "launches",
    label: "500+ launches",
    dotClass: "bg-violet-300",
    top: "76%",
    left: "48%",
    lineLength: "32px",
    lineRotate: "-10deg",
    pinSide: "right",
    delayMs: 600,
    Icon: Rocket,
  },
];

export default function Concept10NatureSplit() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full bg-[#f6f5f2]">
      <style>{`
        @keyframes naturesplit-pin-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.82); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes naturesplit-pin-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }
        .naturesplit-pin {
          opacity: 0;
          animation: naturesplit-pin-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
            naturesplit-pin-pulse 3.6s ease-in-out infinite;
        }
        .naturesplit-pin-body {
          animation: naturesplit-pin-pulse 3.6s ease-in-out infinite;
        }
        @keyframes naturesplit-highlight-paint {
          0% { transform: rotate(-1.5deg) scaleX(0); }
          100% { transform: rotate(-1.5deg) scaleX(1); }
        }
        .naturesplit-highlight-mark {
          transform-origin: left center;
          animation: naturesplit-highlight-paint 0.55s ease-out forwards;
          animation-delay: 200ms;
        }
        @keyframes naturesplit-bar-rise {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.06); }
        }
        .naturesplit-bar {
          animation: naturesplit-bar-rise 6s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>

      {/* Illustration side — rounded inset panel, not full-bleed */}
      <div className="relative hidden w-1/2 shrink-0 items-center justify-center p-8 lg:flex">
        <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1c1440] via-[#2a1f6b] to-[#4c2f8f] shadow-2xl">
          {/* soft abstract glow shapes */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#7c5cff]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-[-10%] h-72 w-72 rounded-full bg-[#baff29]/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.14),transparent_55%)]" />

          {/* faux bar-chart silhouettes suggesting a performance scene */}
          <div className="pointer-events-none absolute bottom-16 left-1/2 flex h-40 -translate-x-1/2 items-end gap-3 opacity-40">
            {[38, 62, 46, 80, 58, 70, 44].map((h, i) => (
              <div
                key={i}
                className="naturesplit-bar w-4 rounded-t-md bg-white/70"
                style={{ height: `${h}%`, animationDelay: `${i * 0.35}s` }}
              />
            ))}
          </div>

          {/* brand mark + copy */}
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="text-lg font-semibold tracking-tight">FabAds</div>
            <div className="max-w-sm">
              <h2 className="text-2xl font-semibold leading-snug">
                Every launch, a little smarter.
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Real performance, surfaced live — not buried in a report you
                open once a week.
              </p>
            </div>
            <div className="text-xs text-white/50">
              © {new Date().getFullYear()} FabAds
            </div>
          </div>

          {/* Annotated callout pins */}
          {PINS.map((pin) => {
            const isRight = pin.pinSide === "right";
            return (
              <div
                key={pin.id}
                className="absolute z-20"
                style={{ top: pin.top, left: pin.left }}
              >
                {/* connector line */}
                <div
                  className="absolute top-1/2 h-px bg-white/50"
                  style={{
                    width: pin.lineLength,
                    left: isRight ? "100%" : undefined,
                    right: isRight ? undefined : "100%",
                    transform: `rotate(${pin.lineRotate})`,
                    transformOrigin: isRight ? "left center" : "right center",
                  }}
                />
                {/* anchor dot on the panel */}
                <span
                  className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${pin.dotClass}`}
                  style={{ left: isRight ? "-1px" : "-9px" }}
                />
                {/* pill badge, offset along the connector */}
                <div
                  className="naturesplit-pin absolute"
                  style={{
                    top: "-14px",
                    left: isRight
                      ? `calc(${pin.lineLength} + 6px)`
                      : `calc(-1 * (${pin.lineLength} + 6px))`,
                    animationDelay: `${pin.delayMs}ms, ${pin.delayMs + 500}ms`,
                  }}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 shadow-lg">
                    <span className={`h-1.5 w-1.5 rounded-full ${pin.dotClass}`} />
                    <pin.Icon className="h-3 w-3 text-[#1c1440]/70" />
                    <span className="text-xs font-semibold text-[#1c1440]">
                      {pin.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form side */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1c1440]">
            Welcome{" "}
            <span className="relative z-0 inline-block px-0.5">
              <span
                className="naturesplit-highlight-mark absolute inset-y-1 left-0 -z-10 w-full rounded-[6px] bg-[#baff29]/70"
                aria-hidden="true"
              />
              <span className="relative z-10">back</span>
            </span>
          </h1>
          <p className="mt-2 text-sm text-[#1c1440]/60">
            {copy.subheading}
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="nature-split-email"
                className="text-xs font-medium text-[#1c1440]/70"
              >
                {copy.emailLabel}
              </label>
              <input
                id="nature-split-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                className="w-full rounded-xl border border-[#1c1440]/10 bg-white px-4 py-2.5 text-sm text-[#1c1440] outline-none transition-colors placeholder:text-[#1c1440]/35 focus:border-[#7c5cff]/50 focus:ring-2 focus:ring-[#7c5cff]/15"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="nature-split-password"
                className="text-xs font-medium text-[#1c1440]/70"
              >
                {copy.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="nature-split-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  className="w-full rounded-xl border border-[#1c1440]/10 bg-white px-4 py-2.5 pr-10 text-sm text-[#1c1440] outline-none transition-colors placeholder:text-[#1c1440]/35 focus:border-[#7c5cff]/50 focus:ring-2 focus:ring-[#7c5cff]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1c1440]/40 hover:text-[#1c1440]/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#1c1440]/70">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#1c1440]/20 text-[#7c5cff] focus:ring-[#7c5cff]/30"
                />
                {copy.rememberLabel}
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="font-medium text-[#7c5cff] hover:text-[#5c3fd6]"
              >
                {copy.forgotLabel}
              </a>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#1c1440] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2a1f6b]"
            >
              {copy.submitLabel}
            </button>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-[#1c1440]/10" />
              <span className="text-xs text-[#1c1440]/40">
                {copy.dividerLabel}
              </span>
              <div className="h-px flex-1 bg-[#1c1440]/10" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1c1440]/10 bg-white py-2.5 text-sm font-medium text-[#1c1440] transition-colors hover:bg-[#1c1440]/5"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.24v3.09C3.2 21.3 7.26 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29a7.15 7.15 0 010-4.58V6.62H1.24a11.93 11.93 0 000 10.76l4.03-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.43-3.43C17.94 1.19 15.24 0 12 0 7.26 0 3.2 2.7 1.24 6.62l4.03 3.09C6.22 6.86 8.87 4.75 12 4.75z"
                />
              </svg>
              {copy.googleLabel}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#1c1440]/60">
            {copy.signupPromptLabel}{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-semibold text-[#7c5cff] hover:text-[#5c3fd6]"
            >
              {copy.signupLinkLabel}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
