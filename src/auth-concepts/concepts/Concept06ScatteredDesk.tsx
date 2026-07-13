import { useState, useRef, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, TrendingUp, Target, Play, Tag, BarChart3, Sparkles, Video } from "lucide-react";
import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";

const COPY = AUTH_CONCEPT_COPY;

/**
 * Concept 06 — "Scattered desk": cardless collage.
 * The form floats bare on a plain light page; 8 tilted "desk object" cards
 * are scattered near the viewport edges. Each idles with its own bob
 * animation and responds to page-level mouse movement with a subtle,
 * per-object parallax depth offset.
 */

interface ScatterObject {
  id: string;
  // positioning — pick 2 of these per item, near an edge/corner
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number; // degrees, hardcoded varied values
  size: string; // tailwind width class
  bobDuration: string; // seconds
  bobDelay: string; // seconds
  bobAmplitude: number; // px
  parallaxStrength: number; // depth multiplier — px of travel at max mouse offset
  content: React.ReactNode;
}

const SCATTER_OBJECTS: ScatterObject[] = [
  {
    id: "ctr",
    top: "8%",
    left: "6%",
    rotate: -9,
    size: "w-[132px]",
    bobDuration: "5.2s",
    bobDelay: "0s",
    bobAmplitude: 8,
    parallaxStrength: 10,
    content: (
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            CTR
          </span>
        </div>
        <p className="text-sm font-bold text-slate-800">+12.4%</p>
        <div className="flex h-4 items-end gap-0.5">
          {[3, 6, 5, 9, 7, 11].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm bg-emerald-400"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "badge-percent",
    top: "14%",
    right: "8%",
    rotate: 7,
    size: "w-[104px]",
    bobDuration: "6.1s",
    bobDelay: "0.6s",
    bobAmplitude: 7,
    parallaxStrength: 16,
    content: (
      <div className="flex flex-col items-center justify-center gap-0.5 rounded-full p-4">
        <span className="text-lg font-bold text-white">98%</span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-white/80">
          Match rate
        </span>
      </div>
    ),
  },
  {
    id: "campaign-live",
    bottom: "10%",
    left: "5%",
    rotate: 5,
    size: "w-[148px]",
    bobDuration: "4.6s",
    bobDelay: "1.1s",
    bobAmplitude: 9,
    parallaxStrength: 6,
    content: (
      <div className="flex items-center gap-2 p-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500" />
        </span>
        <Tag className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-700">
          Campaign live
        </span>
      </div>
    ),
  },
  {
    id: "video-play",
    bottom: "16%",
    right: "6%",
    rotate: -6,
    size: "w-[120px]",
    bobDuration: "5.8s",
    bobDelay: "0.3s",
    bobAmplitude: 6,
    parallaxStrength: 14,
    content: (
      <div className="flex flex-col items-center gap-1.5 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500">
          <Play className="h-4 w-4 fill-white text-white" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-medium text-slate-500">
          Video ad
        </span>
      </div>
    ),
  },
  {
    id: "target",
    top: "42%",
    left: "3%",
    rotate: -11,
    size: "w-[108px]",
    bobDuration: "7s",
    bobDelay: "1.6s",
    bobAmplitude: 10,
    parallaxStrength: 8,
    content: (
      <div className="flex flex-col items-center gap-1 p-3">
        <Target className="h-6 w-6 text-orange-500" aria-hidden="true" />
        <span className="text-[10px] font-medium text-slate-500">
          Audience hit
        </span>
      </div>
    ),
  },
  {
    id: "reach",
    top: "48%",
    right: "4%",
    rotate: 10,
    size: "w-[128px]",
    bobDuration: "4.9s",
    bobDelay: "0.9s",
    bobAmplitude: 8,
    parallaxStrength: 12,
    content: (
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-indigo-500">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Reach
          </span>
        </div>
        <p className="text-sm font-bold text-slate-800">2.1M</p>
      </div>
    ),
  },
  {
    id: "ai-suggest",
    bottom: "3%",
    left: "34%",
    rotate: -4,
    size: "w-[136px]",
    bobDuration: "6.5s",
    bobDelay: "2s",
    bobAmplitude: 7,
    parallaxStrength: 18,
    content: (
      <div className="flex items-center gap-2 p-3">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-700">
          Genie found a hook
        </span>
      </div>
    ),
  },
  {
    id: "creative-slot",
    top: "3%",
    left: "58%",
    rotate: 8,
    size: "w-[96px]",
    bobDuration: "5.4s",
    bobDelay: "1.3s",
    bobAmplitude: 6,
    parallaxStrength: 20,
    content: (
      <div className="flex flex-col items-center gap-1 p-2.5">
        <Video className="h-5 w-5 text-sky-500" aria-hidden="true" />
        <span className="text-[9px] font-medium text-slate-500">
          3 new assets
        </span>
      </div>
    ),
  },
];

export default function Concept06ScatteredDesk() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 }); // -1..1 range, relative to viewport center
  const frameRef = useRef<number | null>(null);
  const latestEvent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: globalThis.MouseEvent) => {
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fafaf7]">
      <style>{`
        @keyframes scatter-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(var(--bob-amplitude, -8px)); }
        }
        .scatter-bob {
          animation-name: scatter-bob;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>

      {/* Scattered decorative objects — near edges/corners only */}
      {SCATTER_OBJECTS.map((obj) => {
        const parallaxX = mouse.x * obj.parallaxStrength;
        const parallaxY = mouse.y * obj.parallaxStrength;
        return (
          <div
            key={obj.id}
            aria-hidden="true"
            className="pointer-events-none absolute z-0"
            style={{
              top: obj.top,
              bottom: obj.bottom,
              left: obj.left,
              right: obj.right,
              transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
              transition: "transform 120ms ease-out",
            }}
          >
            <div
              className={`scatter-bob ${obj.size} rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${obj.id === "badge-percent" ? "bg-gradient-to-br from-fuchsia-500 to-orange-400 border-0" : ""}`}
              style={
                {
                  transform: `rotate(${obj.rotate}deg)`,
                  animationDuration: obj.bobDuration,
                  animationDelay: obj.bobDelay,
                  "--bob-amplitude": `-${obj.bobAmplitude}px`,
                } as React.CSSProperties
              }
            >
              {obj.content}
            </div>
          </div>
        );
      })}

      {/* Centered, cardless form */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {COPY.heading} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">{COPY.subheading}</p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col gap-4"
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="scatter-email"
                className="text-xs font-medium text-slate-600"
              >
                {COPY.emailLabel}
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="scatter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={COPY.emailPlaceholder}
                  className="w-full rounded-full border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="scatter-password"
                className="text-xs font-medium text-slate-600"
              >
                {COPY.passwordLabel}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="scatter-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={COPY.passwordPlaceholder}
                  className="w-full rounded-full border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
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
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-900"
                />
                {COPY.rememberLabel}
              </label>
              <button
                type="button"
                className="text-xs text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline"
              >
                {COPY.forgotLabel}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(15,23,42,0.2)] transition hover:bg-slate-800"
            >
              {COPY.submitLabel}
            </button>

            {/* Divider */}
            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                {COPY.dividerLabel}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
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

            <p className="mt-4 text-center text-xs text-slate-500">
              {COPY.signupPromptLabel}{" "}
              <button
                type="button"
                className="font-medium text-slate-900 underline-offset-2 hover:underline"
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
