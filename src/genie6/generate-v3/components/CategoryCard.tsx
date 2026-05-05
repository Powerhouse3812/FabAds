import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubModeTile } from "./SubModeTile";
import type { CategoryDescriptor } from "../types";

/**
 * CategoryCard — top-level parent card on Studio v3 Landing.
 *
 * Each card carries:
 *   - Header: eyebrow chip + label + description
 *   - Body: vertical list of SubModeTiles (or "Coming soon" placeholder)
 *   - Subtle tinted gradient backdrop matching the category's identity
 *
 * Per Maalik's locked decision: sub-modes are ALWAYS visible inline. No
 * expand/drill — single-screen experience.
 */

const CATEGORY_GRADIENT: Record<string, string> = {
  brand: "from-lime-200/40 via-lime-300/25 to-transparent",
  ad: "from-amber-200/40 via-amber-300/25 to-transparent",
  social: "from-sky-200/40 via-sky-300/25 to-transparent",
};

const CATEGORY_ACCENT: Record<string, string> = {
  brand: "text-lime-700 dark:text-lime-400",
  ad: "text-amber-700 dark:text-amber-400",
  social: "text-sky-700 dark:text-sky-400",
};

export function CategoryCard({ category }: { category: CategoryDescriptor }) {
  const gradient = CATEGORY_GRADIENT[category.id] ?? CATEGORY_GRADIENT.brand;
  const accent = CATEGORY_ACCENT[category.id] ?? CATEGORY_ACCENT.brand;
  const isComingSoon = category.status === "coming-soon";

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden",
        "transition-shadow",
        !isComingSoon && "hover:shadow-md",
      )}
    >
      {/* Tinted gradient header band */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-32 bg-gradient-to-br pointer-events-none",
          gradient,
        )}
      />

      {/* Header content */}
      <header className="relative z-10 px-5 pt-5 pb-3 space-y-1">
        <p
          className={cn(
            "text-[10px] font-mono uppercase tracking-[0.18em]",
            accent,
          )}
        >
          {isComingSoon ? "Coming soon" : "Category"}
        </p>
        <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight">
          {category.label}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {category.description}
        </p>
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 p-3 pt-1">
        {isComingSoon ? <ComingSoonState /> : (
          <div className="space-y-1.5">
            {category.subModes.map((m) => (
              <SubModeTile key={m.id} categoryId={category.id} subMode={m} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ComingSoonState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/60 py-8 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-foreground">Coming soon</p>
      <p className="text-[10px] text-muted-foreground max-w-[180px]">
        Social-native creative modes are on the roadmap.
      </p>
    </div>
  );
}
