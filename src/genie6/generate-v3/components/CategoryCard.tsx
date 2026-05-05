import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubModeTile } from "./SubModeTile";
import type { CategoryDescriptor } from "../types";

/**
 * CategoryCard — top-level parent card on Studio v3 Landing (V1 stacked).
 *
 * A-11.15 cleanup per Maalik feedback: dropped the tinted gradient header
 * band that read as "off-white extra background". Now: clean white card
 * surface, label/description as plain text header. The dot-grid backdrop
 * on the page provides the only ambient texture.
 *
 * Sub-modes are always visible inline (no expand/drill) per the locked
 * decision in A-11.14.
 */

export function CategoryCard({ category }: { category: CategoryDescriptor }) {
  const isComingSoon = category.status === "coming-soon";

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card transition-shadow",
        !isComingSoon && "hover:shadow-sm",
      )}
    >
      {/* Header */}
      <header className="px-4 pt-4 pb-2 space-y-0.5">
        <h2 className="text-base font-semibold tracking-tight text-foreground leading-tight">
          {category.label}
        </h2>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {category.description}
        </p>
      </header>

      {/* Body */}
      <div className="flex-1 p-2">
        {isComingSoon ? <ComingSoonState /> : (
          <div className="space-y-1">
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
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/20 py-6 text-center">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
      </div>
      <p className="text-[11px] font-medium text-foreground">Coming soon</p>
      <p className="text-[10px] text-muted-foreground max-w-[180px]">
        Social-native creative modes are on the roadmap.
      </p>
    </div>
  );
}
