/**
 * ModeLauncherBar — one-click mode picker for the dashboard.
 *
 * Why this exists
 * ---------------
 * The dashboard's old "+ Start a generation" CTA was a single generic button:
 * users had to click in, then pick a mode, then start. That's three decisions
 * dressed as one. Maalik's call was to surface all 6 generation modes as their
 * own clickable cards — the mode IS the entry point. One click → land in
 * Studio Alpha already pre-configured for that mode.
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
import { motion } from "framer-motion";
import {
  Sparkles,
  ShoppingBag,
  Target,
  Camera,
  Video,
  RefreshCw,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

// ─────────────────────────────────────────────────────────────────────────────
// Animation tunables
// ─────────────────────────────────────────────────────────────────────────────
const STAGGER_DELAY_MS = 60;
const CARD_SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };

export function ModeLauncherBar({ className }: ModeLauncherBarProps) {
  const navigate = useNavigate();

  const handleLaunch = (id: string, skipGate?: boolean) => {
    const dest = `/iq/genie6/studio-alpha?mode=${id}${
      skipGate ? "&skipGate=1" : ""
    }`;
    navigate(dest);
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        className,
      )}
      aria-label="Start a new generation"
    >
      {/* Header row — eyebrow + title left, secondary CTA right */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Generate
          </span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <h2 className="text-[12.5px] font-semibold text-foreground leading-none truncate">
            Pick a mode · one click
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/studio-alpha")}
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0"
        >
          Browse all
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* 6-card grid — short uniform rectangles, icon + label, no description */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {OUTSIDE_CTAS.map((cta, idx) => {
          const Icon = ICON_BY_NAME[cta.icon] ?? Sparkles;
          return (
            <motion.button
              key={cta.id}
              type="button"
              onClick={() => handleLaunch(cta.id, cta.skipGate)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...CARD_SPRING,
                delay: (idx * STAGGER_DELAY_MS) / 1000,
              }}
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              variants={{
                hover: { y: -1 },
              }}
              title={cta.description}
              className={cn(
                "group relative h-[68px] rounded-lg border border-border bg-background",
                "hover:bg-card hover:border-primary/40 transition-colors",
                "px-3 flex items-center gap-2.5 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
              aria-label={`Start ${cta.label} — ${cta.description}`}
            >
              {/* Icon disc */}
              <span
                className="shrink-0 h-8 w-8 rounded-full bg-primary/[0.12] group-hover:bg-primary/20 transition-colors flex items-center justify-center"
                aria-hidden
              >
                <Icon
                  className="h-3.5 w-3.5 text-primary"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </span>

              {/* Label */}
              <span className="text-[12px] font-semibold text-foreground leading-tight truncate flex-1">
                {cta.label}
              </span>

              {/* Hover arrow — replaces description for compactness */}
              <motion.span
                className="shrink-0 text-muted-foreground"
                initial={{ opacity: 0, x: -4 }}
                variants={{ hover: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.15 }}
                aria-hidden
              >
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-primary"
                  strokeWidth={2.5}
                />
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export default ModeLauncherBar;
