import { Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubModeTile } from "./SubModeTile";
import type { CategoryDescriptor } from "../types";

/**
 * CategoryCard — V1 (stacked) parent card.
 *
 * A-11.17 restore: V1 had been over-stripped in A-11.15. Per Maalik:
 * "phle wala variant wal looking dull now, keep it as it was earlier".
 * Gradient header bands, accent eyebrow, hover-lift interactivity restored.
 *
 * Design: a colored gradient header zone (lime / amber / sky per category)
 * carries the eyebrow + label + description, with a subtle abstract pattern
 * overlay for AI-tool depth. Body card surface is white. Sub-modes inline
 * as compact tiles. Whole card lifts on hover with a tinted shadow.
 *
 * Sub-modes always visible inline (no expand/drill) per A-11.14 lock.
 */

const CATEGORY_GRADIENT: Record<string, string> = {
  brand: "from-lime-200/60 via-lime-300/40 to-transparent",
  ad: "from-amber-200/60 via-amber-300/40 to-transparent",
  social: "from-sky-200/60 via-sky-300/40 to-transparent",
};

const CATEGORY_ACCENT_TEXT: Record<string, string> = {
  brand: "text-lime-800 dark:text-lime-300",
  ad: "text-amber-800 dark:text-amber-300",
  social: "text-sky-800 dark:text-sky-300",
};

const CATEGORY_HOVER_RING: Record<string, string> = {
  brand: "hover:shadow-[0_8px_30px_-8px_rgba(132,204,22,0.35)]",
  ad: "hover:shadow-[0_8px_30px_-8px_rgba(245,158,11,0.30)]",
  social: "hover:shadow-[0_8px_30px_-8px_rgba(14,165,233,0.25)]",
};

export function CategoryCard({ category }: { category: CategoryDescriptor }) {
  const isComingSoon = category.status === "coming-soon";
  const gradient = CATEGORY_GRADIENT[category.id] ?? CATEGORY_GRADIENT.brand;
  const accent = CATEGORY_ACCENT_TEXT[category.id] ?? CATEGORY_ACCENT_TEXT.brand;
  const hoverRing = CATEGORY_HOVER_RING[category.id] ?? CATEGORY_HOVER_RING.brand;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300",
        !isComingSoon && [
          "border border-border bg-card",
          "hover:-translate-y-0.5 hover:border-primary/30",
          hoverRing,
        ],
        // A-11.18→A-11.19: V1 Social keeps its color identity (per Maalik:
        // "keep the colors") but signals "not clickable / coming soon" via
        // dashed border + reduced saturation + lock icon + muted text.
        isComingSoon && [
          "border-2 border-dashed border-sky-300/50 bg-card",
          "saturate-[0.85] opacity-90 hover:opacity-100",
        ],
      )}
    >
      {/* Gradient header band — render for ALL categories (Social keeps
          its sky tint per Maalik). For coming-soon, layer a muting wash
          + diagonal-stripe pattern so the colors stay but the surface
          reads "not active". */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-28 bg-gradient-to-br pointer-events-none transition-all duration-500",
          gradient,
          !isComingSoon && "group-hover:h-32",
        )}
      />
      {/* Subtle dot pattern overlay on the gradient band — AI-tool depth */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          color: "hsl(var(--foreground))",
        }}
      />
      {/* Coming-soon: faint diagonal-stripe overlay on the band so the
          color is preserved but the surface looks "fenced off". */}
      {isComingSoon && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, hsl(var(--foreground)) 0px, hsl(var(--foreground)) 1px, transparent 1px, transparent 8px)",
          }}
        />
      )}

      {/* Coming-soon "lock" badge in top-right */}
      {isComingSoon && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 ring-1 ring-border shadow-sm backdrop-blur-sm">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Soon
          </span>
        </div>
      )}

      {/* Header content */}
      <header className="relative z-10 px-5 pt-4 pb-3 space-y-1">
        <p
          className={cn(
            "text-[10px] font-mono uppercase tracking-[0.2em] font-semibold",
            isComingSoon ? "text-muted-foreground" : accent,
          )}
        >
          {isComingSoon ? "Coming soon" : "Category"}
        </p>
        <h2 className={cn(
          "text-xl font-bold tracking-tight leading-tight",
          isComingSoon ? "text-muted-foreground" : "text-foreground",
        )}>
          {category.label}
        </h2>
        <p className={cn(
          "text-[11px] leading-relaxed",
          isComingSoon ? "text-muted-foreground/80 italic" : "text-muted-foreground",
        )}>
          {category.description}
        </p>
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 p-2.5 pt-1">
        {isComingSoon ? <ComingSoonState /> : (
          <div className="space-y-1">
            {category.subModes.map((m, i) => (
              <div
                key={m.id}
                className="opacity-100 transform-gpu transition-all duration-300"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <SubModeTile categoryId={category.id} subMode={m} />
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ComingSoonState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Not yet
        </p>
        <p className="text-[10px] text-muted-foreground/80 max-w-[200px] italic">
          Social-native creative modes (Reels, Stories, native posts) are on the roadmap.
        </p>
      </div>
      {/* "Notify me" stub for future wait-list */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          alert("Notify-me wait-list lands later.");
        }}
        className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        Notify me
      </button>
    </div>
  );
}
