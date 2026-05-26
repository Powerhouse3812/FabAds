/**
 * UpsellRow — three locked-module discovery tiles on the AI-plan dashboard.
 *
 * Philosophy (Maalik, locked):
 *   On AI plan, Launch / Reports / Automation are gated. Surface what's
 *   locked AS quiet discovery tiles inside the dashboard. The user learns
 *   what they're missing without hitting a wall. Visual hierarchy carries
 *   the weight — not three competing primary CTAs.
 *
 * Layout (operator-class):
 *   ┌────────────────────────┐  ┌──────────────┐
 *   │   LAUNCH (lead tile)   │  │   REPORTS    │
 *   │   lg:col-span-2        │  │   compact    │
 *   │                        │  ├──────────────┤
 *   │                        │  │ AUTOMATION   │
 *   │   [text-link →]        │  │   compact    │
 *   └────────────────────────┘  └──────────────┘
 *                                              ┌──────────────────────┐
 *                                              │ Try Full · 7-day     │ ← single primary CTA
 *                                              │ trial →              │
 *                                              └──────────────────────┘
 *
 * Single-primary-CTA rule: the row owns ONE primary CTA. Per-tile actions
 * are quiet text-links only. No competing lime chips.
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpsellRowProps {
  className?: string;
}

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING, delay: i * 0.08 },
  }),
};

interface Tile {
  eyebrow: string;
  title: string;
  sub: string;
  href: string;
}

const LEAD_TILE: Tile = {
  eyebrow: "LAUNCH",
  title: "One-click campaign launch to Meta + Google",
  sub: "Currently locked on AI plan.",
  href: "/plans-v2?tier=growth&module=launch",
};

const SECONDARY_TILES: Tile[] = [
  {
    eyebrow: "REPORTS",
    title: "Hierarchical drill-down",
    sub: "Account → campaign → ad set → ad.",
    href: "/plans-v2?tier=growth&module=reports",
  },
  {
    eyebrow: "AUTOMATION",
    title: "Rule-based workflows",
    sub: "Pause, boost, and scale on conditions.",
    href: "/plans-v2?tier=growth&module=automation",
  },
];

function TileEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Lock className="h-3 w-3 text-foreground/45" strokeWidth={2.25} aria-hidden />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </span>
    </div>
  );
}

export function UpsellRow({ className }: UpsellRowProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Lead tile — Launch, takes 2/3 width on lg */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className={cn(
            "group relative flex flex-col rounded-xl border border-border/60 bg-background/40 p-4 lg:col-span-2",
            "transition-[border-color] duration-200 hover:border-border",
          )}
        >
          <TileEyebrow label={LEAD_TILE.eyebrow} />
          <h3 className="mt-2 text-[14px] font-semibold leading-snug text-foreground">
            {LEAD_TILE.title}
          </h3>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            {LEAD_TILE.sub}
          </p>
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={() => navigate(LEAD_TILE.href)}
              className={cn(
                "inline-flex items-center gap-1 text-[12px] font-medium text-foreground/70",
                "transition-colors hover:text-foreground",
                "focus-visible:outline-none focus-visible:underline",
              )}
            >
              Launch
              <ArrowRight className="h-3 w-3" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </motion.div>

        {/* Two stacked compact tiles — Reports + Automation */}
        <div className="flex flex-col gap-3 lg:col-span-1">
          {SECONDARY_TILES.map((tile, i) => (
            <motion.div
              key={tile.eyebrow}
              custom={i + 1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={cn(
                "group relative flex flex-1 flex-col rounded-xl border border-border/60 bg-background/40 p-3.5",
                "transition-[border-color] duration-200 hover:border-border",
              )}
            >
              <TileEyebrow label={tile.eyebrow} />
              <h3 className="mt-1.5 text-[13px] font-semibold leading-snug text-foreground">
                {tile.title}
              </h3>
              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                {tile.sub}
              </p>
              <div className="mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => navigate(tile.href)}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11.5px] font-medium text-foreground/65",
                    "transition-colors hover:text-foreground",
                    "focus-visible:outline-none focus-visible:underline",
                  )}
                >
                  {tile.eyebrow === "REPORTS" ? "Reports" : "Automation"}
                  <ArrowRight className="h-3 w-3" strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Row-level single primary CTA — right-aligned */}
      <div className="mt-4 flex items-center justify-end border-t border-border/40 pt-3">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/plans-v2?tier=growth&view=trial")}
        >
          Try Full plan · 7-day trial
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
