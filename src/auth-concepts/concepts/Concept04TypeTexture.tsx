import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";

const COPY = AUTH_CONCEPT_COPY;

export default function Concept04TypeTexture() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdfaf5]">
      <style>{`
        @keyframes tt-ghost-drift {
          0% { transform: translateX(-2%); }
          50% { transform: translateX(2%); }
          100% { transform: translateX(-2%); }
        }
        .tt-ghost-drift {
          animation: tt-ghost-drift 22s ease-in-out infinite;
        }
        @keyframes tt-card-settle {
          0% {
            opacity: 0;
            transform: translate(-50%, -46%) rotate(-3deg) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(-1.25deg) scale(1);
          }
        }
        .tt-card-settle {
          animation: tt-card-settle 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Color block — left ~55% */}
      <div className="absolute inset-y-0 left-0 z-0 w-[55%] bg-[#e3402b]" />
      {/* Light zone — remaining right side */}
      <div className="absolute inset-y-0 right-0 z-0 w-[45%] bg-[#fdfaf5]" />

      {/* Oversized ghost typography, drifting, sits above the color block but under the card */}
      <div
        aria-hidden="true"
        className="tt-ghost-drift pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden"
      >
        <span
          className="select-none whitespace-nowrap font-black leading-none tracking-tight text-[#fdfaf5]"
          style={{
            fontSize: "clamp(180px, 26vw, 300px)",
            opacity: 0.16,
            WebkitTextStroke: "2px rgba(253,250,245,0.5)",
          }}
        >
          SIGN IN
        </span>
      </div>

      {/* Decorative ring on the light side, partially off-screen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-24 z-[1] h-[420px] w-[420px] rounded-full border-[3px] border-[#e3402b]/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-10 z-[1] h-[220px] w-[220px] rounded-full border-2 border-[#1a1a1a]/10"
      />

      {/* Card — straddles the seam between color block and light zone */}
      <div
        className="tt-card-settle absolute left-[58%] top-1/2 z-10 w-full max-w-md rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] sm:p-10"
      >
        <div className="mb-8">
          <span className="mb-3 inline-block rounded-full bg-[#e3402b]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e3402b]">
            FabAds
          </span>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1a1a1a]">
            {COPY.heading}
          </h1>
          <p className="mt-2 text-sm text-[#1a1a1a]/55">{COPY.subheading}</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tt-email"
              className="text-xs font-bold uppercase tracking-wide text-[#1a1a1a]/50"
            >
              {COPY.emailLabel}
            </label>
            <input
              id="tt-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={COPY.emailPlaceholder}
              className="w-full border-b-2 border-[#1a1a1a]/15 bg-transparent px-1 py-2 text-sm font-medium text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/30 focus:border-[#e3402b]"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tt-password"
              className="text-xs font-bold uppercase tracking-wide text-[#1a1a1a]/50"
            >
              {COPY.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="tt-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={COPY.passwordPlaceholder}
                className="w-full border-b-2 border-[#1a1a1a]/15 bg-transparent px-1 py-2 pr-9 text-sm font-medium text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/30 focus:border-[#e3402b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 transition hover:text-[#e3402b]"
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
            <label className="flex items-center gap-2 text-xs font-medium text-[#1a1a1a]/60">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#1a1a1a]/25 accent-[#e3402b]"
              />
              {COPY.rememberLabel}
            </label>
            <button
              type="button"
              className="text-xs font-medium text-[#1a1a1a]/60 underline-offset-2 transition hover:text-[#e3402b] hover:underline"
            >
              {COPY.forgotLabel}
            </button>
          </div>

          {/* Submit — bold rounded-full pill */}
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-[#e3402b] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_24px_-6px_rgba(227,64,43,0.55)] transition hover:bg-[#c9321f]"
          >
            {COPY.submitLabel}
          </button>

          {/* Divider */}
          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1a1a1a]/10" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a]/35">
              {COPY.dividerLabel}
            </span>
            <div className="h-px flex-1 bg-[#1a1a1a]/10" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1a1a1a]/10 bg-white py-3 text-sm font-bold text-[#1a1a1a] transition hover:border-[#1a1a1a]/25"
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

          <p className="mt-2 text-center text-xs font-medium text-[#1a1a1a]/50">
            {COPY.signupPromptLabel}{" "}
            <button
              type="button"
              className="font-bold text-[#1a1a1a] underline-offset-2 hover:text-[#e3402b] hover:underline"
            >
              {COPY.signupLinkLabel}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
