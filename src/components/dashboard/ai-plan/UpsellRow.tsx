/**
 * UpsellRow — three locked-module discovery cards on the AI-plan dashboard.
 *
 * Per Maalik's finalised Figma (2026-05-26 override):
 *   Layout is 3 EQUAL cards in a single row (grid grid-cols-1 lg:grid-cols-3).
 *   Each card carries its own primary lime-pill CTA — Maalik's explicit
 *   intent. Per-card middle "preview" visual (platform icons / bar chart /
 *   sliders) makes the locked module tangible at a glance.
 */
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Facebook,
  Lock,
  Music,
  Newspaper,
  Sliders,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UpsellRowProps {
  className?: string;
}

const CTA_HREF = "/plans-v2?tier=growth&view=trial";
const REPORTS_CTA_HREF = "/plans-v2?tier=growth&view=trial&featureKey=reports";

function CardEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Lock
        className="h-3 w-3 text-muted-foreground/70"
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function CtaPill({ label, href = CTA_HREF }: { label: string; href?: string }) {
  return (
    <Link
      to={href}
      className={cn(
        "self-start inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5",
        "text-[11.5px] font-bold text-foreground transition-colors hover:bg-primary/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      {label}
      <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
    </Link>
  );
}

export function UpsellRow({ className }: UpsellRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 lg:grid-cols-3",
        className,
      )}
    >
      {/* Card 1 — LAUNCH */}
      <div
        className={cn(
          "flex h-44 flex-col gap-2 rounded-2xl border border-border/60 p-4",
          "bg-gradient-to-br from-primary/[0.04] to-card",
        )}
      >
        <CardEyebrow label="UPGRADE · LAUNCH" />
        <h3 className="text-[13px] font-bold leading-snug text-foreground">
          50 ads, 12 accounts, one click.
        </h3>
        <p className="text-[11px] font-normal leading-snug text-muted-foreground">
          Or 50 separate trips to Ads Manager. You pick.
        </p>

        {/* Middle preview: 3 platform circles + chevron + lime highlight */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card">
            <Facebook className="h-3.5 w-3.5 text-foreground/70" strokeWidth={2} aria-hidden />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card">
            <Music className="h-3.5 w-3.5 text-foreground/70" strokeWidth={2} aria-hidden />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card">
            <Newspaper className="h-3.5 w-3.5 text-foreground/70" strokeWidth={2} aria-hidden />
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.25} aria-hidden />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} aria-hidden />
          </div>
        </div>

        <div className="mt-auto">
          <CtaPill label="Try Growth · 14-day trial" />
        </div>
      </div>

      {/* Card 2 — REPORTS */}
      <div
        className={cn(
          "flex h-44 flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4",
        )}
      >
        <CardEyebrow label="UPGRADE · REPORTS" />
        <h3 className="text-[13px] font-bold leading-snug text-foreground">
          15 ad accounts, one ROAS row.
        </h3>
        <p className="text-[11px] font-normal leading-snug text-muted-foreground">
          Multi-account totals without a CSV export to Sheets.
        </p>

        {/* Middle preview: 4 vertical bars simulating bar chart */}
        <div className="mt-2 flex items-end justify-center gap-1.5">
          <span aria-hidden className="h-2 w-3 rounded-full bg-foreground/70" />
          <span aria-hidden className="h-3 w-3 rounded-full bg-primary" />
          <span aria-hidden className="h-1.5 w-3 rounded-full bg-foreground/40" />
          <span aria-hidden className="h-3 w-3 rounded-full bg-foreground/80" />
        </div>

        <div className="mt-auto">
          <CtaPill label="See sample report" href={REPORTS_CTA_HREF} />
        </div>
      </div>

      {/* Card 3 — AUTOMATION */}
      <div
        className={cn(
          "flex h-44 flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4",
        )}
      >
        <CardEyebrow label="UPGRADE · AUTOMATION" />
        <h3 className="text-[13px] font-bold leading-snug text-foreground">
          Auto-pause losers. Scale winners.
        </h3>
        <p className="text-[11px] font-normal leading-snug text-muted-foreground">
          Rules-based optimization while you sleep — no Excel scripting.
        </p>

        {/* Middle preview: sliders square w/ lime sparkle overlay */}
        <div className="mt-2 flex justify-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-card">
            <Sliders className="h-5 w-5 text-foreground/80" strokeWidth={2} aria-hidden />
            <span
              aria-hidden
              className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary"
            >
              <Sparkles className="h-2.5 w-2.5 text-foreground" strokeWidth={2.5} />
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <CtaPill label="Set up rules" />
        </div>
      </div>
    </div>
  );
}
