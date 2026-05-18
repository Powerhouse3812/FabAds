import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalTileProps {
  className?: string;
}

/**
 * SignalTile — the V2 dashboard's single hero "what's hot in your market" card.
 *
 * Replaces V1's 4-up SpotlightRow grid with ONE high-signal headline, styled
 * like a Bloomberg terminal alert or Stripe's "biggest customer signed up"
 * notification — full visual weight, immediate action.
 *
 * Hardcoded mock for now; wires up to the real signal feed later.
 * Click anywhere on the card → /insights-v2/feed.
 */
const SIGNAL = {
  brand: "Sleepyhead",
  brandColors: ["#1B3A57", "#0E2235"],
  insight: "Sleepyhead just scrapped value props — going lifestyle-first.",
  stats: "12 ads running · 4 angles",
  ageHours: 4,
  category: "competitor",
} as const;

export function SignalTile({ className }: SignalTileProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const isLive = SIGNAL.ageHours < 6;
  const ageLabel =
    SIGNAL.ageHours < 1
      ? "JUST NOW"
      : SIGNAL.ageHours === 1
        ? "1H AGO"
        : `${SIGNAL.ageHours}H AGO`;
  const brandInitial = SIGNAL.brand.charAt(0).toUpperCase();

  const handleOpen = () => navigate("/insights-v2/feed");

  return (
    <motion.section
      onClick={handleOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex h-full min-h-[340px] cursor-pointer flex-col",
        "rounded-2xl border border-border bg-card p-5",
        "transition-colors duration-200 hover:border-primary/40",
        className,
      )}
    >
      {/* Header row — eyebrow + LIVE pulse */}
      <header className="flex items-center justify-between">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Trending signal · {ageLabel}
        </p>
        {isLive && (
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-foreground">
              Live
            </span>
          </span>
        )}
      </header>

      {/* Visual zone — gradient backdrop + brand initial + COMPETITOR chip */}
      <div className="relative mt-4 h-[150px] overflow-hidden rounded-xl">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${SIGNAL.brandColors[0]} 0%, ${SIGNAL.brandColors[1]} 100%)`,
          }}
        />

        {/* Brand initial, faint + centered */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <span
            className="font-mono text-[120px] font-bold leading-none text-white/10 select-none"
            style={{ letterSpacing: "-0.04em" }}
          >
            {brandInitial}
          </span>
        </div>

        {/* COMPETITOR chip — glass, top-left */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center rounded-full bg-black/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            {SIGNAL.category}
          </span>
        </div>

        {/* Parallax shine on hover — single-pass radial sweep */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="shine"
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0, x: "-30%", y: "-30%" }}
              animate={{ opacity: 1, x: "30%", y: "30%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Headline insight */}
      <p className="mt-4 text-[13.5px] font-semibold leading-snug text-foreground">
        {SIGNAL.insight}
      </p>

      {/* Stat row */}
      <p className="mt-2 font-mono text-[10.5px] tabular-nums text-muted-foreground">
        {SIGNAL.stats}
      </p>

      {/* CTA */}
      <div className="mt-auto pt-4">
        <span className="inline-flex items-center gap-1 font-mono text-[11.5px] font-medium text-primary group-hover:underline">
          Open in Feed
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>
    </motion.section>
  );
}
