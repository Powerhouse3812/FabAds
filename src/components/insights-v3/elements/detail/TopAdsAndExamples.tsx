/**
 * "Top ads + examples": AdCard grid (click → ad drawer; the card owns Save + Download)
 * with a visible Use in Genie under each example, then the type-specific extras:
 *  - hooks:      verbatim opening lines pulled from the ads that use this hook style
 *  - frameworks: which beats the framework uses (frequency, NOT an order — the
 *                data layer does not expose a typical sequence)
 */
import type { Ad, ElementType } from "@/lib/insights-v3/types";
import type { MixBlock, QuoteBlock } from "@/lib/insights-v3/selectors";
import { AdCard } from "@/components/insights-v3/ad-card/AdCard";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import { BasedOnNote, InfoGlyph, TruncatedText, fmtInt, useAdDrawer } from "@/components/insights-v3/shared";

function Example({ ad, onOpen }: { ad: Ad; onOpen: (id: string) => void }) {
  // The card owns Save + Download; Use in Genie sits in its overflow menu, so keep a visible one here.
  return (
    <li className="flex min-w-0 flex-col gap-1.5">
      <AdCard ad={ad} onOpen={onOpen} />
      <UseInGenie target={{ type: "ad", id: ad.id }} variant="button" label="Use in Genie" />
    </li>
  );
}

export function HookLines({ block }: { block: QuoteBlock }) {
  const drawer = useAdDrawer();
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h4 className="text-xs font-semibold text-foreground">Opening lines</h4>
        <BasedOnNote ads={block.basedOn} />
      </div>
      {block.items.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
          No ad using this hook style has a verbatim opening line captured.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {block.items.map((q) => (
            <li
              key={q.adId}
              className="flex min-w-0 items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
            >
              <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">“{q.text}”</p>
              <button
                type="button"
                onClick={() => drawer.open(q.adId)}
                className="shrink-0 rounded-sm text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                View ad
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FrameworkBeats({ block }: { block: MixBlock }) {
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          Beats this framework uses
          <InfoGlyph tip="How often each beat appears in the ads using this framework, most frequent first. This is frequency, not the order the beats run in." />
        </h4>
        <BasedOnNote ads={block.basedOn} />
      </div>
      {block.items.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
          No ad using this framework has its beats broken down yet.
        </p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {block.items.map((b) => (
            <li
              key={b.id}
              className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 text-xs text-foreground"
            >
              <TruncatedText text={b.label} className="max-w-[160px]" focusable={false} />
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{fmtInt(b.count)}</span>
              <span className="font-mono text-[11px] tabular-nums text-primary-text">{b.sharePct}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TopAdsGrid({ ads, type }: { ads: Ad[]; type: ElementType }) {
  const drawer = useAdDrawer();
  return (
    <div>
      <ul
        aria-label={`Example ads using this ${type}`}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {ads.map((ad) => (
          <Example key={ad.id} ad={ad} onOpen={drawer.open} />
        ))}
      </ul>
    </div>
  );
}
