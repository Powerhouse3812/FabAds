import { useMemo, useState } from "react";
import { Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react";

import { AUTH_CONCEPT_COPY } from "@/auth-concepts/shared/formSpec";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const copy = AUTH_CONCEPT_COPY;

/** Derive a friendly display name from the email's local part.
 *  "jane.doe@x.com" -> "Jane doe" (dots/underscores/dashes become spaces,
 *  the whole thing is lowercased, then only the very first letter is
 *  capitalized — matches the concept spec's example exactly). */
function deriveDisplayName(email: string): string | null {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return null; // no "@" yet, or nothing before it

  const localPart = email.slice(0, atIndex);
  const cleaned = localPart.replace(/[._-]+/g, " ").trim().toLowerCase();
  if (!cleaned) return null;

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

type StrengthTier = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  tier: StrengthTier;
  label: string;
}

/** Basic heuristic, 0-4 tiers:
 *  - any password at all         -> base tier 1 ("Weak")
 *  - length >= 8                 -> +1 tier
 *  - contains a digit            -> +1 tier
 *  - contains a symbol           -> +1 tier
 *  Traces: "abc" -> 1 (Weak). "abcdefgh1" -> 1+1(len)+1(digit) = 3 (Good).
 *  "abcdefgh1!" -> 1+1(len)+1(digit)+1(symbol) = 4 (Strong). */
function scorePassword(password: string): StrengthResult {
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

const TIER_COLOR: Record<StrengthTier, string> = {
  0: "#d1d5db",
  1: "#f87171",
  2: "#fb923c",
  3: "#facc15",
  4: "#4ade80",
};

export default function Concept03ReactiveCompanion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const displayName = useMemo(() => deriveDisplayName(email), [email]);
  const strength = useMemo(() => scorePassword(password), [password]);
  const showGreeting = displayName !== null;
  const fillPercent = (strength.tier / 4) * 100;

  return (
    <div className="flex min-h-screen w-full bg-white">
      <style>{`
        @keyframes companion-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .companion-fade-in {
          animation: companion-fade-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes companion-pop {
          0% { transform: scale(0.94); }
          60% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .companion-pop {
          animation: companion-pop 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-12 md:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{copy.heading}</h1>
          <p className="mt-2 text-sm text-slate-500">{copy.subheading}</p>

          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label htmlFor="c3-email">{copy.emailLabel}</Label>
              <Input
                id="c3-email"
                type="email"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c3-password">{copy.passwordLabel}</Label>
              <div className="relative">
                <Input
                  id="c3-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="c3-remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="c3-remember" className="text-sm font-normal text-slate-600">
                  {copy.rememberLabel}
                </Label>
              </div>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {copy.forgotLabel}
              </a>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
              {copy.submitLabel}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-wide text-slate-400">{copy.dividerLabel}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Button type="button" variant="outline" className="w-full">
              {copy.googleLabel}
            </Button>

            <p className="pt-2 text-center text-sm text-slate-500">
              {copy.signupPromptLabel}{" "}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700">
                {copy.signupLinkLabel}
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Companion panel */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-indigo-600 md:flex">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-indigo-800/40 blur-3xl" />

        <div className="relative z-10 w-full max-w-sm space-y-4 px-8">
          {/* Greeting card — crossfades between neutral and personalized state */}
          <div className="relative h-[92px]">
            <div
              className={`absolute inset-0 flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xl shadow-indigo-900/20 transition-all duration-500 ease-out ${
                showGreeting ? "pointer-events-none translate-y-1 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Sign in to continue</p>
                <p className="text-xs text-slate-500">We'll greet you by name once you start typing.</p>
              </div>
            </div>

            <div
              key={showGreeting ? displayName ?? "greet" : "none"}
              className={`absolute inset-0 flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xl shadow-indigo-900/20 transition-all duration-500 ease-out ${
                showGreeting
                  ? "translate-y-0 opacity-100 companion-fade-in"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg">
                👋
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Hey, {displayName ?? ""} 👋
                </p>
                <p className="text-xs text-slate-500">Good to see you again.</p>
              </div>
            </div>
          </div>

          {/* Strength card — bar fill animates, tier label crossfades in on change */}
          <div className="rounded-2xl bg-white p-5 shadow-xl shadow-indigo-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Password strength</p>
                  <span
                    key={strength.tier}
                    className="companion-fade-in text-xs font-semibold"
                    style={{ color: TIER_COLOR[strength.tier] }}
                  >
                    {strength.label || "—"}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${fillPercent}%`,
                      backgroundColor: TIER_COLOR[strength.tier],
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-indigo-100/80">
            This panel reacts live to what you type — nothing is sent anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
