import { useState, useRef, type MouseEvent } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";

const COPY = AUTH_CONCEPT_COPY;

export default function Concept01Spotlight() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const MAX_DEG = 6;
    const rotateY = (px - 0.5) * 2 * MAX_DEG;
    const rotateX = -(py - 0.5) * 2 * MAX_DEG;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0c12] px-4 py-12">
      <style>{`
        @keyframes spotlight-glow-pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .spotlight-glow-pulse {
          animation: spotlight-glow-pulse 5s ease-in-out infinite;
        }
      `}</style>

      {/* Layered background: dark base + warm spotlight glow + vignette */}
      <div className="pointer-events-none absolute inset-0">
        {/* base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#1a1d29_0%,#0a0c12_55%,#05060a_100%)]" />
        {/* warm glow, upper-center, breathing */}
        <div
          className="spotlight-glow-pulse absolute left-1/2 top-[-10%] h-[70%] w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,191,110,0.35)_0%,rgba(255,161,66,0.16)_35%,rgba(255,161,66,0)_70%)] blur-2xl"
        />
        {/* tighter hot core of the light */}
        <div className="absolute left-1/2 top-[2%] h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,214,160,0.28)_0%,rgba(255,214,160,0)_70%)] blur-xl" />
        {/* vignette at edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      {/* Glass card, tilts toward cursor */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 200ms ease-out",
        }}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {COPY.heading}
          </h1>
          <p className="mt-2 text-sm text-white/60">{COPY.subheading}</p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4"
        >
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="spotlight-email"
              className="text-xs font-medium text-white/70"
            >
              {COPY.emailLabel}
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                aria-hidden="true"
              />
              <input
                id="spotlight-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={COPY.emailPlaceholder}
                className="w-full rounded-full border border-white/15 bg-white/10 px-10 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/40 focus:bg-white/15"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="spotlight-password"
              className="text-xs font-medium text-white/70"
            >
              {COPY.passwordLabel}
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                aria-hidden="true"
              />
              <input
                id="spotlight-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={COPY.passwordPlaceholder}
                className="w-full rounded-full border border-white/15 bg-white/10 px-10 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/40 focus:bg-white/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/80"
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
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 accent-[#ffb46b]"
              />
              {COPY.rememberLabel}
            </label>
            <button
              type="button"
              className="text-xs text-white/60 underline-offset-2 transition hover:text-white hover:underline"
            >
              {COPY.forgotLabel}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-white py-2.5 text-sm font-semibold text-[#0a0c12] shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition hover:bg-white/90"
          >
            {COPY.submitLabel}
          </button>

          {/* Divider */}
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-[11px] uppercase tracking-wide text-white/40">
              {COPY.dividerLabel}
            </span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
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

          <p className="mt-4 text-center text-xs text-white/50">
            {COPY.signupPromptLabel}{" "}
            <button
              type="button"
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              {COPY.signupLinkLabel}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
