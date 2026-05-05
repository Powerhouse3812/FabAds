import { Zap, Lock, Sparkles, ShoppingBag, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubModeCard } from "./components/SubModeCard";
import { CATEGORIES, QUICK_MODES, type CategoryId } from "./types";

/**
 * StudioV3LandingHorizontal — V2 layout (A-11.18 polish).
 *
 * A-11.18 changes:
 *   - Section headers gain a colored icon-disc illustration matching the
 *     mode's identity (lime / amber / sky / lime accent for Quick). Visual
 *     anchor that ties V2 to V1's icon-treatment.
 *   - Inter-mode spacing bumped (space-y-7 → space-y-10) — more breathing
 *     room between the three mode rows.
 *   - Social coming-soon pill is now bigger + bordered + has a Lock icon —
 *     visible without taking a full row.
 *
 * Maalik feedback: V2 was looking "boring and basic, real images jaisa
 * dikh rha tha" — A-11.17 dropped photos for distinctive mockups. This
 * round adds the section-level illustrations + spacing for warmth.
 */

const SECTION_ICON: Record<CategoryId | "quick", typeof Sparkles> = {
  brand: Sparkles,
  ad: ShoppingBag,
  social: Lock,
  quick: Zap,
};

const SECTION_ACCENT: Record<CategoryId | "quick", string> = {
  brand: "bg-lime-100 text-lime-700 ring-lime-200/60",
  ad: "bg-amber-100 text-amber-700 ring-amber-200/60",
  social: "bg-sky-100 text-sky-700 ring-sky-200/60",
  quick: "bg-primary/10 text-foreground ring-primary/20",
};

export function StudioV3LandingHorizontal() {
  const readyCategories = CATEGORIES.filter((c) => c.status === "ready");
  const comingSoonCategories = CATEGORIES.filter(
    (c) => c.status === "coming-soon",
  );

  return (
    <div className="space-y-10">
      {readyCategories.map((cat) => (
        <ModeRow
          key={cat.id}
          modeId={cat.id}
          label={cat.label}
          description={cat.description}
        >
          {cat.subModes.map((m) => (
            <SubModeCard key={m.id} categoryId={cat.id} subMode={m} />
          ))}
        </ModeRow>
      ))}

      {/* Quick modes — uses muted accent variant */}
      <ModeRow
        modeId="quick"
        label="Quick modes"
        description="Small, focused jobs — UGC, variants, image-to-ad, edit utilities."
      >
        {QUICK_MODES.map((m) => (
          <SubModeCard key={m.id} categoryId="quick" subMode={m} />
        ))}
      </ModeRow>

      {/* Coming-soon categories — bolder inline pill */}
      {comingSoonCategories.length > 0 && (
        <ComingSoonPill labels={comingSoonCategories.map((c) => c.label)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function ModeRow({
  modeId,
  label,
  description,
  children,
}: {
  modeId: CategoryId | "quick";
  label: string;
  description: string;
  children?: React.ReactNode;
}) {
  const Icon = SECTION_ICON[modeId];
  const accent = SECTION_ACCENT[modeId];

  return (
    <section>
      <header className="mb-3 flex items-center gap-3">
        {/* Illustrative icon-disc anchor — ties V2 visually to V1's tile pattern */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform",
            accent,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground leading-none">
            {label}
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
            {description}
          </p>
        </div>
      </header>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {children}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function ComingSoonPill({ labels }: { labels: string[] }) {
  return (
    <div className="mt-2">
      <div
        className={cn(
          "inline-flex items-center gap-2.5 rounded-xl border border-dashed border-sky-300/40 bg-sky-50/60 px-4 py-2.5 backdrop-blur-sm",
          "dark:bg-sky-950/30 dark:border-sky-700/40",
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-900/60 dark:text-sky-300 dark:ring-sky-700/40">
          <Lock className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">
            Coming soon · {labels.join(", ")}
          </p>
          <p className="text-[10px] text-muted-foreground italic mt-0.5">
            Social-native creatives — Reels, Stories, native posts. On the roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
