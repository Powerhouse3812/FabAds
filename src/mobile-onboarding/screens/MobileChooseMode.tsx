import { useState } from "react";
import { ArrowRight, Layers, ShoppingBag, Zap } from "lucide-react";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { MobileOptionCard } from "../components/MobileOptionCard";
import type { MobileGenieMode, MobileProfileType } from "../types";

export interface MobileChooseModeProps {
  onClose: () => void;
  onBack: () => void;
  onContinue: (mode: MobileGenieMode, profileType: MobileProfileType) => void;
  stepIndex: number;
  stepCount: number;
}

/**
 * Genie step 1 — Choose Mode. Copy lifted from
 * `src/onboarding-demo/steps/ChooseMode.tsx`.
 *
 * Web asks both questions on one screen (Section A identity + Section B
 * "what first", revealed only for "Both"). That structure survives here
 * because Section B is CONDITIONAL — folding it into its own screen would
 * mean single-type users see a step count that shrinks mid-flow. Instead
 * Section B reveals inline below Section A, and the sticky footer stays the
 * single commit point.
 *
 * Web's "Skip for now" and "Already have an account? Sign in" links are
 * dropped: this flow is launched by a signed-in user from the More menu, so
 * a sign-in link is nonsense and the header ✕ already covers skipping.
 */

const PROFILE_OPTIONS: {
  id: MobileProfileType;
  icon: typeof ShoppingBag;
  title: string;
  blurb: string;
}[] = [
  {
    id: "ecom",
    icon: ShoppingBag,
    title: "E-commerce",
    blurb: "Sell your own products — Shopify, WooCommerce, Amazon.",
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Affiliate / Ad Lab",
    blurb: "Promote others' offers — affiliate networks, lead gen.",
  },
  {
    id: "both",
    icon: Layers,
    title: "Both",
    blurb: "A mix — ecom for some brands, affiliate for others.",
  },
];

const START_OPTIONS: {
  id: MobileGenieMode;
  icon: typeof ShoppingBag;
  title: string;
  hook: string;
}[] = [
  {
    id: "ecom",
    icon: ShoppingBag,
    title: "Brand setup",
    hook: "Build out your brand — voice, products, visuals.",
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Category setup",
    hook: "Pick a niche — we'll seed competitors and angles.",
  },
];

const NEXT_SETUP_LABEL: Record<MobileGenieMode, string> = {
  ecom: "Brand setup",
  affiliate: "Category setup",
};

export function MobileChooseMode({
  onClose,
  onBack,
  onContinue,
  stepIndex,
  stepCount,
}: MobileChooseModeProps) {
  const [profile, setProfile] = useState<MobileProfileType | null>(null);
  const [start, setStart] = useState<MobileGenieMode | null>(null);

  const showStartSection = profile === "both";

  const handleProfilePick = (p: MobileProfileType) => {
    setProfile(p);
    // Clear a stale "start" pick if the user backs out of "Both".
    if (p !== "both") setStart(null);
  };

  const nextMode: MobileGenieMode | null =
    profile === "ecom" || profile === "affiliate"
      ? profile
      : profile === "both"
        ? start
        : null;

  const canContinue = nextMode !== null;

  return (
    <MobileFlowShell
      eyebrow="Genie setup"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Quick start"
      title={
        <>
          Let's get you <span className="rounded bg-primary/30 px-1.5">set up</span>.
        </>
      }
      subtitle="Two quick picks and we'll tailor your workspace."
      onBack={onBack}
      onClose={onClose}
      primaryLabel={
        nextMode ? `Continue · ${NEXT_SETUP_LABEL[nextMode]}` : "Continue"
      }
      primaryDisabled={!canContinue}
      onPrimary={() => {
        if (!nextMode) return;
        onContinue(nextMode, profile ?? nextMode);
      }}
    >
      {/* ── Section A — identity ─────────────────────────────────────── */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
            aria-hidden
          >
            A
          </span>
          <h2 className="text-[14px] font-semibold text-foreground">
            What's your focus?
          </h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {PROFILE_OPTIONS.map((opt) => (
            <MobileOptionCard
              key={opt.id}
              icon={opt.icon}
              title={opt.title}
              blurb={opt.blurb}
              selected={profile === opt.id}
              onSelect={() => handleProfilePick(opt.id)}
            />
          ))}
        </div>

        {/* Single-type users get web's "Up next" reassurance so they know
            which flow Continue drops them into. */}
        {(profile === "ecom" || profile === "affiliate") && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.08] px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Up next
            </span>
            <span className="text-[11.5px] font-semibold text-foreground">
              {NEXT_SETUP_LABEL[profile]}
            </span>
            <ArrowRight className="h-3 w-3 text-primary" strokeWidth={2.5} aria-hidden />
          </p>
        )}
      </section>

      {/* ── Section B — action, "Both" only ──────────────────────────── */}
      {showStartSection && (
        <section className="mt-6">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              aria-hidden
            >
              B
            </span>
            <h2 className="text-[14px] font-semibold text-foreground">
              What do you want to set up first?
            </h2>
          </div>
          <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            You can switch later
          </p>
          <div className="flex flex-col gap-2.5">
            {START_OPTIONS.map((opt) => (
              <MobileOptionCard
                key={opt.id}
                icon={opt.icon}
                title={opt.title}
                blurb={opt.hook}
                selected={start === opt.id}
                onSelect={() => setStart(opt.id)}
              />
            ))}
          </div>
        </section>
      )}
    </MobileFlowShell>
  );
}
