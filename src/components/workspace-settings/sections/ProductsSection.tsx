/**
 * ProductsSection — Owned by Agent C (part 1).
 *
 * Renders the header + a 2-column grid of product cards. FabAds = owned
 * (Growth Plan + Rule engine, spend usage bar, feature ticks, Manage CTA).
 * FabPPC = locked (red lock, "Unlock for 7 Days Free!", feature ticks,
 * Start trial CTA — lime-tinted gradient background).
 *
 * Demo-only. Data from `mock-data.ts` — PRODUCTS.
 * Figma reference: node-id=2984-18221.
 */
import { CheckCircle2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PRODUCTS, type ProductCard } from "../mock-data";

/* ── Shared bits ──────────────────────────────────────────────────── */

function FeatureRow({ features }: { features: string[] }) {
  return (
    <div className="flex flex-wrap gap-5">
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-2">
          <CheckCircle2
            className="h-4 w-4 text-[#37520A]"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="text-sm text-foreground">{feature}</span>
        </div>
      ))}
    </div>
  );
}

function MetaCell({
  label,
  value,
  labelIcon,
}: {
  label: string;
  value: React.ReactNode;
  labelIcon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {labelIcon}
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ── Owned card (FabAds) ──────────────────────────────────────────── */

function OwnedProductCard({ card }: { card: ProductCard }) {
  const pct = Math.min(100, Math.max(0, card.spendUsagePct ?? 0));

  return (
    <article className="overflow-hidden rounded-lg border border-border/60 bg-card">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Sparkles
            aria-hidden="true"
            className="h-4 w-4 text-primary"
            strokeWidth={2.25}
          />
          <span className="text-sm font-semibold text-foreground">
            {card.name}
          </span>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Manage plan
        </Button>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Meta row */}
        <div className="grid grid-cols-3 gap-4">
          <MetaCell label="Plan name" value={card.planLine} />
          <MetaCell label="Next billing date" value={card.nextBillingDate ?? "—"} />
          <MetaCell
            label="Amount"
            value={
              <span>
                ${card.monthlyPriceUsd ?? 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (+ GST)
                </span>
              </span>
            }
          />
        </div>

        {/* Spend usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Spend usage</span>
            <span className="text-xs text-muted-foreground">
              {card.spendUsageLabel}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${card.name} spend usage`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-6 w-full overflow-hidden rounded-md bg-muted"
          >
            <div
              className="h-full rounded-md bg-foreground"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Feature row */}
        <FeatureRow features={card.features} />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs italic text-muted-foreground">
            {card.socialProof}
          </p>
          <Button
            size="sm"
            className="rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {card.ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}

/* ── Locked card (FabPPC) ─────────────────────────────────────────── */

function LockedProductCard({ card }: { card: ProductCard }) {
  return (
    <article className="overflow-hidden rounded-lg border border-border/60 bg-gradient-to-r from-primary/15 to-primary/[0.05]">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="text-sm font-semibold text-foreground">
          {card.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded bg-foreground px-2 py-0.5 text-xs text-background">
            Premium feature
          </span>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Learn more
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Meta row */}
        <div className="grid grid-cols-3 gap-4">
          <MetaCell
            label="Plan name"
            value={card.planLine}
            labelIcon={
              <Lock
                aria-hidden="true"
                className="h-3 w-3 text-destructive"
                strokeWidth={2.25}
              />
            }
          />
          <MetaCell label="What it does" value={card.whatItDoes} />
          <MetaCell label="Ideal for" value={card.idealFor} />
        </div>

        {/* Feature row */}
        <FeatureRow features={card.features} />

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs italic text-muted-foreground">
            {card.socialProof}
          </p>
          <Button
            size="sm"
            className="rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {card.ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}

/* ── Main section ─────────────────────────────────────────────────── */

export function ProductsSection() {
  return (
    <section aria-label="Products you own or can own" className="space-y-3">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Products you own or can own
        </h2>
        <p className="text-sm text-muted-foreground">
          Review your invoice history, download past invoices, and track payment statuses for all products and add-ons.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PRODUCTS.map((card) =>
          card.state === "owned" ? (
            <OwnedProductCard key={card.id} card={card} />
          ) : (
            <LockedProductCard key={card.id} card={card} />
          )
        )}
      </div>
    </section>
  );
}
