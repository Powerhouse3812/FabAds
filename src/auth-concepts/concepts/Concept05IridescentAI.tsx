import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";

const COPY = AUTH_CONCEPT_COPY;

const AVATARS = [
  { initials: "RA", bg: "#7c3aed" },
  { initials: "MK", bg: "#0ea5a3" },
  { initials: "SJ", bg: "#db2777" },
  { initials: "PT", bg: "#d97706" },
];

export default function Concept05IridescentAI() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="relative flex min-h-screen items-stretch bg-[#0a0a0a]">
      <style>{`
        @keyframes iridescent-hue-cycle {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .iridescent-hue-layer {
          animation: iridescent-hue-cycle 16s linear infinite;
        }
        @keyframes iridescent-drift {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-3%, 2%) scale(1.05); }
        }
        .iridescent-drift {
          animation: iridescent-drift 14s ease-in-out infinite;
        }
        .iridescent-cta {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .iridescent-cta::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #ccff33;
          transform: translateX(-105%);
          transition: transform 380ms cubic-bezier(0.65, 0, 0.35, 1);
          z-index: 0;
        }
        .iridescent-cta:hover::before {
          transform: translateX(0%);
        }
        .iridescent-cta-arrow {
          transition: transform 320ms cubic-bezier(0.65, 0, 0.35, 1);
        }
        .iridescent-cta:hover .iridescent-cta-arrow {
          transform: rotate(45deg);
        }
      `}</style>

      {/* Left: holographic hero */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* dark base */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />

        {/* iridescent gradient stack — hue-shifts as a unit */}
        <div className="iridescent-hue-layer absolute inset-0">
          <div
            className="iridescent-drift absolute inset-[-20%]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 25%, rgba(45,212,191,0.55) 0%, rgba(45,212,191,0) 45%), radial-gradient(circle at 80% 20%, rgba(217,70,239,0.5) 0%, rgba(217,70,239,0) 50%), conic-gradient(from 90deg at 60% 70%, rgba(124,58,237,0.6), rgba(245,158,11,0.5), rgba(45,212,191,0.5), rgba(217,70,239,0.5), rgba(124,58,237,0.6))",
              mixBlendMode: "screen",
            }}
          />
          <div
            className="absolute inset-[-10%]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 70% 80%, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0) 40%), radial-gradient(circle at 30% 90%, rgba(124,58,237,0.4) 0%, rgba(124,58,237,0) 45%)",
              mixBlendMode: "overlay",
            }}
          />
        </div>

        {/* vignette so edges + card zones stay readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.55)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* headline */}
        <div className="absolute left-10 top-12 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            FabAds
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
            Ads that write, launch, and optimize themselves.
          </h2>
        </div>

        {/* floating avatar-stack card */}
        <div className="absolute bottom-12 left-10 right-10 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {AVATARS.map((a, i) => (
                <div
                  key={a.initials}
                  style={{ backgroundColor: a.bg, zIndex: AVATARS.length - i }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black/60 text-[10px] font-semibold text-white"
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/85">
              <span className="font-semibold text-white">4,500+</span>{" "}
              marketers already in
            </p>
          </div>

          <button
            type="button"
            aria-label="Learn more"
            className="iridescent-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10"
          >
            <ArrowUpRight
              className="iridescent-cta-arrow relative z-10 h-[18px] w-[18px] text-white"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Right: glassy form */}
      <div className="relative flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        {/* faint ambient glow behind the form so the dark side isn't flat */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,0.12)_0%,rgba(10,10,10,0)_55%)]" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {COPY.heading}
            </h1>
            <p className="mt-2 text-sm text-white/55">{COPY.subheading}</p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-4"
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="iridescent-email"
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
                  id="iridescent-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={COPY.emailPlaceholder}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-10 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-white/[0.1]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="iridescent-password"
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
                  id="iridescent-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={COPY.passwordPlaceholder}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-10 py-2.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-md transition focus:border-white/40 focus:bg-white/[0.1]"
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
                  className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 accent-[#ccff33]"
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

            {/* Submit — neon pill */}
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-[#ccff33] py-2.5 text-sm font-semibold text-[#0a0a0a] shadow-[0_4px_24px_rgba(204,255,51,0.35)] transition hover:bg-[#d9ff5c]"
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
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
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
    </div>
  );
}
