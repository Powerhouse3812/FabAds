import { useParams } from "react-router-dom";
import { UpsellPopover } from "@/components/shell/UpsellPopover";
import { MODULES } from "@/components/sidebar/modules";

/**
 * Public print-friendly variant of the PRO upsell tooltip.
 *
 * URL: /upsell-print/:moduleKey  (e.g. /upsell-print/reports)
 *
 * Renders the tooltip card at native dimensions in document flow — no
 * auth, no shell, no scale, no animation. Mirrors the /brand-book-print
 * pattern so html.to.design / Anima / Locofy can scrape the card
 * cleanly for design export.
 *
 * The moduleKey is looked up against MODULES; we use its `label` to
 * fill in the upsell headline. Falls back to "Reports" if the key
 * doesn't match a known module.
 */
export function UpsellPrintPage() {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const mod = MODULES.find((m) => m.key === moduleKey);
  const moduleLabel = mod?.label ?? "Reports";

  return (
    <main className="min-h-screen bg-background flex items-start justify-start p-6">
      {/* Native-dimension card — no animations, no portal, document flow */}
      <article
        className="rounded-xl border border-border bg-card shadow-xl overflow-hidden"
        data-design-export="upsell-tooltip"
      >
        <UpsellPopover moduleLabel={moduleLabel} />
      </article>
    </main>
  );
}
