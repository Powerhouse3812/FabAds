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

        {/* Middle preview: blurred-table preview */}
        <div className="mt-auto flex-1 flex flex-col justify-end gap-1 overflow-hidden rounded-lg border border-border/30 bg-muted/20 px-2 py-1.5">
          {/* Column headers */}
          <div className="flex items-center gap-1.5 border-b border-border/30 pb-1 mb-1">
            {["Account", "ROAS", "Spend"].map((h) => (
              <span key={h} className="flex-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground/60 text-center">
                {h}
              </span>
            ))}
          </div>
          {/* 3 blurred rows — grey rectangles of varying widths */}
          {[
            [80, 60, 90],
            [50, 70, 55],
            [85, 45, 75],
          ].map((widths, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5">
              {widths.map((w, j) => (
                <div key={j} className="flex-1 flex justify-center">
                  <span
                    aria-hidden
                    className="block h-1.5 rounded-full bg-foreground/15"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
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
          Agency buyers on Growth Auto-Pilot. Manual is 4 hrs you don't have.
        </p>

        {/* Middle preview: agency-time cost number */}
        <div className="mt-auto flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/40 border border-border/40 px-4 py-2">
            <span className="font-mono text-[22px] font-bold tabular-nums leading-none text-foreground">
              4 hrs
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground/60 leading-none">
              /week · saved
            </span>
          </div>
        </div>

        <div>
          <CtaPill label="Set up rules" />
        </div>
      </div>
    </div>
  );
}
