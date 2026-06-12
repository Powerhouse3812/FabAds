import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { CatalogSelection } from "../../../types";
import { CATALOGS, getCatalog } from "../../../data";

export default function AccountCatalogPicker({
  flow,
  accountId,
}: {
  flow: UseFlowV2;
  accountId: string;
}) {
  const { plan, patch } = flow;
  const sel: CatalogSelection = plan.catalogSelections[accountId] ?? { catalogId: null, productSetIds: [] };
  const catalog = getCatalog(sel.catalogId);

  const update = (next: CatalogSelection) => {
    patch({ catalogSelections: { ...plan.catalogSelections, [accountId]: next } });
  };
  const setCatalog = (catalogId: string) => update({ catalogId, productSetIds: [] });
  const toggleSet = (psId: string) => {
    const on = sel.productSetIds.includes(psId);
    update({
      catalogId: sel.catalogId,
      productSetIds: on ? sel.productSetIds.filter((x) => x !== psId) : [...sel.productSetIds, psId],
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Boxes className="h-3.5 w-3.5 text-primary" /> Catalogue
      </Label>

      {/* Catalog select */}
      <Select value={sel.catalogId ?? undefined} onValueChange={setCatalog}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="Choose a catalog" />
        </SelectTrigger>
        <SelectContent>
          {CATALOGS.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">· {c.productCount}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Product-set multi-check */}
      {catalog && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">
            Pick product sets — each becomes one ad set ({sel.productSetIds.length} selected)
          </p>
          <div className="flex flex-col gap-1">
            {catalog.productSets.map((ps) => {
              const on = sel.productSetIds.includes(ps.id);
              return (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => toggleSet(ps.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                    on ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <span className="flex items-center gap-2 text-[13px] text-foreground">
                    <span className={cn(
                      "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border",
                      on ? "border-primary bg-primary" : "border-muted-foreground/40",
                    )}>
                      {on && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.2 6L8 1" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {ps.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {ps.products.length || ps.productCount} cards
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
