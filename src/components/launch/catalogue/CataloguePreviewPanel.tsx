import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe } from "lucide-react";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS } from "@/lib/catalogue-dummy-data";

export interface CataloguePreviewData {
  primary_text?: string;
  headline?: string;
  description?: string;
  cta?: string;
  destination_url?: string;
  catalogue_id?: string;
  product_set_id?: string;
  page_name?: string;
}

interface Props {
  previewData: CataloguePreviewData | null;
}

export function CataloguePreviewPanel({ previewData }: Props) {
  const data = previewData || {};
  const firstHeadline = data.headline ? data.headline.split("|||")[0] : "Your headline";
  const catalogueName = data.catalogue_id
    ? DUMMY_CATALOGUES.find((c) => c.id === data.catalogue_id)?.name || "Catalogue"
    : "Catalogue";
  const productSet = data.catalogue_id && data.product_set_id
    ? (DUMMY_PRODUCT_SETS[data.catalogue_id] || []).find((ps) => ps.id === data.product_set_id)
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Ad Preview</h3>
        <p className="text-xs text-muted-foreground">See how your Ad will look</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card className="overflow-hidden shadow-sm">
            {/* FB Post Header */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {(data.page_name || "T")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold">{data.page_name || "My Business Page"}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Sponsored</span>
                  <span>·</span>
                  <Globe className="h-2.5 w-2.5" />
                </div>
              </div>
            </div>

            {/* Primary text */}
            <div className="px-3 pb-2">
              <p className="text-xs leading-relaxed">
                {data.primary_text || "Your primary text will appear here. Write compelling ad copy to attract customers."}
              </p>
            </div>

            {/* Product image (large hero) */}
            <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded bg-muted-foreground/10 flex items-center justify-center">
                  <span className="text-3xl opacity-30">🛍️</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">{catalogueName}</p>
                {productSet && (
                  <p className="text-[10px] text-muted-foreground">{productSet.name} · {productSet.items} items</p>
                )}
              </div>
            </div>

            {/* Footer: URL + headline + CTA */}
            <div className="border-t border-border px-3 py-2.5 flex items-center justify-between bg-muted/30">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-[10px] text-muted-foreground truncate uppercase">
                  {data.destination_url || "techflow.store"}
                </p>
                <p className="text-xs font-semibold truncate">
                  {firstHeadline}
                </p>
              </div>
              <Button size="sm" className="h-7 text-xs shrink-0">
                {data.cta || "Shop Now"}
              </Button>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
