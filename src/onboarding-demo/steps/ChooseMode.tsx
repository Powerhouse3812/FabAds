import { useState } from "react";
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

interface ChooseModeProps {
  onPick: (mode: Mode, profileType: ProfileType) => void;
  onSkip: () => void;
  onLogin?: () => void;
}

/* ── Stage 1 tile data — profile type (who the user IS) ─────────────── */
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

/* ── Stage 2 tile data — starting trail (only for "Both" pickers) ───── */
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

/* ── Decorative illustration: forked-path SVG for Stage 2 ────────────── */
function ForkedPathIllustration() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="w-full h-12 mb-4"
      fill="none"
      aria-hidden
    >
      {/* Trunk */}
      <path
        d="M100 76 L100 40"
        stroke="hsl(var(--muted-foreground) / 0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      {/* Left branch */}
      <path
        d="M100 40 Q 100 22 40 18"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right branch */}
      <path
        d="M100 40 Q 100 22 160 18"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Endpoint dots */}
      <circle cx="40" cy="18" r="4" fill="hsl(var(--primary))" />
      <circle cx="160" cy="18" r="4" fill="hsl(var(--primary))" />
      {/* You-are-here dot at fork */}
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

/**
 * ChooseMode — Step 0 with a two-stage picker.
 *
 *   STAGE 1  Profile type      [ Ecom · Affiliate · Both ]   tile grid
 *   STAGE 2  Where to start    [ Ecom · Affiliate ]          rich layout
 *
 * Single-type pickers (Ecom, Affiliate) auto-advance — mode = profile,
 * picking once is enough. Only "Both" pickers see Stage 2.
 *
 * Maalik's iter-3 feedback (2026-05-19):
 *   - The two stages looked too similar (same grid, same heading shape) —
 *     felt like one step repeating. Stage 2 has been visually re-shaped
 *     to make the difference legible at a glance.
 *   - Two selections still equal ONE step (the stepper count doesn't
 *     change) — the new sub-step indicator + locked-in "Focus chosen"
 *     chip make that explicit.
 *
 * What's structurally different about Stage 2 (compared to Stage 1):
 *   1. Locked confirmation chip at top — "✓ Focus · Both" reinforces
 *      "you've already done 1 of 2 micro-questions; this is the 2nd."
 *   2. Sub-step pip indicator [ ● ● ] below the badge — visualizes that
 *      Step 1 has 2 sub-questions and you're on the 2nd.
 *   3. Forked-path SVG illustration — visual metaphor for "you said
 *      you do both, pick which trail to start." Stage 1 has no
 *      illustration.
 *   4. Layout: 2 large featured cards with a bulleted feature list
 *      inside each — feels like a focused choice. Stage 1 uses tight
 *      3-tile grid for a "scan + pick" rhythm.
 *   5. Lime-tinted background (subtle radial-gradient top) — communicates
 *      "you're zooming in / refining." Stage 1 stays neutral.
 *   6. Heading copy is forward-looking ("Where do you want to start?")
 *      whereas Stage 1 is identity ("What's your focus?").
 *
 * Stepper note (StepNav): Processing has been removed from the visible
 * row. Profile pick → Country (ecom) / Input (affiliate) — never a 6th
 * dot for the second-stage picker, because that picker lives ON the
 * same page as Stage 1.
 */
export function ChooseMode({ onPick, onSkip, onLogin }: ChooseModeProps) {
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
    <div className="min-h-full bg-background">
      <StepNav active={0} />
      <AnimatePresence mode="wait">
        {stage === "profile" ? (
          /* ───────── STAGE 1 — profile type (compact tile grid) ───────── */
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
          /* ───────── STAGE 2 — starting trail (focused 2-card layout) ─── */
          <motion.div
            key="start"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="relative max-w-[860px] mx-auto px-6 py-10 pb-20"
            style={{
              // Subtle lime radial wash from the top — visually distinct
              // from Stage 1's flat neutral background, signals "zooming in".
              background:
                "radial-gradient(ellipse 700px 220px at 50% 0%, rgba(195,235,66,0.07), transparent 70%)",
            }}
          >
            {/* Back link — soft escape hatch */}
            <button
              type="button"
              onClick={goBackToProfile}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change focus
            </button>

            {/* Locked-in confirmation chip — communicates "1 of 2 done" */}
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/[0.06] px-2.5 py-1">
                <Check
                  className="h-3 w-3 text-primary"
                  strokeWidth={3}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground">
                  Focus · Both
                </span>
              </div>
              {/* Sub-step pip indicator — visualizes Step 1 has 2 micro-questions */}
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

            {/* Illustration — forked path metaphor */}
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

            {/* 2 large featured cards — different from Stage 1's compact tiles */}
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
                    {/* Top illustration band — distinct from Stage 1's
                        compact icon disc. */}
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
                      {/* Sparkle accent — only on Stage 2 cards */}
                      <Sparkles
                        className="absolute top-3 right-3 h-3.5 w-3.5 text-primary/50 group-hover:text-primary transition-colors"
                        strokeWidth={2}
                      />
                    </div>

                    {/* Body */}
                    <div className="p-5 border-t border-border/50">
                      <h3 className="text-[17px] font-semibold">
                        {opt.title}
                      </h3>
                      <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                        {opt.hook}
                      </p>

                      {/* Feature bullets — only on Stage 2 */}
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
              <Button
                variant="link"
                onClick={onSkip}
                className="text-[13px]"
              >
                Skip for now — explore the dashboard →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* `profile` is consumed to gate the stage transition. */}
      <span className="sr-only" aria-hidden>
        {profile ?? ""}
      </span>
    </div>
  );
}
