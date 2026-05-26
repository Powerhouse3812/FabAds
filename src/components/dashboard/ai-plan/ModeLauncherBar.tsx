/**
 * ModeLauncherBar — one-click mode picker for the AI-plan dashboard.
 *
 * Why this exists
 * ---------------
 * The dashboard's old "+ Start a generation" CTA was a single generic button:
 * users had to click in, then pick a mode, then start. That's three decisions
 * dressed as one. Maalik's call was to surface all 6 generation modes as their
 * own clickable cards — the mode IS the entry point. One click → land in
 * Studio Alpha already pre-configured for that mode.
 *
 * v3 (May 2026) — Figma redesign
 * -------------------------------
 * Flattens the previous "eyebrow + 2-row grid" into a single horizontal row of
 * 6 mode cards. Header gets a green inline tagline ("Pick a mode · and create")
 * and a quiet "View all →" link. Each card is a 70px pill with a lime-tinted
 * icon circle, a bold label, and a chevron that fades in on hover.
 *
 * Motif extraction (don't copy):
 *   - Notion "New page" mode picker — distinct icons, not a dropdown
 *   - Linear "+" menu — keyboard-accessible mode list, one item per row
 *   - Figma "Start a new design file" tiles — visual primary, copy secondary
 *
 * Source of truth
 * ---------------
 * `OUTSIDE_CTAS` from `@/genie6/generate-new/types` defines the canonical 6
 * modes (order + ids + descriptions + `skipGate` flag). We map that list —
 * never hardcode a copy — so any future mode added there auto-appears here.
 *
 * Destination
 * -----------
 * Each card navigates to `/iq/genie6/studio-alpha?mode={id}`. Variations
 * (`skipGate: true`) appends `&skipGate=1` so Studio Alpha can bypass the
 * gate modal that other modes use to resolve presets.
 */
import {
  Sparkles,
  ShoppingBag,
  Target,
  Camera,
  Video,
  RefreshCw,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { OUTSIDE_CTAS } from "@/genie6/generate-new/types";

interface ModeLauncherBarProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon resolution — the source list stores icon names as strings (so it stays
// a pure data module). Map them to actual lucide components here.
// ─────────────────────────────────────────────────────────────────────────────
const ICON_BY_NAME: Record<string, LucideIcon> = {
  Sparkles,
  ShoppingBag,
  Target,
  Camera,
  Video,
  RefreshCw,
};

export function ModeLauncherBar({ className }: ModeLauncherBarProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 flex flex-col gap-3",
        className,
      )}
      aria-label="Start a new generation"
    >
      {/* Header row — eyebrow + green tagline left, quiet View all right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Generate
          </span>
          <span aria-hidden className="h-3 w-px bg-border" />
          <span className="text-[11px] font-medium leading-none text-[#779E1C] truncate">
            Pick a mode · and create
          </span>
        </div>
        <Link
          to="/iq/genie6/studio-alpha"
          className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors shrink-0 inline-flex items-center gap-1"
        >
          View all
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Mode card grid — single horizontal row on lg, responsive collapse */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {OUTSIDE_CTAS.map((cta) => {
          const Icon = ICON_BY_NAME[cta.icon] ?? Sparkles;
          const dest = `/iq/genie6/studio-alpha?mode=${cta.id}${
            cta.skipGate ? "&skipGate=1" : ""
          }`;
          return (
            <Link
              key={cta.id}
              to={dest}
              title={cta.description}
              aria-label={`Start ${cta.label} — ${cta.description}`}
              className={cn(
                "group border border-border/60 rounded-2xl px-3 py-3",
                "flex items-center gap-2.5",
                "hover:border-foreground/20 hover:bg-muted/[0.4] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
              style={{ minHeight: 70 }}
            >
              {/* Icon disc — lime-tinted circle */}
              <span
                aria-hidden
                className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
              >
                <Icon
                  className="h-3.5 w-3.5 text-[#779E1C]"
                  strokeWidth={2.25}
                />
              </span>

              {/* Label — Geist 600 15px */}
              <span className="text-[15px] font-semibold text-foreground leading-tight truncate flex-1">
                {cta.label}
              </span>

              {/* Hover chevron — pushed to end via flex-1 on label */}
              <ChevronRight
                aria-hidden
                className="h-3.5 w-3.5 text-foreground/35 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                strokeWidth={2}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ModeLauncherBar;
