import { Clock, Zap } from "lucide-react";
import { SubModeCard } from "./components/SubModeCard";
import { CATEGORIES, QUICK_MODES } from "./types";

/**
 * StudioV3LandingHorizontal — Variant 2 layout for the picker (A-11.15).
 *
 * Per Maalik: stacked rows. Each mode = one horizontal row. Mode name on
 * top, sub-mode cards spread horizontally below. All modes visible at once
 * (no tabs / no expand). Each sub-mode card has a preview thumbnail of the
 * generated output ("user ko pta ho ki kya bn ne wala hai").
 *
 * Layout:
 *   BRAND
 *   [card][card][card]
 *
 *   AD
 *   [card][card][card]
 *
 *   SOCIAL
 *   (coming soon)
 *
 *   QUICK MODES
 *   [card][card][card]
 *
 * Used inside StudioV3Landing's controller — toggled via title click.
 */

export function StudioV3LandingHorizontal() {
  return (
    <div className="space-y-7">
      {CATEGORIES.map((cat) => (
        <ModeRow
          key={cat.id}
          label={cat.label}
          description={cat.description}
          comingSoon={cat.status === "coming-soon"}
        >
          {cat.subModes.map((m) => (
            <SubModeCard key={m.id} categoryId={cat.id} subMode={m} />
          ))}
        </ModeRow>
      ))}

      {/* Quick modes — same row treatment as the 3 main modes for consistency */}
      <ModeRow
        label="Quick modes"
        description="Small, focused ad jobs — UGC, variants, image-to-ad."
        accent="muted"
      >
        {QUICK_MODES.map((m) => (
          <SubModeCard key={m.id} categoryId="quick" subMode={m} />
        ))}
      </ModeRow>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function ModeRow({
  label,
  description,
  comingSoon = false,
  accent = "default",
  children,
}: {
  label: string;
  description: string;
  comingSoon?: boolean;
  accent?: "default" | "muted";
  children?: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-2.5 flex items-baseline gap-2.5">
        <h2
          className={
            accent === "muted"
              ? "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground inline-flex items-center gap-1.5"
              : "text-sm font-semibold uppercase tracking-[0.18em] text-foreground"
          }
        >
          {accent === "muted" && <Zap className="h-3 w-3" />}
          {label}
        </h2>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </header>
      {comingSoon ? (
        <ComingSoonRow />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {children}
        </div>
      )}
    </section>
  );
}

function ComingSoonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-4 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-foreground">Coming soon</p>
        <p className="text-[11px] text-muted-foreground">
          Social-native creatives (Reels, Stories, native posts) on the roadmap.
        </p>
      </div>
    </div>
  );
}
