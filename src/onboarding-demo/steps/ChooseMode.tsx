import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Zap,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

type Mode = "ecom" | "affiliate";
type ProfileType = "ecom" | "affiliate" | "both";
type ChooseModeVariant = "stages" | "combined";

interface ChooseModeProps {
  onPick: (mode: Mode, profileType: ProfileType) => void;
  onSkip: () => void;
  onLogin?: () => void;
}

/* ── Shared option data ──────────────────────────────────────────────── */
const PROFILE_OPTIONS: {
  id: ProfileType;
  icon: typeof ShoppingBag;
  title: string;
  blurb: string;
  highlight: string;
}[] = [
  {
    id: "ecom",
    icon: ShoppingBag,
    title: "E-commerce",
    blurb: "Sell your own products — Shopify, WooCommerce, Amazon.",
    highlight: "Best for DTC brands + stores",
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Affiliate / Ad Lab",
    blurb: "Promote others' offers — affiliate networks, lead gen.",
    highlight: "Best for affiliates + creators",
  },
  {
    id: "both",
    icon: Layers,
    title: "Both",
    blurb: "A mix — ecom for some brands, affiliate for others.",
    highlight: "We'll tailor both flows",
  },
];

const START_OPTIONS: {
  id: Mode;
  icon: typeof ShoppingBag;
  title: string;
  hook: string;
  bullets: string[];
}[] = [
  {
    id: "ecom",
    icon: ShoppingBag,
    title: "E-commerce first",
    hook: "Paste your store URL — we'll pull everything.",
    bullets: [
      "Auto-detect products, branding, style",
      "Build creative for your catalog",
      "Add affiliate later",
    ],
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Affiliate first",
    hook: "Pick a niche — we'll seed angles.",
    bullets: [
      "Choose posting platforms",
      "Seed top-performing angles",
      "Add ecom later",
    ],
  },
];

/* ── Forked-path SVG (V1 Stage 2) ────────────────────────────────────── */
function ForkedPathIllustration() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="w-full h-12 mb-4"
      fill="none"
      aria-hidden
    >
      <path
        d="M100 76 L100 40"
        stroke="hsl(var(--muted-foreground) / 0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path
        d="M100 40 Q 100 22 40 18"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100 40 Q 100 22 160 18"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="40" cy="18" r="4" fill="hsl(var(--primary))" />
      <circle cx="160" cy="18" r="4" fill="hsl(var(--primary))" />
      <circle
        cx="100"
        cy="40"
        r="3.5"
        fill="hsl(var(--background))"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
      />
    </svg>
  );
}

/* ── Variant toggle pill (top of page) ──────────────────────────────── */
function VariantToggle({
  variant,
  onChange,
}: {
  variant: ChooseModeVariant;
  onChange: (v: ChooseModeVariant) => void;
}) {
  return (
    <div className="absolute top-3 right-5 z-10">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 backdrop-blur p-1 shadow-sm">
        {(["stages", "combined"] as const).map((v) => {
          const active = v === variant;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "px-3 py-1 rounded-full text-[11.5px] transition-colors font-medium",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={active}
            >
              {v === "stages" ? "Two-stage" : "Combined"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ChooseMode — Step 0. Two visual variants of the same logical wizard:
 *
 *   V1  "stages"    (default) — Two-stage picker on one page. Stage 1
 *                    profile (3 tiles), Stage 2 (only for "both") starting
 *                    trail (2 large featured cards). Crossfade transition.
 *
 *   V2  "combined"  Single-screen — Both questions visible on one scroll.
 *                    Section 2 (start picker) progressively reveals when
 *                    profile === "both"; auto-hidden for single-type users.
 *                    Single Continue button at the bottom commits the
 *                    selection.
 *
 * Toggle pill at the top of the page switches between V1 and V2 mid-flow.
 * Persisted via URL param `?cm=stages` / `?cm=combined` so a hard refresh
 * (or share-link) preserves the user's pick.
 *
 * Same `onPick(mode, profileType)` contract for both variants — the wizard
 * routing downstream doesn't care which variant the user chose.
 */
export function ChooseMode({ onPick, onSkip, onLogin }: ChooseModeProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlVariant = searchParams.get("cm");
  const variant: ChooseModeVariant =
    urlVariant === "combined" ? "combined" : "stages";

  const setVariant = (next: ChooseModeVariant) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "stages") sp.delete("cm");
        else sp.set("cm", next);
        return sp;
      },
      { replace: true },
    );
  };

  return (
    <div className="relative min-h-full bg-background">
      <StepNav active={0} />
      <VariantToggle variant={variant} onChange={setVariant} />
      {variant === "combined" ? (
        <CombinedChooser onPick={onPick} onSkip={onSkip} onLogin={onLogin} />
      ) : (
        <TwoStageChooser onPick={onPick} onSkip={onSkip} onLogin={onLogin} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  V1 — TWO-STAGE CHOOSER (existing behaviour)
 * ═══════════════════════════════════════════════════════════════════════ */

function TwoStageChooser({ onPick, onSkip, onLogin }: ChooseModeProps) {
  const [stage, setStage] = useState<"profile" | "start">("profile");
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const handleProfilePick = (p: ProfileType) => {
    if (p === "both") {
      setProfile(p);
      setStage("start");
      return;
    }
    onPick(p, p);
  };

  const handleStartPick = (m: Mode) => {
    onPick(m, "both");
  };

  const goBackToProfile = () => {
    setProfile(null);
    setStage("profile");
  };

  return (
    <AnimatePresence mode="wait">
      {stage === "profile" ? (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[880px] mx-auto px-6 py-10 pb-20"
        >
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
          >
            Step 1 · Tell us about you
          </Badge>
          <h1 className="text-3xl md:text-[38px] font-semibold tracking-tight">
            What's your{" "}
            <span className="text-foreground bg-primary/30 px-1.5 rounded">
              focus
            </span>
            ?
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            We'll tailor the experience based on what you do.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {PROFILE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleProfilePick(opt.id)}
                  className={cn(
                    "group text-left p-5 rounded-2xl border border-border bg-card",
                    "hover:border-primary/60 hover:bg-primary/[0.03] transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  )}
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-[17px] font-semibold mt-4">
                    {opt.title}
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed min-h-[3em]">
                    {opt.blurb}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground/80 mt-3 font-mono">
                    {opt.highlight}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold mt-4 group-hover:gap-2 transition-all">
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-10 space-y-4">
            <div>
              <Button variant="link" onClick={onSkip} className="text-[13px]">
                Skip for now — explore the dashboard →
              </Button>
              <p className="text-[11px] text-muted-foreground/80 mt-1.5">
                You can set up your brand right from the dashboard.
              </p>
            </div>
            {onLogin && (
              <p className="text-[12px] text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={onLogin}
                  className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="start"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          className="relative max-w-[860px] mx-auto px-6 py-10 pb-20"
          style={{
            background:
              "radial-gradient(ellipse 700px 220px at 50% 0%, rgba(195,235,66,0.07), transparent 70%)",
          }}
        >
          <button
            type="button"
            onClick={goBackToProfile}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change focus
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/[0.06] px-2.5 py-1">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                Focus · Both
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              aria-label="Step 1: sub-question 2 of 2"
            >
              <span className="block h-1.5 w-4 rounded-full bg-primary/70" />
              <span className="block h-1.5 w-4 rounded-full bg-primary" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Step 1 · 2 of 2
            </span>
          </div>

          <ForkedPathIllustration />

          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-center">
            Where do you want to{" "}
            <span className="text-foreground bg-primary/30 px-1.5 rounded">
              start
            </span>
            ?
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2 text-center max-w-[480px] mx-auto">
            You can switch between flows any time later — this just picks
            your first trail.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {START_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleStartPick(opt.id)}
                  className={cn(
                    "group text-left rounded-2xl border-2 border-border bg-card overflow-hidden",
                    "hover:border-primary hover:shadow-[0_8px_24px_-12px_rgba(195,235,66,0.4)] transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  )}
                >
                  <div
                    className="relative h-[120px] flex items-center justify-center"
                    style={{
                      background:
                        "radial-gradient(ellipse 280px 100px at 50% 100%, rgba(195,235,66,0.18), transparent 70%)",
                    }}
                  >
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/40 bg-primary/15 text-foreground group-hover:scale-105 transition-transform">
                      <Icon className="h-7 w-7" strokeWidth={1.75} />
                    </div>
                    <Sparkles
                      className="absolute top-3 right-3 h-3.5 w-3.5 text-primary/50 group-hover:text-primary transition-colors"
                      strokeWidth={2}
                    />
                  </div>

                  <div className="p-5 border-t border-border/50">
                    <h3 className="text-[17px] font-semibold">{opt.title}</h3>
                    <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                      {opt.hook}
                    </p>

                    <ul className="mt-3 space-y-1.5">
                      {opt.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[12px] text-foreground/80"
                        >
                          <Check
                            className="h-3 w-3 text-primary mt-[3px] shrink-0"
                            strokeWidth={3}
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold mt-4 text-primary group-hover:gap-2 transition-all">
                      Start with {opt.title.split(" ")[0]}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Button variant="link" onClick={onSkip} className="text-[13px]">
              Skip for now — explore the dashboard →
            </Button>
          </div>
        </motion.div>
      )}
      <span className="sr-only" aria-hidden>
        {profile ?? ""}
      </span>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  V2 — COMBINED CHOOSER (both questions on one page)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Mental model:
 *   - Section A: Profile pick (3 compact tiles)
 *   - Section B: Start pick (2 compact tiles)
 *       - Hidden when profile is null or single-type
 *       - Revealed (slide + fade in) when profile === "both"
 *   - Single Continue button at the bottom commits the selection
 *
 * Single-type pickers (Ecom / Affiliate) → Continue is enabled the
 * moment they pick; clicking advances with mode=profile.
 * Both pickers → Continue stays disabled until they also pick a start;
 * clicking advances with mode=start, profileType="both".
 */
function CombinedChooser({
  onPick,
  onSkip,
  onLogin,
}: ChooseModeProps) {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [start, setStart] = useState<Mode | null>(null);

  const showStartSection = profile === "both";

  // Reset the start pick if the user changes their profile choice away
  // from "both" (avoids leaving stale state behind).
  const handleProfilePick = (p: ProfileType) => {
    setProfile(p);
    if (p !== "both") setStart(null);
  };

  const canContinue =
    profile === "ecom" ||
    profile === "affiliate" ||
    (profile === "both" && start !== null);

  const handleContinue = () => {
    if (!canContinue) return;
    if (profile === "ecom" || profile === "affiliate") {
      onPick(profile, profile);
    } else if (profile === "both" && start) {
      onPick(start, "both");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="max-w-[880px] mx-auto px-6 py-10 pb-20"
    >
      <Badge
        variant="outline"
        className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
      >
        Step 1 · Quick Start
      </Badge>
      <h1 className="text-3xl md:text-[34px] font-semibold tracking-tight">
        Let's get you{" "}
        <span className="text-foreground bg-primary/30 px-1.5 rounded">
          set up
        </span>
        .
      </h1>
      <p className="text-[15px] text-muted-foreground mt-2">
        Two quick picks and we'll tailor your workspace.
      </p>

      {/* ── Section A — profile ─────────────────────────────────────── */}
      <section className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            A
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">
            What's your focus?
          </h2>
          {profile && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
              ✓ {PROFILE_OPTIONS.find((p) => p.id === profile)?.title}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROFILE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = profile === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleProfilePick(opt.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group text-left p-4 rounded-xl border bg-card transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/[0.06] shadow-[0_4px_16px_-8px_rgba(195,235,66,0.4)]"
                    : "border-border hover:border-primary/40 hover:bg-primary/[0.02]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/15 text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold">
                        {opt.title}
                      </h3>
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5 text-primary"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                      {opt.blurb}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Section B — start (only for "both") ─────────────────────── */}
      <AnimatePresence initial={false}>
        {showStartSection && (
          <motion.section
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 32 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                B
              </div>
              <h2 className="text-[15px] font-semibold text-foreground">
                Where do you want to start?
              </h2>
              {start && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  ✓ {start === "ecom" ? "E-commerce" : "Affiliate"}
                </span>
              )}
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                You can switch later
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {START_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = start === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setStart(opt.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "group text-left p-4 rounded-xl border bg-card transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isSelected
                        ? "border-primary bg-primary/[0.06] shadow-[0_4px_16px_-8px_rgba(195,235,66,0.4)]"
                        : "border-border hover:border-primary/40 hover:bg-primary/[0.02]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/15 text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-semibold">
                            {opt.title}
                          </h3>
                          {isSelected && (
                            <Check
                              className="h-3.5 w-3.5 text-primary"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
                          {opt.hook}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Commit row — single Continue button ─────────────────────── */}
      <div className="mt-10 flex items-center justify-between flex-wrap gap-4">
        <Button variant="link" onClick={onSkip} className="text-[13px]">
          Skip for now — explore the dashboard →
        </Button>

        <Button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-[14px] font-semibold"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {onLogin && (
        <p className="text-center text-[12px] text-muted-foreground mt-6">
          Already have an account?{" "}
          <button
            onClick={onLogin}
            className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign in
          </button>
        </p>
      )}
    </motion.div>
  );
}
