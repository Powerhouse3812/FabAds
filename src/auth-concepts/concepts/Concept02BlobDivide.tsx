import { useState } from "react";
import { Eye, EyeOff, Radio, Sparkles, ShieldCheck } from "lucide-react";
import { AUTH_CONCEPT_COPY as copy } from "@/auth-concepts/shared/formSpec";

/**
 * Concept 02 — "Blob divide": organic split.
 *
 * Split-screen login where the illustration panel's edge is a hand-authored
 * blob (via clip-path polygon), not a straight line — it bleeds irregularly
 * into the form side. The blob gently "breathes" and three annotated
 * callout pins float in on mount, then drift slowly and asynchronously.
 */

interface CalloutPin {
  id: string;
  label: string;
  dotClass: string;
  top: string;
  left: string;
  lineWidth: string;
  lineRotate: string;
  delayMs: number;
  floatDelayMs: number;
  Icon: typeof Sparkles;
}

const PINS: CalloutPin[] = [
  {
    id: "live",
    label: "Live campaigns",
    dotClass: "bg-emerald-300",
    top: "22%",
    left: "58%",
    lineWidth: "38px",
    lineRotate: "-18deg",
    delayMs: 150,
    floatDelayMs: 0,
    Icon: Radio,
  },
  {
    id: "auto",
    label: "Auto-optimized",
    dotClass: "bg-teal-200",
    top: "48%",
    left: "16%",
    lineWidth: "30px",
    lineRotate: "12deg",
    delayMs: 380,
    floatDelayMs: 900,
    Icon: Sparkles,
  },
  {
    id: "monitor",
    label: "24/7 monitoring",
    dotClass: "bg-lime-200",
    top: "74%",
    left: "44%",
    lineWidth: "34px",
    lineRotate: "-8deg",
    delayMs: 610,
    floatDelayMs: 1700,
    Icon: ShieldCheck,
  },
];

export default function Concept02BlobDivide() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#f4f1ea]">
      <style>{`
        @keyframes blobdivide-breathe {
          0%, 100% { transform: scale(1) translateX(0); }
          50% { transform: scale(1.035) translateX(-1%); }
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
        .blobdivide-shape {
          animation: blobdivide-breathe 7s ease-in-out infinite;
        }
        .blobdivide-pin {
          opacity: 0;
          animation: blobdivide-pin-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .blobdivide-pin-float-a { animation-name: blobdivide-pin-in, blobdivide-float-a; }
        .blobdivide-pin-float-b { animation-name: blobdivide-pin-in, blobdivide-float-b; }
        .blobdivide-pin-float-c { animation-name: blobdivide-pin-in, blobdivide-float-c; }
      `}</style>

      {/* Illustration side — organic blob boundary via clip-path */}
      <div className="relative hidden w-[56%] shrink-0 lg:block">
        <div
          className="blobdivide-shape absolute -inset-x-10 -inset-y-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700"
          style={{
            clipPath:
              "polygon(0% 0%, 78% 0%, 84% 6%, 79% 14%, 91% 20%, 100% 28%, 94% 38%, 100% 48%, 88% 56%, 96% 66%, 85% 74%, 92% 84%, 78% 90%, 82% 100%, 0% 100%)",
          }}
        />

        {/* subtle inner glow / texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="text-lg font-semibold tracking-tight">FabAds</div>
          <div className="max-w-sm">
            <h2 className="text-3xl font-semibold leading-tight">
              Every campaign, one calm surface.
            </h2>
            <p className="mt-3 text-sm text-white/80">
              Launch, monitor, and optimize across every platform without
              leaving the room.
            </p>
          </div>
          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} FabAds — a product moment.
          </div>
        </div>

        {/* Annotated callout pins */}
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
              className={`blobdivide-pin ${floatClass} absolute z-20`}
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
                className="absolute right-full top-1/2 h-px bg-white/50"
                style={{
                  width: pin.lineWidth,
                  transform: `rotate(${pin.lineRotate})`,
                  transformOrigin: "right center",
                }}
              />
              <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-lg shadow-black/10">
                <span className={`h-2 w-2 rounded-full ${pin.dotClass}`} />
                <pin.Icon className="h-3 w-3 text-emerald-700" />
                <span className="text-xs font-medium text-neutral-800">
                  {pin.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {copy.heading}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">{copy.subheading}</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div>
              <label
                htmlFor="blobdivide-email"
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                {copy.emailLabel}
              </label>
              <input
                id="blobdivide-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy.emailPlaceholder}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              />
            </div>

            <div>
              <label
                htmlFor="blobdivide-password"
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                {copy.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="blobdivide-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-600"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-400/40"
                />
                {copy.rememberLabel}
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                {copy.forgotLabel}
              </a>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              {copy.submitLabel}
            </button>

            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                {copy.dividerLabel}
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            >
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
              {copy.googleLabel}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            {copy.signupPromptLabel}{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              {copy.signupLinkLabel}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
