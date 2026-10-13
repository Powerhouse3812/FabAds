/**
 * Competitor detail · Creative elements tab: "this is what they run the MOST".
 * Four ranked cards (hooks, angles, frameworks, concepts), then CTA buttons,
 * keywords and their opening lines. Every card says how many ads it is built on.
 */
import { useMemo } from "react";
import type { ElementType } from "@/lib/insights-v3/types";
import { comparisonLabel, rising, type TrendItem } from "@/lib/insights-v3/selectors";
import { BasedOnNote, DisabledSection, TruncatedText, useAdDrawer } from "../../shared";
import { CreativeRankedGroup } from "../CreativeRankedGroup";
import { MixChip } from "../parts";
import type { DetailTabProps } from "./types";

const ELEMENT_KINDS: ElementType[] = ["hook", "angle", "framework", "concept"];

export function CreativeTab({ kind, id, detail, baseAds, scope, ctx }: DetailTabProps) {
  const drawer = useAdDrawer();
  // Which elements are picking up for THIS competitor (their own ads, period vs the one before).
  const risingByKind = useMemo(() => {
    const own = baseAds.filter((a) => (kind === "page" ? a.pageAdvertiserId === id : a.domainAdvertiserId === id));
    const out = {} as Record<ElementType, Map<string, TrendItem>>;
    for (const k of ELEMENT_KINDS) {
      out[k] = new Map(rising(k, own, scope.period, ctx.now, { limit: 20, data: ctx.data }).map((t) => [t.id, t]));
    }
    return out;
  }, [baseAds, kind, id, scope.period, ctx.now, ctx.data]);
  const versus = comparisonLabel(scope.period);
  const group = { versus };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">What they run most</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Most-used first. A count is how many of their ads use it; it shows usage, not results.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CreativeRankedGroup
          {...group}
          title="Hooks they run most"
          type="hook"
          mix={detail.hooks}
          rising={risingByKind.hook}
          emptyReason="No hook style could be identified in this competitor's ads."
        />
        <CreativeRankedGroup
          {...group}
          title="Angles they run most"
          type="angle"
          mix={detail.angles}
          rising={risingByKind.angle}
          emptyReason="No angle could be identified in this competitor's ads."
        />
        <CreativeRankedGroup
          {...group}
          title="Frameworks they run most"
          type="framework"
          mix={detail.frameworks}
          rising={risingByKind.framework}
          emptyReason="No framework could be identified in this competitor's ads."
        />
        <CreativeRankedGroup
          {...group}
          title="Concepts they run most"
          type="concept"
          mix={detail.concepts}
          rising={risingByKind.concept}
          emptyReason="No concept could be identified in this competitor's ads."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CreativeRankedGroup
          {...group}
          title="CTA buttons they use most"
          type={null}
          mix={detail.ctas}
          note="Share of their ads that have a CTA button."
          emptyReason="None of this competitor's ads has a CTA button label."
        />
        {detail.keywords.items.length === 0 ? (
          <DisabledSection title="Keywords they use most" reason="No keywords could be extracted from this competitor's ads." minHeight={140} />
        ) : (
          <section aria-label="Keywords they use most" className="min-w-0 rounded-xl border border-border bg-card p-4">
            <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Keywords they use most</h3>
              <BasedOnNote ads={detail.keywords.basedOn} />
            </header>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Words that show up across their ads, most-used first.</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Keywords they use most">
              {detail.keywords.items.map((it) => (
                <li key={it.id} className="max-w-full">
                  <MixChip type={null} item={it} interactive={false} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {detail.hookLines.items.length > 0 && (
        <section aria-label="Opening lines" className="rounded-xl border border-border bg-card p-4">
          <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Opening lines</h3>
            <BasedOnNote ads={detail.hookLines.basedOn} />
          </header>
          <p className="mt-0.5 text-[11px] text-muted-foreground">The first words of their ads. Open one to see the full ad.</p>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {detail.hookLines.items.slice(0, 4).map((q) => (
              <li key={q.adId}>
                <button
                  type="button"
                  onClick={() => drawer.open(q.adId)}
                  className="h-full w-full rounded-md border-l-2 border-primary bg-primary/5 px-2.5 py-1.5 text-left text-xs italic text-foreground hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TruncatedText text={`“${q.text.replace(/^[\s"“”]+|[\s"“”]+$/g, "")}”`} lines={2} focusable={false} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
