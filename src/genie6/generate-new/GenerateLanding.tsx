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
 * GenerateLanding — landing screen for /iq/genie6/generate.
 *
 * A-11.11 redesign per Maalik's UI feedback ("UI is generic, boring,
 * non-interactive"):
 *   - Dot-grid backdrop motif (Fabfunnel §4.1 ADOPT — distinctive AI-tool
 *     signal, lime-tinted at 6% opacity).
 *   - Per-CTA gradient + icon treatment so each tile carries its own visual
 *     identity instead of identical chrome.
 *   - Clearer visual hierarchy on the page header + helper copy.
 *   - Tiles get hover lift + gradient glow on the icon block + animated
 *     "Start" CTA arrow.
 *   - "More modes" tile uses a distinct dashed-border treatment so it
 *     doesn't compete with the 6 active CTAs.
 */

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  ShoppingBag,
  Target,
  Camera,
  Video,
  RefreshCw,
};

// Per-CTA visual identity — gradients are subtle (~30% saturation in light;
// design-system §4.1 says lime brand only as accent, neutrals for surface).
const CTA_GRADIENT: Record<string, string> = {
  "brand-ad": "from-lime-200/50 via-lime-300/40 to-lime-400/30",
  "product-ad": "from-amber-200/50 via-amber-300/40 to-amber-400/30",
  "affiliate-ad": "from-sky-200/50 via-sky-300/40 to-sky-400/30",
  "product-shoot": "from-rose-200/50 via-rose-300/40 to-rose-400/30",
  "ugc-video": "from-violet-200/50 via-violet-300/40 to-violet-400/30",
  variation: "from-emerald-200/50 via-emerald-300/40 to-emerald-400/30",
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
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Dot-grid backdrop — AI-tool motif at 6% opacity per Fabfunnel §4.1 */}
      <DotGridBackdrop />

      {/* Lime corner glow — subtle "ai lives here" signal */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex h-full flex-col p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-7 shrink-0 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground">
              Studio · new generation
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            What are you generating today?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
            Pick a mode. Smart defaults set up the form for you. Override
            anything before you hit Generate.
          </p>
        </header>

        {/* CTA grid — 3-column responsive */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
          {OUTSIDE_CTAS.map((cta) => (
            <CtaTile key={cta.id} cta={cta} onClick={() => handleClick(cta)} />
          ))}
          <MoreModesTile />
        </div>

        {/* Bottom hint strip */}
        <p className="mt-6 max-w-3xl text-[11px] text-muted-foreground/80">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono text-foreground">⌘</kbd>
          {" + "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-mono text-foreground">K</kbd>
          {" "}also opens the universal "+ New generation" overlay anywhere in Genie. Quicker than navigating here.
        </p>

        {/* Gate modal — shown for 5 of 6 CTAs (Variations skips per Rule 1) */}
        <GateModal
          cta={gateCta}
          open={!!gateCta}
          onOpenChange={(open) => !open && setGateCta(null)}
        />
      </div>
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
  const gradient = CTA_GRADIENT[cta.id] ?? CTA_GRADIENT["brand-ad"];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${cta.label} — ${cta.description}`}
      className={cn(
        "group relative flex flex-col items-stretch gap-0 overflow-hidden rounded-2xl border border-border bg-card text-left transition-all",
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      {/* Gradient header band with icon */}
      <div className={cn("relative h-20 bg-gradient-to-br", gradient)}>
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-xl bg-card/95 shadow-md ring-1 ring-border/40 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        {cta.kind === "preset" && (
          <span className="absolute right-3 top-3 rounded-full bg-card/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
            preset
          </span>
        )}
        {cta.skipGate && (
          <span className="absolute right-3 top-3 rounded-full bg-card/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
            no gate
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 space-y-1.5 p-4">
        <h2 className="text-base font-semibold text-foreground leading-tight">{cta.label}</h2>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{cta.description}</p>
      </div>

      {/* CTA row */}
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {cta.skipGate ? "skip gate" : "via gate"}
        </span>
        <span className="inline-flex items-center gap-0.5 font-medium text-muted-foreground transition-colors group-hover:text-primary">
          Start
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
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
        "group flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-4 text-left transition-colors",
        "min-h-[200px]",
        "hover:border-foreground/30 hover:bg-card",
        "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Plus className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">More modes</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Image-led, Brief-led, pinnable angles. Coming soon.
        </p>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        deferred
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

function DotGridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "radial-gradient(currentColor 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        color: "hsl(var(--foreground))",
      }}
    />
  );
}
