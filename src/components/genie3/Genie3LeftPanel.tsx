import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Palette, Sparkles, Clock, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useBrands, type Brand } from "@/hooks/use-brands";
import { Genie3BrandCard } from "./Genie3BrandCard";
import { AddBrandModal } from "./AddBrandModal";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type ViewType = "generate" | "library" | "brand-detail" | "templates";

const NAV_ITEMS: { key: ViewType; label: string; icon: typeof Clock }[] = [
  { key: "library", label: "History", icon: Clock },
  { key: "templates", label: "Templates", icon: FileText },
];

interface Props {
  activeBrandId: string | null;
  onBrandSelect: (brand: Brand | null) => void;
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onBrandDetail?: (brand: Brand) => void;
}

export function Genie3LeftPanel({ activeBrandId, onBrandSelect, activeView = "library", onViewChange, onBrandDetail }: Props) {
  const { data: dbBrands = [] } = useBrands();

  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(true);

  const brands = dbBrands;

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50 w-[240px] shrink-0">
      {/* New Generation CTA */}
      <div className="px-3 pt-3 pb-2">
        <Button
          className="w-full h-9 text-xs font-semibold gap-1.5"
          onClick={() => onViewChange?.("generate")}
        >
          <Sparkles className="h-3.5 w-3.5" />
          New Generation
        </Button>
      </div>

      {/* Nav items */}
      <div className="px-1 py-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange?.(item.key)}
              className={cn(
                "flex items-center gap-2.5 w-full rounded-r-md px-3 py-2 text-left text-sm transition-all",
                isActive
                  ? "border-l-[3px] border-l-foreground/60 bg-muted font-medium text-foreground"
                  : "border-l-[3px] border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <Separator className="my-2" />

      {/* Brands section */}
      <div className="flex-1 flex flex-col min-h-0">
        <button
          onClick={() => setBrandsOpen(!brandsOpen)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-accent/30 transition-colors"
        >
          {brandsOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <Palette className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-1 text-left">Brands</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => { e.stopPropagation(); setAddBrandOpen(true); }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </button>

        {brandsOpen && (
          <ScrollArea className="flex-1">
            <div className="px-2 pb-2 space-y-0.5">
              {brands.map((b) => (
                <Genie3BrandCard
                  key={b.id}
                  brand={b}
                  isActive={activeBrandId === b.id && activeView === "brand-detail"}
                  onClick={() => onBrandDetail?.(b)}
                  onDetail={() => onBrandDetail?.(b)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <AddBrandModal open={addBrandOpen} onOpenChange={setAddBrandOpen} />
    </div>
  );
}
