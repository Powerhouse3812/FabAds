import { useState } from "react";
import { useBrands, type Brand } from "@/hooks/use-brands";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ArrowRight, Globe, Palette } from "lucide-react";
import { AddBrandModal } from "@/components/genie3/AddBrandModal";

interface Props {
  onBrandDetail: (brand: Brand) => void;
}

export function BrandsListView({ onBrandDetail }: Props) {
  const { data: brands = [], isLoading } = useBrands();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 2xl:p-5 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Brands</h1>
            {brands.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {brands.length}
              </Badge>
            )}
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Brand
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 space-y-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-3">
              <Palette className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No brands yet</p>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add your first brand
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Card
                key={brand.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => onBrandDetail(brand)}
              >
                <CardContent className="p-5 space-y-3">
                  {/* Logo / Initial */}
                  <div className="flex items-start justify-between">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {brand.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>

                  {/* Name + Industry */}
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {brand.name}
                    </p>
                    {brand.industry && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {brand.industry}
                      </p>
                    )}
                  </div>

                  {/* Color swatches */}
                  {brand.colors && brand.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {brand.colors.slice(0, 5).map((color, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-border/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {brand.colors.length > 5 && (
                        <span className="text-[10px] text-muted-foreground ml-0.5">
                          +{brand.colors.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Website */}
                  {brand.website && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span className="text-[11px] truncate">
                        {brand.website.replace(/^https?:\/\//, "")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddBrandModal open={addOpen} onOpenChange={setAddOpen} />
    </ScrollArea>
  );
}
