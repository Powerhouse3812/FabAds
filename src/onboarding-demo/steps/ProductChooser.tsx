import { ArrowRight, Check, Sparkles, Eye, Zap, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductChooserProps {
  onPickGenie: () => void;
  /** Industry Insights is currently disabled — no callback wired. */
}

interface ProductOption {
  id: "genie" | "insights";
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  desc: string;
  features: string[];
  ctaLabel: string;
  disabled?: boolean;
}

const OPTIONS: ProductOption[] = [
  {
    id: "genie",
    icon: Sparkles,
    title: "Setup your Genie",
    subtitle: "AI Creative Generation",
    desc:
      "Generate high performing ad creatives with AI. Static images, videos, and carousel ads — ready to launch in under 60 seconds.",
    features: [
      "AI powered creatives",
      "Bulk launch ready",
      "Multi platform formats",
      "Brand kit integration",
    ],
    ctaLabel: "Setup Genie",
  },
  {
    id: "insights",
    icon: Eye,
    title: "Industry Insights",
    subtitle: "Competitor Intelligence",
    desc:
      "Spy on what your competitors are running. See their top performing ads, landing pages, and creative strategies — updated daily.",
    features: [
      "Competitor ad library",
      "Winning creative alerts",
      "Landing page analysis",
      "Trend detection",
    ],
    ctaLabel: "Setup Insights",
    disabled: true,
  },
];

/**
 * Pre-wizard product chooser. Plays after Welcome and before the
 * 5-step setup wizard (Choose Mode → Country → Input → Processing →
 * Done). Two options:
 *   - Genie (AI Creative Generation) — clickable, starts the wizard
 *   - Industry Insights — disabled per Maalik (coming soon)
 *
 * Light mode + Fabfunnel tokens. No animation here — straight render
 * so it sits cleanly between the celebratory Welcome and the wizard
 * stepper.
 */
export function ProductChooser({ onPickGenie }: ProductChooserProps) {
  const handleClick = (opt: ProductOption) => {
    if (opt.disabled) return;
    if (opt.id === "genie") onPickGenie();
  };

  return (
    <div className="bg-background">
      <div className="max-w-[820px] mx-auto px-6 pt-10 pb-12">
        {/* Eyebrow */}
        <div className="text-center mb-5">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase font-mono bg-card border-border text-muted-foreground px-3 py-1"
          >
            <Zap className="h-3 w-3 text-primary" />
            One more thing
          </Badge>
        </div>

        {/* Headline */}
        <div className="text-center mb-9">
          <h1 className="text-2xl md:text-[36px] font-semibold tracking-tight leading-[1.15] text-foreground mb-3">
            What do you want to do{" "}
            <span className="relative inline-block">
              <span className="relative z-10">first</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-1 h-[8px] rounded-sm bg-primary/40"
              />
            </span>
            ?
          </h1>
          <p className="text-[14px] text-muted-foreground max-w-[460px] mx-auto leading-relaxed">
            Pick one to get started — you can always access both from your
            dashboard.
          </p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const disabled = !!opt.disabled;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleClick(opt)}
                disabled={disabled}
                aria-disabled={disabled}
                className={cn(
                  "group relative text-left rounded-2xl border bg-card transition-all p-6",
                  "flex flex-col gap-4",
                  disabled
                    ? "border-border opacity-60 cursor-not-allowed"
                    : "border-border hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                )}
              >
                {disabled && (
                  <Badge
                    variant="outline"
                    className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider bg-muted border-border text-muted-foreground inline-flex items-center gap-1 px-2 py-0.5"
                  >
                    <Lock className="h-2.5 w-2.5" />
                    Coming soon
                  </Badge>
                )}

                {/* Icon + title row */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl inline-flex items-center justify-center shrink-0 border-2",
                      disabled
                        ? "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                        : "border-primary bg-primary/10 text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold tracking-tight text-foreground leading-tight">
                      {opt.title}
                    </h3>
                    <p
                      className={cn(
                        "text-[11.5px] font-semibold tracking-wide mt-0.5",
                        disabled
                          ? "text-muted-foreground"
                          : "text-primary",
                      )}
                    >
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {opt.desc}
                </p>

                {/* Feature list */}
                <ul className="flex flex-col gap-1.5">
                  {opt.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-[12.5px] text-foreground"
                    >
                      <Check
                        className={cn(
                          "h-3 w-3 shrink-0",
                          disabled ? "text-muted-foreground" : "text-primary",
                        )}
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div
                  className={cn(
                    "mt-auto pt-2 flex items-center gap-1.5 text-[13.5px] font-bold tracking-tight",
                    disabled
                      ? "text-muted-foreground"
                      : "text-foreground group-hover:gap-2.5 transition-all",
                  )}
                >
                  {opt.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-[12px] text-muted-foreground mt-6">
          You'll have access to everything · This just sets up your first
          workflow
        </p>
      </div>
    </div>
  );
}
