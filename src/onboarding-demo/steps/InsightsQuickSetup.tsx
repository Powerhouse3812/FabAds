import { useState } from "react";
import { ArrowRight, Eye, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InsightsQuickSetupProps {
  onContinue: (industry: string) => void;
}

/**
 * Quick-setup screen for the Industry Insights path. NO multi-step
 * wizard — just one field + chip shortcuts + a small "edit later"
 * footnote, per Maalik. Picking an industry seeds the My Feeds page.
 *
 * Industry list mirrors INSIGHT_INDUSTRIES in src/lib/insights-dummy-data
 * so the chip picks line up with the feed's filter chips downstream.
 */

const QUICK_INDUSTRIES = [
  "E-commerce",
  "SaaS",
  "Gaming",
  "Health & Wellness",
  "Finance",
  "Fashion",
  "Food & Beverage",
  "Education",
  "Travel",
  "Real Estate",
  "Automotive",
  "Entertainment",
  "Beauty",
  "Sports",
  "Technology",
];

export function InsightsQuickSetup({ onContinue }: InsightsQuickSetupProps) {
  const [industry, setIndustry] = useState("");
  const trimmed = industry.trim();

  const submit = () => {
    onContinue(trimmed || "E-commerce");
  };

  return (
    <div className="bg-background">
      <div className="max-w-[640px] mx-auto px-6 pt-10 pb-12">
        {/* Eyebrow */}
        <div className="text-center mb-4">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider bg-primary/10 border-primary/30 text-foreground px-3 py-1"
          >
            <Eye className="h-3 w-3 text-primary" />
            Industry Insights
          </Badge>
        </div>

        {/* Headline */}
        <div className="text-center mb-7">
          <h1 className="text-2xl md:text-[34px] font-semibold tracking-tight leading-[1.15] text-foreground mb-3">
            Pick an{" "}
            <span className="relative inline-block">
              <span className="relative z-10">industry</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-0.5 h-[8px] rounded-sm bg-primary/40"
              />
            </span>{" "}
            to follow
          </h1>
          <p className="text-[14px] text-muted-foreground max-w-[460px] mx-auto leading-relaxed">
            We'll surface winning ads, top performing landing pages, and
            emerging trends — updated daily.
          </p>
        </div>

        {/* Single field */}
        <label
          htmlFor="industry-input"
          className="block text-[13px] font-semibold text-foreground mb-2"
        >
          Industry <span className="text-rose-500">*</span>
        </label>
        <Input
          id="industry-input"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Type or pick below…"
          className="h-11 text-[14px]"
          autoFocus
        />

        {/* Quick chips — clicking fills the input. Active state matches input. */}
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-5 mb-2.5">
          Quick picks
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_INDUSTRIES.map((ind) => {
            const active = trimmed.toLowerCase() === ind.toLowerCase();
            return (
              <button
                key={ind}
                type="button"
                onClick={() => setIndustry(ind)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1.5 text-[12px] border transition-colors",
                  active
                    ? "bg-primary/20 border-primary/50 text-foreground font-semibold"
                    : "bg-card border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {ind}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-7 flex justify-end">
          <Button
            onClick={submit}
            disabled={!trimmed}
            size="lg"
            className="gap-1.5 h-11 px-6 text-[14px] font-semibold"
          >
            Find insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Edit-later footnote */}
        <div className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3 flex gap-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-foreground leading-tight">
              You can change this anytime
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">
              Edit your followed industries from{" "}
              <span className="font-mono text-foreground/80">My Feeds</span> →
              Settings → Edit industries, interests &amp; brands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
