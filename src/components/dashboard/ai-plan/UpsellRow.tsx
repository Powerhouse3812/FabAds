/**
 * UpsellRow — three locked-module discovery cards on the AI-plan dashboard.
 *
 * Per Maalik's finalised Figma (2026-05-26 override):
 *   Layout is 3 EQUAL cards in a single row (grid grid-cols-1 lg:grid-cols-3).
 *   Each card carries its own primary lime-pill CTA — Maalik's explicit
 *   intent. Three distinct visual genres: spatial/quantitative, data-preview,
 *   interface-preview.
 */
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
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
      {/* Card 1 — LAUNCH · Genre: spatial/quantitative */}
      <div
        className={cn(
          "flex h-44 flex-col gap-2 rounded-2xl border border-border/60 p-4",
          "bg-gradient-to-br from-primary/[0.04] to-card",
        )}
      >
        <CardEyebrow label="UPGRADE · LAUNCH" />
        <h3 className="text-[13px] font-bold leading-snug text-foreground">
          1 of 12 accounts reached.
        </h3>
        <p className="text-[11px] font-normal leading-snug text-muted-foreground">
          11 waiting for Growth.
        </p>

        {/* Account grid visual — 3 rows × 4 cols of small squares */}
        <div className="mt-auto grid grid-cols-4 gap-1 w-fit mx-auto mb-2">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className={cn(
                "h-5 w-5 rounded flex items-center justify-center",
                i === 0
                  ? "bg-primary ring-1 ring-primary/40"
                  : "bg-muted/40 ring-1 ring-border/40",
              )}
            >
              {i !== 0 && (
                <svg className="h-2 w-2 text-muted-foreground/30" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 5V4a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <CtaPill label="Try Growth · 14-day trial" />
        </div>
      </div>

      {/* Card 2 — REPORTS · Genre: data-preview (card IS the table) */}
      <div className={cn(
        "flex h-44 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
      )}>
        {/* Table header — acts as card header */}
        <div className="grid grid-cols-3 border-b border-border/40 bg-muted/20 px-3 py-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-muted-foreground/50" strokeWidth={2.25} aria-hidden />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
              Reports
            </span>
          </div>
          {["ROAS", "Spend"].map(h => (
            <span key={h} className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground/50 text-right">
              {h}
            </span>
          ))}
        </div>

        {/* Data rows */}
        <div className="flex-1 overflow-hidden px-3 py-1.5 space-y-1.5">
          {[
            [80, 65, 75],
            [55, 80, 50],
            [90, 45, 85],
            [65, 70, 60],
          ].map((widths, i) => (
            <div key={i} className="grid grid-cols-3 items-center gap-2">
              {widths.map((w, j) => (
                <div key={j} className={j === 0 ? "" : "flex justify-end"}>
                  <span
                    aria-hidden
                    className="block h-1.5 rounded-full bg-foreground/[0.09]"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* CTA at bottom — full-width sticky */}
        <div className="border-t border-border/30 px-3 py-2 mt-auto shrink-0">
          <CtaPill label="See sample report" href={REPORTS_CTA_HREF} />
        </div>
      </div>

      {/* Card 3 — AUTOMATION · Genre: interface-preview (locked rule builder) */}
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
          Set a rule. It runs every 6 hours.
        </p>

        {/* Rule builder interface preview */}
        <div className="mt-auto mb-2 flex flex-col gap-1.5">
          {/* IF row */}
          <div className="flex items-center gap-1.5 opacity-50">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60 shrink-0">
              IF
            </span>
            <div className="flex-1 h-7 rounded-md border border-border/60 bg-muted/30 flex items-center justify-between px-2">
              <span className="font-mono text-[9.5px] text-foreground/50">ROAS &lt; 1.2</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground/40" strokeWidth={2} aria-hidden />
            </div>
          </div>
          {/* THEN row */}
          <div className="flex items-center gap-1.5 opacity-50">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60 shrink-0">
              THEN
            </span>
            <div className="flex-1 h-7 rounded-md border border-border/60 bg-muted/30 flex items-center justify-between px-2">
              <span className="font-mono text-[9.5px] text-foreground/50">Pause ad</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground/40" strokeWidth={2} aria-hidden />
            </div>
          </div>
          {/* Lock overlay strip */}
          <div className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-muted-foreground/40" strokeWidth={2.2} aria-hidden />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground/40">
              Locked · requires Growth
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
