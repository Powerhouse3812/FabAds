import { Play, Sparkles, TrendingUp, ArrowRight, RefreshCw, Eraser, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SubModePreview — distinctive per-sub-mode mockup tile (A-11.17).
 *
 * Replaces the Unsplash photo previews. Per Maalik: "real images ki wjh se
 * ab bohot bekar sa lg rha hai, Templates jaisa dikh rha hai."
 *
 * Now: each sub-mode has a unique abstract mockup composed of gradient
 * + bold typography + frame element + lime accents. AI-tool aesthetic
 * (Fabfunnel §4.1 — "Generative depth in empty states. Lime tinted,
 * geometric."). No photos.
 *
 * 5 base variants, configured per sub-mode:
 *   - "type-led" — big bold output-name type centered
 *   - "phone" — 9:16 phone outline + avatar dot + play button (video modes)
 *   - "stat" — big number + label (performance / refresh)
 *   - "grid" — multiplier mosaic (variations / image-to-ad)
 *   - "tool" — split / pattern / arrow (bg-remover / bg-swap)
 */

type PreviewVariant = "type-led" | "phone" | "stat" | "grid" | "tool";

interface PreviewConfig {
  variant: PreviewVariant;
  /** Tailwind gradient classes, applied to the bg layer */
  gradient: string;
  /** Eyebrow + title + tagline shown for "type-led" / "stat" / general use */
  eyebrow?: string;
  title?: string;
  tagline?: string;
  /** Optional extra props per-variant */
  stat?: { value: string; sub: string };
  gridLabel?: string;
  toolKind?: "bg-remove" | "bg-swap";
}

const PREVIEW_CONFIG: Record<string, PreviewConfig> = {
  // BRAND CATEGORY ─────────────────────────────────────────
  "brand-focused": {
    variant: "type-led",
    gradient: "from-lime-200/70 via-lime-300/40 to-lime-100/20",
    eyebrow: "Output preview",
    title: "BRAND",
    tagline: "identity · voice · tone",
  },
  "product-focused": {
    variant: "type-led",
    gradient: "from-amber-200/70 via-amber-300/40 to-amber-100/20",
    eyebrow: "Output preview",
    title: "PRODUCT × BRAND",
    tagline: "anchored · contextual",
  },
  "product-shoot": {
    variant: "type-led",
    gradient: "from-rose-100/70 via-rose-200/40 to-stone-100/30",
    eyebrow: "Asset preview",
    title: "STUDIO",
    tagline: "clean · staged · transparent",
  },

  // AD CATEGORY ────────────────────────────────────────────
  "product-ad": {
    variant: "type-led",
    gradient: "from-amber-200/70 via-orange-300/40 to-amber-100/20",
    eyebrow: "Output preview",
    title: "PRODUCT AD",
    tagline: "sell · anchor · convert",
  },
  "performance-ad": {
    variant: "stat",
    gradient: "from-sky-200/70 via-sky-300/40 to-sky-100/20",
    eyebrow: "Performance preview",
    title: "ROAS 4.2×",
    tagline: "stat-led · direct response",
    stat: { value: "4.2×", sub: "ROAS · projected" },
  },
  "brand-ad": {
    variant: "type-led",
    gradient: "from-lime-200/70 via-emerald-300/40 to-lime-100/20",
    eyebrow: "Hero preview",
    title: "[BRAND] AD",
    tagline: "hero · billboard-style",
  },

  // QUICK MODES ────────────────────────────────────────────
  "ugc-video": {
    variant: "phone",
    gradient: "from-violet-200/70 via-violet-300/40 to-fuchsia-100/20",
    tagline: "9:16 · talking-head",
  },
  "variations": {
    variant: "grid",
    gradient: "from-emerald-200/60 via-emerald-300/35 to-emerald-100/20",
    gridLabel: "5 × 3 = 15",
  },
  "image-to-ad": {
    variant: "grid",
    gradient: "from-fuchsia-200/60 via-fuchsia-300/35 to-pink-100/20",
    gridLabel: "1 → 4",
  },
  "bg-remover": {
    variant: "tool",
    gradient: "from-zinc-100/80 via-zinc-200/40 to-stone-100/30",
    toolKind: "bg-remove",
  },
  "bg-swap": {
    variant: "tool",
    gradient: "from-stone-200/60 via-amber-200/40 to-rose-100/30",
    toolKind: "bg-swap",
  },
  "refresh-winner": {
    variant: "stat",
    gradient: "from-yellow-200/70 via-amber-300/40 to-orange-100/20",
    eyebrow: "Refresh preview",
    title: "WINNER+",
    stat: { value: "+18%", sub: "CTR refresh · projected" },
  },
};

export interface SubModePreviewProps {
  subModeId: string;
  className?: string;
}

export function SubModePreview({ subModeId, className }: SubModePreviewProps) {
  const cfg = PREVIEW_CONFIG[subModeId];

  // Fallback for unknown sub-modes
  if (!cfg) {
    return (
      <div className={cn("aspect-[4/3] w-full bg-gradient-to-br from-muted/60 to-muted/20", className)} />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br",
        cfg.gradient,
        className,
      )}
    >
      {/* Subtle dot pattern overlay — AI-tool depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          color: "hsl(var(--foreground))",
        }}
      />

      {cfg.variant === "type-led" && <TypeLedVariant cfg={cfg} />}
      {cfg.variant === "phone" && <PhoneVariant cfg={cfg} />}
      {cfg.variant === "stat" && <StatVariant cfg={cfg} />}
      {cfg.variant === "grid" && <GridVariant cfg={cfg} />}
      {cfg.variant === "tool" && <ToolVariant cfg={cfg} />}

      {/* Lime corner sparkle accent — AI tool signature */}
      <div className="absolute right-2 top-2">
        <Sparkles className="h-3 w-3 text-primary/70" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Variant: type-led — big output name + tagline.
 * ───────────────────────────────────────────────────────── */
function TypeLedVariant({ cfg }: { cfg: PreviewConfig }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className="text-center space-y-1">
        {cfg.eyebrow && (
          <p className="text-[8px] font-mono uppercase tracking-[0.22em] text-foreground/50">
            {cfg.eyebrow}
          </p>
        )}
        <h3 className="text-xl font-black tracking-tight text-foreground leading-none">
          {cfg.title}
        </h3>
        <div className="mx-auto h-0.5 w-7 bg-primary/80 rounded-full" />
        {cfg.tagline && (
          <p className="text-[10px] italic text-foreground/65 leading-snug">
            "{cfg.tagline}"
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Variant: phone — 9:16 outline + avatar dot + play btn.
 * ───────────────────────────────────────────────────────── */
function PhoneVariant({ cfg }: { cfg: PreviewConfig }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-1.5">
        {/* Phone frame */}
        <div className="relative h-24 w-14 rounded-lg border-2 border-foreground/30 bg-card/40 backdrop-blur-sm overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-6 rounded-b-md bg-foreground/30" />
          {/* Avatar dot */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/30 ring-2 ring-card/80">
            <div className="h-2 w-2 rounded-full bg-foreground/40" />
          </div>
          {/* Play button */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80">
            <Play className="h-2.5 w-2.5 text-card fill-card" />
          </div>
          {/* Caption stripes */}
          <div className="absolute bottom-9 left-1.5 right-1.5 space-y-0.5">
            <div className="h-0.5 w-full rounded-full bg-foreground/20" />
            <div className="h-0.5 w-2/3 rounded-full bg-foreground/15" />
          </div>
        </div>
        {cfg.tagline && (
          <p className="text-[9px] font-mono uppercase tracking-wider text-foreground/55">
            {cfg.tagline}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Variant: stat — big number + sub-line, performance vibe.
 * ───────────────────────────────────────────────────────── */
function StatVariant({ cfg }: { cfg: PreviewConfig }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-end gap-2">
        {/* Stat block */}
        <div className="text-left space-y-0.5">
          {cfg.eyebrow && (
            <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-foreground/50">
              {cfg.eyebrow}
            </p>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-foreground tabular-nums">
              {cfg.stat?.value ?? cfg.title}
            </span>
            <TrendingUp className="h-4 w-4 text-primary -translate-y-1" />
          </div>
          {cfg.stat?.sub && (
            <p className="text-[9px] font-mono text-foreground/55">{cfg.stat.sub}</p>
          )}
        </div>
      </div>
      {/* Refresh icon for refresh-winner */}
      {cfg.eyebrow?.toLowerCase().includes("refresh") && (
        <RefreshCw className="absolute bottom-2 left-2 h-3.5 w-3.5 text-foreground/40" />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Variant: grid — multiplier mosaic for variations / i2a.
 * ───────────────────────────────────────────────────────── */
function GridVariant({ cfg }: { cfg: PreviewConfig }) {
  // 4×3 grid of mini frames
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 w-5 rounded-sm bg-foreground/15",
              i % 5 === 0 && "bg-primary/40",
            )}
          />
        ))}
      </div>
      {cfg.gridLabel && (
        <p className="text-[10px] font-mono uppercase tracking-wider text-foreground/55">
          {cfg.gridLabel}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Variant: tool — bg-remove (checker) or bg-swap (split).
 * ───────────────────────────────────────────────────────── */
function ToolVariant({ cfg }: { cfg: PreviewConfig }) {
  if (cfg.toolKind === "bg-swap") {
    return (
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-zinc-200/40 flex items-center justify-center">
          <div className="h-10 w-8 rounded bg-foreground/30" />
        </div>
        <div className="flex items-center justify-center px-2">
          <ArrowRight className="h-4 w-4 text-foreground/60" />
        </div>
        <div className="flex-1 bg-amber-100/60 flex items-center justify-center">
          <div className="h-10 w-8 rounded bg-foreground/30" />
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-card/85 px-2 py-0.5 backdrop-blur-sm shadow-sm">
          <Layers className="h-2.5 w-2.5 text-foreground/70" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-foreground/70">
            bg swap
          </span>
        </div>
      </div>
    );
  }
  // bg-remove (checker pattern + cutout)
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Checker pattern (transparent indicator) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(45deg, hsl(var(--foreground)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--foreground)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--foreground)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--foreground)) 75%)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
        }}
      />
      {/* Cutout silhouette */}
      <div className="relative h-14 w-12 rounded-md bg-foreground/70 shadow-md" />
      {/* PNG label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 backdrop-blur-sm shadow-sm">
        <Eraser className="h-2.5 w-2.5 text-foreground/70" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-foreground/70">
          png · transparent
        </span>
      </div>
    </div>
  );
}
