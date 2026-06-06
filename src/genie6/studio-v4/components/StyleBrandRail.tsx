import { useMemo } from "react";
import { Palette, Sparkles, Type, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands as ALL_BRANDS } from "@/mocks/shared";

/**
 * StyleBrandRail — Step 4 picker body for "Style · Brand" rail mode.
 *
 * Replaces the old "coming soon" StyleBrandStub with a concrete, composed
 * brand-personality panel. Auto-pulled from the brand profile:
 *   - Color palette (4–6 swatches, from brand.colors)
 *   - Tone / voice descriptors (chips, derived from brand.tone)
 *   - Typography line (brand.fonts.display / .body)
 *   - A short brand-voice sentence (brand.voice)
 *   - USP chips (brand.usps) when present
 *
 * Mostly read-only display — there's nothing to select here, so the footer
 * is a single "Done" (mirrors StyleBrandStub). When no brand resolves (or the
 * id isn't in the pool), we fall back to a concrete inline default so the
 * panel is never an empty placeholder.
 *
 * brands.ts (@/mocks/shared) DOES carry palette + tone + voice + fonts
 * fields (Brand type: colors[], tone, voice, fonts{display,body}, usps[]),
 * so this reads real data when a known brandId is passed.
 */

interface StyleBrandRailProps {
  onClose: () => void;
  /** Resolved from wizard.state.brandId. */
  brandId?: string | null;
}

interface BrandStyle {
  name: string;
  colors: string[];
  tone: string;
  voice: string;
  fontDisplay: string;
  fontBody: string;
  usps: string[];
}

/** Concrete fallback when no brand resolves — NOT a placeholder, a real-looking
 *  neutral house style so the panel always reads as populated. */
const FALLBACK_STYLE: BrandStyle = {
  name: "House style",
  colors: ["#0D0D0D", "#FFFFFF", "#C8FF3D", "#7A7A7A"],
  tone: "Confident, modern, no-nonsense",
  voice:
    "Clear and direct — leads with the benefit, skips the jargon, and earns trust fast.",
  fontDisplay: "Geist",
  fontBody: "Geist",
  usps: ["Benefit-first", "Honest", "Premium feel"],
};

/** Split a free-text tone string ("Honest, mom-friendly, no jargon") into
 *  chip-sized descriptors. Falls back to the whole string as one chip. */
function toneDescriptors(tone: string): string[] {
  const parts = tone
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return parts.length > 0 ? parts.slice(0, 6) : [tone];
}

export function StyleBrandRail({ onClose, brandId = null }: StyleBrandRailProps) {
  // Resolve via the brands array (mirrors AlphaStep3Configure's .find pattern;
  // getBrand isn't re-exported from @/mocks/shared, so we stay self-contained).
  const style: BrandStyle = useMemo(() => {
    const brand = brandId ? ALL_BRANDS.find((b) => b.id === brandId) : undefined;
    if (!brand) return FALLBACK_STYLE;
    return {
      name: brand.name,
      // Guard against an empty colors array — keep the swatch row populated.
      colors: brand.colors.length > 0 ? brand.colors.slice(0, 6) : FALLBACK_STYLE.colors,
      tone: brand.tone,
      voice: brand.voice,
      fontDisplay: brand.fonts.display,
      fontBody: brand.fonts.body,
      usps: brand.usps.slice(0, 6),
    };
  }, [brandId]);

  const descriptors = useMemo(() => toneDescriptors(style.tone), [style.tone]);
  const sameFont = style.fontDisplay === style.fontBody;

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Brand profile
          </p>
          <h3 className="text-sm font-semibold text-foreground">Style · Brand</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Scroll body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {/* "Auto-pulled" framing — concrete, not a placeholder. */}
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.06] px-2.5 py-1.5">
          <Sparkles className="h-3 w-3 shrink-0 text-primary" />
          <p className="min-w-0 text-[11px] leading-snug text-foreground/80">
            Auto-pulled from the{" "}
            <span className="font-semibold text-foreground">{style.name}</span>{" "}
            brand profile
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Palette */}
          <Section icon={Palette} title="Palette">
            <div className="flex flex-wrap gap-2">
              {style.colors.map((hex, i) => (
                <div key={`${hex}-${i}`} className="flex flex-col items-center gap-1">
                  <span
                    className="h-9 w-9 rounded-lg border border-border/60 shadow-sm"
                    style={{ backgroundColor: hex }}
                    aria-hidden
                  />
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">
                    {hex.replace("#", "")}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Tone / voice descriptors */}
          <Section icon={Volume2} title="Tone of voice">
            <div className="flex flex-wrap gap-1.5">
              {descriptors.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                >
                  {d}
                </span>
              ))}
            </div>
          </Section>

          {/* Brand voice sentence */}
          <Section icon={Sparkles} title="Brand voice">
            <p className="text-[12px] italic leading-relaxed text-foreground/90">
              “{style.voice}”
            </p>
          </Section>

          {/* Typography */}
          <Section icon={Type} title="Typography">
            <div className="flex flex-col gap-1">
              {sameFont ? (
                <p className="text-[12px] text-foreground/90">
                  <span className="font-semibold">{style.fontDisplay}</span>
                  <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Display + body
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-[12px] text-foreground/90">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Display
                    </span>{" "}
                    <span className="font-semibold">{style.fontDisplay}</span>
                  </p>
                  <p className="text-[12px] text-foreground/90">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Body
                    </span>{" "}
                    <span className="font-semibold">{style.fontBody}</span>
                  </p>
                </>
              )}
            </div>
          </Section>

          {/* USPs — only when present. */}
          {style.usps.length > 0 && (
            <Section icon={Sparkles} title="Key claims">
              <div className="flex flex-wrap gap-1.5">
                {style.usps.map((u) => (
                  <span
                    key={u}
                    className="inline-flex items-center rounded-full bg-primary/[0.10] px-2.5 py-1 text-[11px] font-medium text-primary"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Sticky footer — read-only, single Done (mirrors StyleBrandStub). */}
      <footer className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Read-only · applied on generate
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Done
        </button>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * Section — labelled block: lime-tinted icon + mono uppercase eyebrow,
 * then body. Matches the dense card-section rhythm used across the rails.
 * ────────────────────────────────────────────────────────────────────── */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-border/40 bg-card/60 p-2.5 backdrop-blur-sm")}>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-primary" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
