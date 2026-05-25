/**
 * PaymentMethodsSection — Workspace Settings → Plans & Payment tab.
 *
 * Renders: section header + a bordered card containing a "Payment Method"
 * strip with an "Add new card" outline button, then a row of 2 saved card
 * tiles (dark gradient Visa, light Amex) and an "Add new card" dashed
 * placeholder tile.
 *
 * Demo-only — actions are no-ops. Data from `mock-data.ts → PAYMENT_CARDS`.
 */
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PAYMENT_CARDS, type PaymentCard } from "../mock-data";

export function PaymentMethodsSection() {
  return (
    <section aria-label="Payment methods" className="space-y-3">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">Payment</h2>
        <p className="text-sm text-muted-foreground">
          Manage your billing methods.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        {/* Header strip */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">
            Payment Method
          </span>
          <Button size="sm" variant="outline" className="h-7 gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add new card
          </Button>
        </div>

        {/* Card tiles */}
        <div className="flex flex-wrap gap-3 px-4 py-4">
          {PAYMENT_CARDS.map((card) => (
            <PaymentCardTile key={card.id} card={card} />
          ))}
          <AddNewCardTile />
        </div>
      </div>
    </section>
  );
}

/* ── Subcomponents ────────────────────────────────────────────────── */

function PaymentCardTile({ card }: { card: PaymentCard }) {
  const isDark = card.surface === "dark";

  return (
    <div
      className={[
        "group relative flex h-[132px] w-[240px] flex-col justify-between rounded-xl p-4 transition-all",
        "hover:-translate-y-[1px]",
        isDark
          ? "bg-gradient-to-br from-[#282828] to-[#0B0B0B] text-white shadow-sm"
          : "border border-border/60 bg-white text-foreground",
      ].join(" ")}
    >
      {/* Top row — brand logo + actions */}
      <div className="flex items-start justify-between">
        <BrandBadge brand={card.brand} surface={card.surface} />
        <div className="flex items-center gap-1.5">
          {isDark ? (
            <span className="rounded bg-white/[0.18] px-2 py-0.5 text-[10px] font-medium text-white/45">
              Active
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-6 rounded px-2 text-[10px] font-medium"
            >
              Set default
            </Button>
          )}
          <button
            type="button"
            aria-label={`Remove card ending ${card.last4}`}
            className={[
              "inline-flex h-6 w-6 items-center justify-center rounded border opacity-0 transition-all group-hover:opacity-60 hover:opacity-100",
              isDark
                ? "border-white/20 text-white/70 hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300"
                : "border-border/60 text-muted-foreground hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive",
            ].join(" ")}
          >
            <Trash2 className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      {/* Caption under logo */}
      <p
        className={[
          "text-[12px]",
          isDark ? "text-white/85" : "text-muted-foreground",
        ].join(" ")}
      >
        Credit Card
      </p>

      {/* Bottom block — holder + PAN + expiry */}
      <div className="space-y-0.5">
        <p
          className={[
            "text-[12px] font-medium leading-tight",
            isDark ? "text-white" : "text-foreground",
          ].join(" ")}
        >
          {card.holderName}
        </p>
        <p
          className={[
            "font-mono text-[12px] font-medium leading-tight tabular-nums",
            isDark ? "text-white" : "text-foreground",
          ].join(" ")}
        >
          {`**** **** **** ${card.last4}`}
        </p>
        <p
          className={[
            "font-mono text-[10px] leading-tight tabular-nums",
            isDark ? "text-white/65" : "text-muted-foreground",
          ].join(" ")}
        >
          Expiry on {card.expiry}
        </p>
      </div>
    </div>
  );
}

function BrandBadge({
  brand,
  surface,
}: {
  brand: PaymentCard["brand"];
  surface: PaymentCard["surface"];
}) {
  const isDark = surface === "dark";
  const label =
    brand === "visa" ? "VISA" : brand === "amex" ? "AMEX" : "CARD";

  return (
    <span
      className={[
        "inline-flex h-[21px] w-[40px] items-center justify-center rounded font-mono text-[10px] font-bold tracking-widest",
        isDark
          ? "bg-white/10 text-white"
          : brand === "amex"
            ? "bg-[#1F72CD] text-white"
            : "bg-foreground/90 text-background",
      ].join(" ")}
      aria-label={`${label} card`}
    >
      {label}
    </span>
  );
}

function AddNewCardTile() {
  return (
    <button
      type="button"
      className="group flex h-[132px] w-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-transparent text-muted-foreground transition-all hover:-translate-y-[1px] hover:border-primary/40 hover:bg-primary/[0.02] hover:text-foreground"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 transition-colors group-hover:border-primary/40 group-hover:text-primary">
        <Plus className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-[12px] font-medium">Add new card</span>
    </button>
  );
}
