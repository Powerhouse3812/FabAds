import { Megaphone, Layers, Images } from "lucide-react";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { catalogueDerivation } from "../../../deriveV2";

export default function CatalogueStructurePreview({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const d = catalogueDerivation(plan);

  if (d.accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-3 py-3 text-[11px] italic text-muted-foreground">
        Pick a catalog + product sets per account in Step 2 to preview the structure.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Totals */}
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <span className="font-mono text-foreground">{d.totalCampaigns} campaign{d.totalCampaigns !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="font-mono text-foreground">{d.totalAdSets} ad set{d.totalAdSets !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="font-mono text-foreground">{d.totalAds} carousel ad{d.totalAds !== 1 ? "s" : ""}</span>
      </div>

      {/* Per-account tree */}
      {d.accounts.map((acc) => (
        <div key={acc.accountId} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
            {acc.accountName}
            <span className="font-mono text-[10px] text-muted-foreground">· {acc.catalogName} · 1 campaign</span>
          </div>
          <div className="ml-4 space-y-1.5">
            {acc.adSets.map((s) => (
              <div key={s.productSetId} className="space-y-1">
                <div className="flex items-center gap-1.5 text-[12px] text-foreground">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{s.productSetName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">→ 1 carousel · {s.cardCount} cards</span>
                </div>
                {/* product card thumbnails */}
                <div className="ml-4 flex flex-wrap gap-1">
                  {s.products.slice(0, 6).map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
                      <img src={p.thumbnail} alt="" className="h-3.5 w-3.5 rounded object-cover" />
                      <span className="font-mono">{p.price}</span>
                    </span>
                  ))}
                  {s.cardCount > 6 && <span className="text-[10px] text-muted-foreground/60">+{s.cardCount - 6}</span>}
                  {s.products.length === 0 && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60"><Images className="h-3 w-3" /> {s.cardCount} products</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
