import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { setDemoDataOn } from "../hooks/useDemoData";

/**
 * Interactive guided empty state.
 *
 * Used across all "no data yet" surfaces in Genie 6 (Library, Assets/*,
 * Settings). Each surface passes its own copy + 2-3 action steps. Two
 * persistent affordances on every empty state:
 *  - "Try with demo data" → flips the demo-data toggle ON, fills the surface
 *    with curated mock data instantly. Lets users explore before committing.
 *  - The 2-3 surface-specific actions (e.g., "Add a brand", "Generate first ad").
 *
 * Visual: lime halo backdrop, animated step indicator, hover-glow CTAs.
 * Theme-aware (dark/light).
 */

export interface EmptyStateStep {
  /** Step heading like "Add your first brand" */
  title: string;
  /** Sub-line, optional — "Paste a URL, AI extracts everything" */
  description?: string;
  /** Click action */
  cta: string;
  /** Where the click goes — relative to /iq/genie6 */
  to: string;
  /** Optional Lucide icon component */
  Icon?: React.ComponentType<{ className?: string }>;
  /** If true, renders this step as the primary highlighted action */
  featured?: boolean;
  /** If the step is already complete in the user's flow, mark it green */
  done?: boolean;
}

interface EmptyStateOnboardingProps {
  /** Big headline — "No brands yet" / "Your library is empty" */
  title: string;
  /** Sub-headline */
  description: string;
  /** 2-3 onboarding step cards */
  steps: EmptyStateStep[];
  /** Optional: demo-toggle button text. Default: "Try with demo data" */
  demoToggleLabel?: string;
  /** Optional: extra footer content under the step grid */
  footer?: ReactNode;
}

export function EmptyStateOnboarding({
  title,
  description,
  steps,
  demoToggleLabel = "Try with demo data",
  footer,
}: EmptyStateOnboardingProps) {
  const navigate = useNavigate();

  return (
    <div className="g6-halo relative flex min-h-full flex-col">
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center">
        {/* Animated sparkle icon */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-g6-2xl bg-g6-primary-bg ring-1 ring-g6-primary-border">
            <Sparkles className="h-9 w-9 text-g6-primary" />
          </div>
          <span className="absolute -inset-2 rounded-g6-2xl ring-1 ring-g6-primary/30 animate-pulse" aria-hidden />
        </div>

        {/* Headline */}
        <div className="space-y-3 g6-fade-up">
          <div className="inline-flex items-center gap-2 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-g6-primary animate-pulse" />
            <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-secondary">
              fresh start · no data yet
            </span>
          </div>
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            {title}
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Numbered step cards */}
        <ol className="w-full grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 g6-fade-up" style={{ animationDelay: "120ms" }}>
          {steps.map((step, i) => (
            <li key={step.title} className="contents">
              <button
                type="button"
                onClick={() => navigate(step.to)}
                className={cn(
                  "g6-lift group relative flex flex-col items-start gap-3 rounded-g6-2xl border bg-g6-bg-container p-5 text-left transition-all",
                  step.featured
                    ? "border-g6-primary-border shadow-g6-md hover:shadow-g6-glow"
                    : "border-g6-border-secondary hover:border-g6-primary-border",
                  step.done && "opacity-60"
                )}
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full font-g6-mono text-g6-xs font-bold",
                    step.done ? "bg-g6-success text-g6-text-on-accent" :
                    step.featured ? "bg-g6-primary text-g6-text-on-accent" :
                    "bg-g6-bg-spotlight text-g6-text-secondary"
                  )}>
                    {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {step.Icon && <step.Icon className={cn("h-4 w-4", step.featured ? "text-g6-primary" : "text-g6-text-tertiary")} />}
                </div>

                <div className="space-y-1.5 w-full">
                  <h3 className="text-g6-base font-bold text-g6-text">{step.title}</h3>
                  {step.description && (
                    <p className="text-g6-xs text-g6-text-secondary leading-relaxed">{step.description}</p>
                  )}
                </div>

                <span className={cn(
                  "mt-auto inline-flex items-center gap-1 text-g6-sm font-medium transition-colors",
                  step.featured ? "text-g6-primary" : "text-g6-text-tertiary group-hover:text-g6-primary"
                )}>
                  {step.cta}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* Demo data toggle — always available */}
        <div className="g6-fade-up flex flex-col items-center gap-3 pt-2" style={{ animationDelay: "240ms" }}>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            or just want to look around?
          </p>
          <button
            type="button"
            onClick={() => setDemoDataOn(true)}
            className="inline-flex items-center gap-2 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-4 py-2 text-g6-sm font-semibold text-g6-text hover:bg-g6-primary-bg-hover transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-g6-primary" />
            {demoToggleLabel}
          </button>
          <p className="text-g6-xs text-g6-text-tertiary max-w-md">
            Fills every screen with curated demo brands, products, hooks &amp; outputs.
            Toggle off any time from the Assets header.
          </p>
        </div>

        {footer}
      </div>
    </div>
  );
}
