import { useState } from "react";
import {
  ShoppingBag,
  Zap,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

type Mode = "ecom" | "affiliate";
type ProfileType = "ecom" | "affiliate" | "both";
/**
 * Sub-stage within Step 1. Controlled by the parent OnboardingShell so the
 * URL slug flips between `choose-mode` and `choose-mode-start` as the user
 * progresses inside this step.
 *   undefined → profile picker (default)
 *   "start"   → user has picked "Both" and Section B is revealed
 */
type SubStage = "start" | undefined;

interface ChooseModeProps {
  onPick: (mode: Mode, profileType: ProfileType) => void;
  onSkip: () => void;
  onLogin?: () => void;
  /** Sub-stage from URL state; sync with onSubStageChange. */
  subStage?: SubStage;
  onSubStageChange?: (next: SubStage) => void;
}

/* ── Section A — identity ("What's your focus?") ─────────────────────── */
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

/**
 * Section B — action ("What do you want to set up first?").
 * Vocabulary deliberately shifts from Section A's identity language.
 * Internal id mapping (wizard routing unchanged):
 *   "ecom"      → "Brand setup"     (you own a brand)
 *   "affiliate" → "Category setup"  (you work a niche)
 */
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
    title: "Brand setup",
    hook: "Build out your brand — voice, products, visuals.",
    bullets: [
      "Auto-detect products + branding from your store URL",
      "Lock in tone, colors, and messaging",
      "You can add category work later",
    ],
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Category setup",
    hook: "Pick a niche — we'll seed competitors and angles.",
    bullets: [
      "Define your category and posting platforms",
      "Surface top-performing competitor ads",
      "You can add brand work later",
    ],
  },
];

/** Where the user is headed after Continue — used in the Up-next pill +
 *  the Continue button context label. */
const NEXT_SETUP_LABEL: Record<Mode, string> = {
  ecom: "Brand setup",
  affiliate: "Category setup",
};

/**
 * ChooseMode — Step 1 of the onboarding wizard. Combined layout (the
 * only layout — the prior Two-stage variant + toggle were removed once
 * Combined was locked in).
 *
 * Two questions on one screen:
 *   Section A: identity   "What's your focus?"   Ecom · Affiliate · Both
 *   Section B: action     "What do you want to set up first?"
 *                         Brand setup · Category setup
 *                         (hidden when profile is single-type;
 *                          reveals when profile === "both")
 *
 * Single Continue button at the bottom commits the pick. Single-type
 * users see an "Up next · Brand/Category setup" pill in Section A's
 * header row so they know what flow they're advancing into.
 *
 * URL state:
 *   ?onb_step=choose-mode        profile screen / Section B hidden
 *   ?onb_step=choose-mode-start  profile === "both" / Section B revealed
 * Sub-stage is controlled by the parent OnboardingShell — refresh +
 * share-link of either slug land the user on the right screen state.
 */
export function ChooseMode({
  onPick,
  onSkip,
  onLogin,
  subStage,
  onSubStageChange,
}: ChooseModeProps) {
  // Hydrate from subStage on mount — refresh of choose-mode-start lands
  // the user with profile already set to "both" and Section B revealed.
  const [profile, setProfile] = useState<ProfileType | null>(
    subStage === "start" ? "both" : null,
  );
  const [start, setStart] = useState<Mode | null>(null);

  const showStartSection = profile === "both";

  // Reset the start pick if the user changes their profile choice away
  // from "both" (avoids leaving stale state behind). Also flip the URL
  // sub-stage so refresh + share-link stay accurate.
  const handleProfilePick = (p: ProfileType) => {
    setProfile(p);
    if (p !== "both") {
      setStart(null);
      onSubStageChange?.(undefined);
    } else {
      onSubStageChange?.("start");
    }
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

  // Destination mode for the Continue label — single-type uses profile,
  // Both uses start.
  const nextMode: Mode | null =
    profile === "ecom" || profile === "affiliate"
      ? profile
      : profile === "both" && start
        ? start
        : null;

  return (
    <div className="relative min-h-full bg-background">
      <StepNav active={0} />
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

        {/* ── Section A — identity ──────────────────────────────────── */}
        <section className="mt-8">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
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
            {/* Single-type "Up next" pill — single-type pickers see what
                flow they're advancing into. */}
            {(profile === "ecom" || profile === "affiliate") && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] border border-primary/30 px-2.5 py-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Up next
                </span>
                <span className="text-[11.5px] font-semibold text-foreground">
                  {NEXT_SETUP_LABEL[profile]}
                </span>
                <ArrowRight
                  className="h-3 w-3 text-primary"
                  strokeWidth={2.5}
                />
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

        {/* ── Section B — action (only for "both") ─────────────────────
            Vocabulary deliberately shifts from Section A's identity
            question (Ecom/Affiliate/Both) to an action question
            (Brand setup / Category setup) so the two sections don't
            feel like the same question repeated. */}
        <AnimatePresence initial={false}>
          {showStartSection && (
            <motion.section
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  B
                </div>
                <h2 className="text-[15px] font-semibold text-foreground">
                  What do you want to set up first?
                </h2>
                {start && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                    ✓ {NEXT_SETUP_LABEL[start]}
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

        {/* ── Commit row — single Continue button ─────────────────── */}
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
            {/* Context-aware label: commits the destination flow before
                the user clicks. "Continue · Brand setup →" feels more
                informed than a generic "Continue →". */}
            {nextMode ? (
              <>
                Continue
                <span className="opacity-75 mx-0.5">·</span>
                <span>{NEXT_SETUP_LABEL[nextMode]}</span>
              </>
            ) : (
              "Continue"
            )}
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
    </div>
  );
}
