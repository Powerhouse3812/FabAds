import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Sparkles, Construction } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_V3_ICONS } from "./components/icons";
import {
  findCategory,
  findQuickMode,
  findSubMode,
  type SubModeDescriptor,
} from "./types";

/**
 * SubModePlaceholder — stub page rendered when a Studio v3 sub-mode is
 * clicked but the real form for it hasn't been built yet (A-11.14).
 *
 * Real sub-mode forms land in subsequent commits:
 *   A-11.15 — Product Shoot (Maalik's next signal)
 *   A-11.16+ — other sub-modes one-by-one
 *
 * Routes:
 *   /generate-v3/:categoryId/:subModeId  — for Brand or Ad sub-modes
 *   /generate-v3/quick/:quickModeId       — for Quick modes
 *
 * Layout matches the FormSkeleton header pattern (slim back + eyebrow +
 * title) so the visual transition is smooth when the real form replaces
 * this stub.
 */

export function SubModePlaceholder() {
  const params = useParams<{
    categoryId?: string;
    subModeId?: string;
    quickModeId?: string;
  }>();

  const isQuick = !!params.quickModeId;
  const subMode: SubModeDescriptor | undefined = isQuick
    ? findQuickMode(params.quickModeId)
    : findSubMode(params.categoryId, params.subModeId);
  const category = !isQuick ? findCategory(params.categoryId) : undefined;

  // Fallback if the route lands on an unknown id
  if (!subMode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Unknown mode</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          We couldn't resolve that mode. Head back to the picker.
        </p>
        <BackLink />
      </div>
    );
  }

  const Icon = STUDIO_V3_ICONS[subMode.icon] ?? Sparkles;
  const eyebrow = isQuick
    ? "Studio v3 · Quick mode"
    : `Studio v3 · ${category?.label ?? "Category"}`;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Slim header — matches FormSkeleton pattern */}
      <header className="shrink-0 flex items-start gap-3 border-b border-border/60 bg-background px-4 py-3 sm:px-6">
        <BackLink />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-base font-semibold tracking-tight text-foreground leading-tight">
            {subMode.label}
          </h1>
          <p className="text-xs text-muted-foreground leading-snug">
            {subMode.description}
          </p>
        </div>
      </header>

      {/* Body — centered "form lands next" card */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-8 sm:px-6">
          <div
            className={cn(
              "w-full max-w-md rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-4",
            )}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {subMode.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {subMode.description}
              </p>
            </div>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">
              <Construction className="h-3 w-3" />
              Form lands in the next commit
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Studio v3 sub-modes are being built one-by-one. Product Shoot is
              first up — others follow shortly.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function BackLink() {
  return (
    <Link
      to="/iq/genie6/generate-v3"
      aria-label="Back to picker"
      className={cn(
        "shrink-0 inline-flex items-center gap-1 h-8 rounded-md border border-border bg-card px-2 text-xs text-muted-foreground transition-colors",
        "hover:border-foreground/30 hover:text-foreground",
        "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
      )}
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Picker
    </Link>
  );
}
