/**
 * AddonsSection — Owned by Agent C (part 2).
 *
 * Renders the header + 2 add-on cards (Creative AI Suite, Auto-Scale Pro).
 * Each card: dark filled tag + title + info icon + 2-column feature list
 * with green check bullets + hairline divider + footer italic blurb +
 * outlined "Request" CTA.
 *
 * Demo-only. Data from `mock-data.ts` — ADDONS.
 * Figma reference: node-id=2984-18221.
 */
import { CheckCircle2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ADDONS, type AddonCard } from "../mock-data";

/* ── Feature column ───────────────────────────────────────────────── */

function FeatureColumn({
  columnLabel,
  items,
}: {
  columnLabel: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{columnLabel}</span>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-[#37520A]"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="text-sm text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Add-on card ──────────────────────────────────────────────────── */

function AddonCardItem({ card }: { card: AddonCard }) {
  return (
    <article className="flex flex-col gap-4 rounded-lg bg-gradient-to-r from-primary/15 to-primary/[0.05] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-1">
        <span className="rounded bg-foreground px-2 py-0.5 text-xs text-background">
          {card.tagLabel}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
        <Info
          aria-hidden="true"
          className="h-4 w-4 text-muted-foreground"
          strokeWidth={2}
        />
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-4">
        {card.features.map((column) => (
          <FeatureColumn
            key={column.columnLabel}
            columnLabel={column.columnLabel}
            items={column.items}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs italic text-muted-foreground">
          {card.socialProof}
        </p>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          {card.ctaLabel}
        </Button>
      </div>
    </article>
  );
}

/* ── Main section ─────────────────────────────────────────────────── */

export function AddonsSection() {
  return (
    <section aria-label="Add-ons" className="space-y-3">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">Add-ons</h2>
        <p className="text-sm text-muted-foreground">
          Unlock extra speed, automation, and intelligence. Customize Fabfunnel to fit your workflow — and scale smarter than ever.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ADDONS.map((card) => (
          <AddonCardItem key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
