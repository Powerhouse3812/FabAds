import { Zap, Clock } from "lucide-react";
import { SubModeCard } from "./components/SubModeCard";
import { CATEGORIES, QUICK_MODES } from "./types";

/**
 * StudioV3LandingHorizontal — Variant 2 layout (A-11.17).
 *
 * Stacked rows, one per active mode. Sub-modes spread horizontally as
 * cards with distinctive mockup previews (no stock photos).
 *
 * A-11.17 changes per Maalik feedback:
 *   - Dropped Social row entirely — coming-soon shouldn't waste a full
 *     horizontal row. Now lives as a small inline pill at the bottom
 *     ("More categories soon · Social").
 *   - SubModeCard previews are mockup-style (per-sub-mode), not Unsplash
 *     photos. Distinctive AI-tool aesthetic.
 */

export function StudioV3LandingHorizontal() {
  // Filter: only "ready" categories appear as full rows.
  // Coming-soon ones get reduced to a small inline pill below.
  const readyCategories = CATEGORIES.filter((c) => c.status === "ready");
  const comingSoonCategories = CATEGORIES.filter(
    (c) => c.status === "coming-soon",
  );

  return (
    <div className="space-y-7">
      {readyCategories.map((cat) => (
        <ModeRow
          key={cat.id}
          label={cat.label}
          description={cat.description}
        >
          {cat.subModes.map((m) => (
            <SubModeCard key={m.id} categoryId={cat.id} subMode={m} />
          ))}
        </ModeRow>
      ))}

      {/* Quick modes — same row treatment, smaller eyebrow */}
      <ModeRow
        label="Quick modes"
        description="Small, focused jobs — UGC, variants, image-to-ad, edit utilities."
        accent="muted"
      >
        {QUICK_MODES.map((m) => (
          <SubModeCard key={m.id} categoryId="quick" subMode={m} />
        ))}
      </ModeRow>

      {/* Coming-soon categories — inline pill, doesn't waste a full row */}
      {comingSoonCategories.length > 0 && (
        <ComingSoonPill labels={comingSoonCategories.map((c) => c.label)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function ModeRow({
  label,
  description,
  accent = "default",
  children,
}: {
  label: string;
  description: string;
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
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {children}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function ComingSoonPill({ labels }: { labels: string[] }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] backdrop-blur-sm">
      <Clock className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">
        Coming soon ·{" "}
        <span className="font-medium text-foreground">
          {labels.join(", ")}
        </span>{" "}
        — social-native creatives (Reels, Stories, native posts)
      </span>
    </div>
  );
}
