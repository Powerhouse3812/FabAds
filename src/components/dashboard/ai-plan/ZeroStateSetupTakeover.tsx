import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  Eye,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface SetupStep {
  id: "brand" | "competitors" | "first-gen";
  icon: typeof Building2;
  title: string;
  desc: string;
  cta: string;
  href: string;
  estMin: number;
  done: boolean;
}

interface ZeroStateSetupTakeoverProps {
  /** Skip rendering the takeover and drop into populated dashboard. */
  onSkip: () => void;
}

/**
 * Full-page zero-state takeover for brand-new AI-plan users.
 *
 * Replaces the dashboard surface entirely until the user crosses the
 * activation threshold (≥1 brand fully set up + ≥3 competitors tracked
 * + ≥1 generation made). Once they do, this component never renders
 * again that session — the populated dashboard takes over.
 *
 * Maalik's pick: "Full empty-state takeover — Setup checklist forces
 * the activation path." Dashboard hides its real surface until the
 * user has shipped 3 generations / steps. Escape hatch ("Skip setup")
 * is provided for users who want to explore first.
 *
 * Step completion is computed live from mock catalogue + insights
 * state. As the user completes each step in another tab, returning to
 * dashboard auto-reflects progress.
 */
export function ZeroStateSetupTakeover({
  onSkip,
}: ZeroStateSetupTakeoverProps) {
  // Step 1 done: first brand has voice (>20 chars) AND ≥2 colors AND ≥2 usps
  const brand1Setup = useMemo(() => {
    const first = brands[0];
    if (!first) return { done: false, brandId: null };
    const done =
      first.voice.length > 20 &&
      first.colors.length >= 2 &&
      first.usps.length >= 2;
    return { done, brandId: first.id };
  }, []);

  // Step 2 done: first brand has ≥3 competitors tracked
  const competitorsSetup = useMemo(() => {
    const first = brands[0];
    if (!first) return false;
    return first.competitors.length >= 3;
  }, []);

  // Step 3 done: no live counter — hard-coded false for the zero-state
  // (real wiring against generation history comes later)
  const firstGenDone = false;

  const steps: SetupStep[] = useMemo(
    () => [
      {
        id: "brand",
        icon: Building2,
        title: "Set up your brand voice & visuals",
        desc: "Voice tone, brand colors, USPs — the AI uses these to write on-brand creatives.",
        cta: "Open brand",
        href: brand1Setup.brandId
          ? `/catalogue/brands/${brand1Setup.brandId}`
          : "/catalogue/brands",
        estMin: 5,
        done: brand1Setup.done,
      },
      {
        id: "competitors",
        icon: Eye,
        title: "Pick competitors to track",
        desc: "Add 3–5 brands you watch — Industry Insights will surface their winning ads.",
        cta: "Add competitors",
        href: "/insights/competitors",
        estMin: 2,
        done: competitorsSetup,
      },
      {
        id: "first-gen",
        icon: Wand2,
        title: "Run your first generation",
        desc: "Brief Genie with a prompt or pick a mode. First ad in under 5 minutes.",
        cta: "Open Genie",
        href: "/iq/genie6/generate",
        estMin: 5,
        done: firstGenDone,
      },
    ],
    [brand1Setup, competitorsSetup, firstGenDone],
  );

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="min-h-[calc(100dvh-180px)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[640px]">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Get set up
          </p>
        </div>

        {/* Headline */}
        <h2 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
          Three steps to your first AI generation
        </h2>
        <p className="text-[13px] text-muted-foreground mt-2 leading-snug">
          A 12-minute setup unlocks better outputs and pre-tuned suggestions.
          Skip if you'd rather explore on your own.
        </p>

        {/* Progress bar */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {doneCount} / {steps.length}
          </span>
        </div>

        {/* Steps */}
        <ol className="mt-6 space-y-2.5 list-none">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={s.id}
                className={cn(
                  "relative flex items-start gap-4 rounded-2xl border bg-card p-4 transition-colors",
                  s.done
                    ? "border-primary/40 bg-primary/[0.04]"
                    : "border-border hover:border-foreground/20",
                )}
              >
                {/* Status icon */}
                <div className="shrink-0 mt-0.5">
                  {s.done ? (
                    <CheckCircle2
                      className="h-5 w-5 text-primary"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Circle
                      className="h-5 w-5 text-muted-foreground/40"
                      strokeWidth={2}
                    />
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-3.5 w-3.5 text-muted-foreground"
                      strokeWidth={2}
                    />
                    <p
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-wider",
                        s.done ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      Step {i + 1}
                      {s.done && " · Done"}
                    </p>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                      ~{s.estMin} min
                    </span>
                  </div>
                  <h3 className="mt-1 text-[14px] font-semibold text-foreground leading-snug">
                    {s.title}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">
                    {s.desc}
                  </p>
                  {!s.done && (
                    <Link
                      to={s.href}
                      className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {s.cta}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Escape hatch */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Skip setup · I'll figure it out
          </button>
        </div>
      </div>
    </div>
  );
}
