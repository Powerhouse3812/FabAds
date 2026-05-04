import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  Target,
  Camera,
  Video,
  RefreshCw,
  ChevronRight,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GateModal } from "./GateModal";
import { OUTSIDE_CTAS, type OutsideCtaDescriptor } from "./types";

/**
 * GenerateLanding — landing screen for /iq/genie6/generate (A-11.3).
 *
 * Renders the 6 default outside CTAs as a tile grid. Click flow:
 *   - Variations → direct route to /generate/variation (skipGate=true, Rule 1)
 *   - All others → opens the GateModal with pre-fills, user confirms,
 *     gate dispatches to the appropriate form route
 *
 * Mini-version of the Section 11.2 Home dashboard CTA grid. The full Home
 * rebuild is deferred to scope B (per Maalik). For scope A (Generate-only),
 * this is the entry surface when user clicks the Studio sub-nav item.
 *
 * Layout: 3-column responsive tile grid + a "More modes" stub link to the
 * deferred More-modes popover.
 */

// Local lucide icon registry — keeps OutsideCtaDescriptor.icon as a plain string
// in the type module without forcing a lucide import there.
const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  ShoppingBag,
  Target,
  Camera,
  Video,
  RefreshCw,
};

export function GenerateLanding() {
  const navigate = useNavigate();
  const [gateCta, setGateCta] = useState<OutsideCtaDescriptor | null>(null);

  const handleClick = (cta: OutsideCtaDescriptor) => {
    if (cta.skipGate) {
      // Rule 1: Variations bypasses gate — direct route.
      navigate(`/iq/genie6/generate/${cta.id}`);
      return;
    }
    setGateCta(cta);
  };

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6 shrink-0">
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Studio · new generation
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          What are you generating today?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          Pick a mode below. We'll set up the right form with smart defaults — change anything before you hit Generate.
        </p>
      </header>

      {/* CTA grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {OUTSIDE_CTAS.map((cta) => (
          <CtaTile key={cta.id} cta={cta} onClick={() => handleClick(cta)} />
        ))}
        <MoreModesTile />
      </div>

      {/* Gate modal — shown for 5 of 6 CTAs (Variations skips per Rule 1) */}
      <GateModal
        cta={gateCta}
        open={!!gateCta}
        onOpenChange={(open) => !open && setGateCta(null)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function CtaTile({
  cta,
  onClick,
}: {
  cta: OutsideCtaDescriptor;
  onClick: () => void;
}) {
  const Icon = ICONS[cta.icon] ?? Sparkles;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${cta.label} — ${cta.description}`}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-foreground">{cta.label}</h2>
          {cta.kind === "preset" && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              preset
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{cta.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
        Start
        <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

function MoreModesTile() {
  return (
    <button
      type="button"
      onClick={() =>
        alert(
          "More modes (Image-led / Brief-led / pinnable angles) — deferred from default 6, lands later. See Form Specs §0.1.",
        )
      }
      aria-label="More modes — deferred"
      className={cn(
        "group flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-5 text-left transition-colors",
        "hover:border-foreground/30",
        "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Plus className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">More modes</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Image-led, Brief-led, pinnable angles. Coming soon.
        </p>
      </div>
    </button>
  );
}
