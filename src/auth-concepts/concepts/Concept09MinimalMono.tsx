import { useRef, useState, type MouseEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";

const COPY = AUTH_CONCEPT_COPY;

/** Magnetic hover: how far the submit button is allowed to drift toward the
 *  cursor. Kept tiny on purpose — this is a "quiet luxury" concept, the
 *  button should never visibly detach from its neighbours. */
const MAGNETIC_MAX_OFFSET = 7;
const MAGNETIC_STRENGTH = 0.28;

export default function Concept09MinimalMono() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });
  const submitRef = useRef<HTMLButtonElement>(null);

  const clamp = (value: number) =>
    Math.max(-MAGNETIC_MAX_OFFSET, Math.min(MAGNETIC_MAX_OFFSET, value));

  const handleMagneticMove = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = submitRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    setMagnet({
      x: clamp(dx * MAGNETIC_STRENGTH),
      y: clamp(dy * MAGNETIC_STRENGTH),
    });
  };

  const resetMagnetic = () => setMagnet({ x: 0, y: 0 });

  return (
    <div className="mono-page-fade flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-20">
      <style>{`
        @keyframes mono-fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .mono-page-fade {
          animation: mono-fade-up 520ms ease-out both;
        }
        .mono-input {
          transition: box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
        }
        .mono-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.26);
          background-color: rgba(255, 255, 255, 0.03);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05), 0 0 24px rgba(255, 255, 255, 0.08);
        }
        .mono-magnetic {
          transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
      `}</style>

      <div className="w-full max-w-sm">
        {/* Heading */}
        <div className="mb-14 text-center">
          <h1 className="text-2xl font-medium tracking-tight text-white">
            {COPY.heading}
          </h1>
          <p className="mt-3 text-sm text-white/45">{COPY.subheading}</p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-8"
        >
          {/* Email */}
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="mono-email"
              className="text-xs font-medium text-white/45"
            >
              {COPY.emailLabel}
            </label>
            <input
              id="mono-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={COPY.emailPlaceholder}
              className="mono-input w-full rounded-md border border-white/10 bg-white/[0.015] px-4 py-3 text-sm text-white placeholder:text-white/25"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="mono-password"
              className="text-xs font-medium text-white/45"
            >
              {COPY.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="mono-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={COPY.passwordPlaceholder}
                className="mono-input w-full rounded-md border border-white/10 bg-white/[0.015] px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/75"
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

          {/* Remember + forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-white/45">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.02] accent-white"
              />
              {COPY.rememberLabel}
            </label>
            <button
              type="button"
              className="text-xs text-white/45 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              {COPY.forgotLabel}
            </button>
          </div>

          {/* Submit — magnetic hover, highest-contrast surface on the page */}
          <button
            ref={submitRef}
            type="submit"
            onMouseMove={handleMagneticMove}
            onMouseLeave={resetMagnetic}
            style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)` }}
            className="mono-magnetic mt-2 w-full rounded-md bg-white py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-white/90"
          >
            {COPY.submitLabel}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wide text-white/30">
              {COPY.dividerLabel}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google — same footprint as submit, ghost/outline treatment */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-white/10 bg-transparent py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
          >
            <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"
              />
              <path
                fill="#4CAF50"
                d="M24 45.5c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2 1.4-4.6 2.1-7.6 2.1-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 40.9 16.2 45.5 24 45.5z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.4 36 44.5 31 44.5 25c0-1.5-.2-3-.9-4.5z"
              />
            </svg>
            {COPY.googleLabel}
          </button>
        </form>

        {/* Signup prompt */}
        <p className="mt-9 text-center text-sm text-white/45">
          {COPY.signupPromptLabel}{" "}
          <button
            type="button"
            className="font-medium text-white underline-offset-2 hover:underline"
          >
            {COPY.signupLinkLabel}
          </button>
        </p>

        {/* Social proof — quiet, small-caps feel */}
        <p className="mt-12 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-white/25">
          Trusted by 1,200+ performance marketers
        </p>
      </div>
    </div>
  );
}
