import { ShoppingBag, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

type Mode = "ecom" | "affiliate";

interface ChooseModeProps {
  onPick: (mode: Mode) => void;
  onSkip: () => void;
}

const OPTIONS: {
  id: Mode;
  icon: typeof ShoppingBag;
  title: string;
  blurb: string;
  highlight: string;
}[] = [
  {
    id: "ecom",
    icon: ShoppingBag,
    title: "E-commerce",
    blurb: "Paste your store URL — we'll pull products, branding, and style.",
    highlight: "Best for Shopify, WooCommerce, Amazon stores",
  },
  {
    id: "affiliate",
    icon: Zap,
    title: "Affiliate / Ad Lab",
    blurb: "Pick a niche and posting platforms — we'll seed your ad angles.",
    highlight: "Best for affiliate marketers + creators",
  },
];

export function ChooseMode({ onPick, onSkip }: ChooseModeProps) {
  return (
    <div className="min-h-full bg-background">
      <StepNav active={0} />
      <div className="max-w-[880px] mx-auto px-6 py-10 pb-20">
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
        >
          Step 1 · Quick Start
        </Badge>
        <h1 className="text-3xl md:text-[38px] font-semibold tracking-tight">
          Quick <span className="text-foreground bg-primary/30 px-1.5 rounded">Start</span>
        </h1>
        <p className="text-[15px] text-muted-foreground mt-2">
          Get up and running in under a minute.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => onPick(opt.id)}
                className={cn(
                  "group text-left p-6 rounded-2xl border border-border bg-card",
                  "hover:border-primary/60 hover:bg-primary/[0.03] transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                )}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold mt-4">{opt.title}</h3>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                  {opt.blurb}
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-3 font-mono">
                  {opt.highlight}
                </p>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold mt-4 group-hover:gap-2 transition-all">
                  Start <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button variant="link" onClick={onSkip} className="text-[13px]">
            Skip for now — explore the dashboard →
          </Button>
          <p className="text-[11px] text-muted-foreground/80 mt-1.5">
            You can set up your brand right from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
