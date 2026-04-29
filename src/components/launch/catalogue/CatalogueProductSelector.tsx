import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS } from "@/lib/catalogue-dummy-data";

interface Props {
  selectedCatalogueId: string;
  selectedProductSetId: string;
  onCatalogueChange: (id: string) => void;
  onProductSetChange: (id: string) => void;
  className?: string;
}

export function CatalogueProductSelector({
  selectedCatalogueId,
  selectedProductSetId,
  onCatalogueChange,
  onProductSetChange,
  className,
}: Props) {
  const productSets = DUMMY_PRODUCT_SETS[selectedCatalogueId] || [];

  return (
    <div className={className}>
      {/* Catalogue dropdown */}
      <div className="space-y-1">
        <Label className="text-xs">Catalogue <span className="text-destructive">*</span></Label>
        <Select value={selectedCatalogueId} onValueChange={onCatalogueChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select catalogue" /></SelectTrigger>
          <SelectContent>
            {DUMMY_CATALOGUES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product set dropdown */}
      {selectedCatalogueId && productSets.length > 0 && (
        <div className="space-y-1 mt-3">
          <Label className="text-xs">Product Set <span className="text-destructive">*</span></Label>
          <Select value={selectedProductSetId} onValueChange={onProductSetChange}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product set" /></SelectTrigger>
            <SelectContent>
              {productSets.map((ps) => (
                <SelectItem key={ps.id} value={ps.id}>
                  {ps.name} ({ps.items} items · {ps.variants} variants)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
