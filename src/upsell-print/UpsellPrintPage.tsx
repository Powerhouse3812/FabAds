import { UpsellPopover } from "@/components/shell/UpsellPopover";

/**
 * Public print-friendly variant of the FabAds upsell tooltip.
 *
 * URL: /upsell-print  (canonical) or /upsell-print/:moduleKey (legacy)
 *
 * Renders the tooltip card at native dimensions in document flow — no
 * auth, no shell, no scale, no animation. Mirrors the /brand-book-print
 * pattern so html.to.design / Anima / Locofy can scrape the card
 * cleanly for design export.
 *
 * Content is identical regardless of moduleKey — we're selling FabAds
 * as one product, not individual modules. The :moduleKey URL param is
 * kept (and ignored) for backward compat with deep-links from the
 * in-app `?upsell=<key>` flow.
 */
export function UpsellPrintPage() {
  return (
    <main className="min-h-screen bg-background flex items-start justify-start p-6">
      {/* Native-dimension card — no animations, no portal, document flow */}
      <article
        className="rounded-xl border border-border bg-card shadow-xl overflow-hidden"
        data-design-export="upsell-tooltip"
      >
        <UpsellPopover />
      </article>
    </main>
  );
}
