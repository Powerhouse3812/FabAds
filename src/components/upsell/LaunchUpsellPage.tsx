import { Link } from "react-router-dom";
import { CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Internal sub-components ─────────────────────────────────────────────────

interface StepNodeProps {
  done: boolean;
  locked?: boolean;
  label: string;
  sub: string;
}

function StepNode({ done, locked = false, label, sub }: StepNodeProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
      {done ? (
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-foreground" strokeWidth={2} />
        </div>
      ) : (
        <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/40 bg-card flex items-center justify-center">
          <Lock className="h-4 w-4 text-muted-foreground/50" strokeWidth={2} />
        </div>
      )}
      <span
        className={cn(
          "text-[12px] font-semibold leading-snug text-center",
          done ? "text-foreground" : "text-foreground/50",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[10px] leading-snug text-center",
          done ? "text-muted-foreground" : "text-muted-foreground/50",
        )}
      >
        {sub}
      </span>
    </div>
  );
}

interface StepConnectorProps {
  done: boolean;
}

function StepConnector({ done }: StepConnectorProps) {
  return (
    <div
      className={cn(
        "flex-1 mt-4",
        done
          ? "h-px bg-primary"
          : "border-t-2 border-dashed border-muted-foreground/30 bg-transparent",
      )}
    />
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface LaunchUpsellPageProps {
  className?: string;
}

export function LaunchUpsellPage({ className }: LaunchUpsellPageProps) {
  return (
    <div className={cn("max-w-xl mx-auto py-12 px-6", className)}>
      {/* Eyebrow */}
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50 mb-3">
        Upgrade · Launch
      </p>

      {/* Headline */}
      <h1 className="text-[22px] font-semibold leading-snug text-foreground mb-2">
        Your ads are sitting in Genie.
      </h1>

      {/* Sub-copy */}
      <p className="text-[13px] text-foreground/70 leading-relaxed">
        47 ads created this month.
      </p>
      <p className="text-[13px] text-foreground/70 leading-relaxed">
        None of them are live on Meta or TikTok yet.
      </p>

      {/* Hairline */}
      <div className="border-t border-border/40 mt-6 mb-6" />

      {/* Workflow visual */}
      <div className="flex items-start gap-0 my-6">
        <StepNode
          done={true}
          label="47 ads created"
          sub="Sitting in Genie"
        />
        <StepConnector done={true} />
        <StepNode
          done={true}
          label="3 accounts connected"
          sub="Meta, TikTok, NewsBreak"
        />
        <StepConnector done={false} />
        <StepNode
          done={false}
          locked={true}
          label="Publish to all 3"
          sub="Requires Growth"
        />
      </div>

      {/* Hairline */}
      <div className="border-t border-border/40 mt-6 mb-6" />

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <Link
          to="/plans-v2?tier=growth&view=trial"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-primary/90"
        >
          Start 14-day Growth trial
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
          Cancel any time · No card required
        </span>
      </div>

      {/* Bullets */}
      <ul className="mt-8 space-y-2.5 text-left border-t border-border/40 pt-6">
        {[
          "Push 50 ads across 12 accounts in one operation",
          "Round Robin creative distribution built in",
          "Schedule + warm-up windows — ads go live when your audience is active",
        ].map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-[12.5px] text-foreground/65 leading-snug"
          >
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
