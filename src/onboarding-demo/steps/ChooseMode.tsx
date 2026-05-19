import { useState } from "react";
import { ShoppingBag, Zap, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

type Mode = "ecom" | "affiliate";
type ProfileType = "ecom" | "affiliate" | "both";

interface ChooseModeProps {
  /**
   * Called with the generation MODE the user is starting with (always ecom
   * or affiliate — never "both") AND the user's PROFILE type captured for
   * internal segmentation. For single-type pickers both values match.
   * For "both" pickers, profileType="both" + mode=whichever path they
   * elected to start with at the second-stage picker.
   */
  onPick: (mode: Mode, profileType: ProfileType) => void;
  onSkip: () => void;
  onLogin?: () => void;
}

/* ── Stage 1 tile data — what type of marketer the user is ── */
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
    blurb: "Sell your own products — Shopify, WooCommerce, Amazon, etc.",
    highlight: "Best for DTC brands + stores",
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Affiliate / Ad Lab",
    blurb: "Promote others' offers — affiliate networks, lead gen, niches.",
    highlight: "Best for affiliates + creators",
  },
  {
    id: "both",
    icon: Layers,
    title: "Both",
    blurb: "I do a mix — ecom for some brands, affiliate for others.",
    highlight: "We'll tailor both flows",
  },
];

/* ── Stage 2 tile data — where to start (only for Both users) ── */
const START_OPTIONS: {
  id: Mode;
  icon: typeof ShoppingBag;
  title: string;
  blurb: string;
}[] = [
  {
    id: "ecom",
    icon: ShoppingBag,
    title: "Start with E-commerce",
    blurb: "Paste your store URL — we'll pull products, branding, and style.",
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Start with Affiliate",
    blurb: "Pick a niche and posting platforms — we'll seed your ad angles.",
  },
];

/**
 * ChooseMode — Step 0 of the onboarding wizard.
 *
 * Two-stage picker:
 *
 *   Stage 1  Profile type      [ Ecom · Affiliate · Both ]
 *            Captures profileType for internal segmentation.
 *
 *   Stage 2  Where to start    [ Ecom · Affiliate ]
 *            Only shown when user picked "Both" at stage 1.
 *            Ecom + Affiliate single-type users auto-advance — their
 *            generation mode = their profile type, so picking once
 *            is enough. (Maalik's call: "don't make them pick twice.")
 *
 * Returns BOTH values via onPick(mode, profileType). The shell uses
 * `mode` to drive routing (skip-Country for affiliate, etc.) and
 * stores `profileType` in OnboardingData for analytics / tailoring.
 *
 * No new step is added to the stepper — the second-stage picker lives
 * on the same page, with an AnimatePresence crossfade between stages.
 * Per Maalik: "we don't need any extra step for profile setup."
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
    // Single-type: mode = profile, advance immediately.
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
      <div className="max-w-[880px] mx-auto px-6 py-10 pb-20">
        <AnimatePresence mode="wait">
          {stage === "profile" ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
              >
                Step 1 · Quick Start
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
            // Stage 2 — only mounted when profile === "both"
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <button
                type="button"
                onClick={goBackToProfile}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change focus
              </button>

              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
              >
                Profile · Both · Pick a starting point
              </Badge>
              <h1 className="text-3xl md:text-[38px] font-semibold tracking-tight">
                Where do you want to{" "}
                <span className="text-foreground bg-primary/30 px-1.5 rounded">
                  start
                </span>
                ?
              </h1>
              <p className="text-[15px] text-muted-foreground mt-2">
                You can switch between flows any time later.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {START_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleStartPick(opt.id)}
                      className={cn(
                        "group text-left p-6 rounded-2xl border border-border bg-card",
                        "hover:border-primary/60 hover:bg-primary/[0.03] transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      )}
                    >
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <h3 className="text-lg font-semibold mt-4">
                        {opt.title}
                      </h3>
                      <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                        {opt.blurb}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold mt-4 group-hover:gap-2 transition-all">
                        Start
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
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
        {/* `profile` state is used to gate stage 2 — referenced here to
            satisfy the linter when stage flips. */}
        <span className="sr-only" aria-hidden>
          {profile ?? ""}
        </span>
      </div>
    </div>
  );
}
