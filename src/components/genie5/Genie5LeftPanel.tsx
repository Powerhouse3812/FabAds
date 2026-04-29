import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Palette, Sparkles, Layers, FileText, FolderOpen } from "lucide-react";
import { AddBrandModal } from "@/components/genie3/AddBrandModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export type Genie5View =
  | "generate"
  | "library"
  | "brand-detail"
  | "category-detail"
  | "templates"
  | "brands"
  | "categories";

interface NavItem {
  key: Genie5View;
  label: string;
  icon: typeof Layers;
  hasAdd?: boolean;
}

const TOP_NAV: NavItem[] = [
  { key: "library", label: "Library", icon: Layers },
  { key: "templates", label: "Templates", icon: FileText },
];

const BOTTOM_NAV: NavItem[] = [
  { key: "brands", label: "Brands", icon: Palette, hasAdd: true },
  { key: "categories", label: "Categories", icon: FolderOpen, hasAdd: true },
];

interface Props {
  activeBrandId: string | null;
  activeCategoryId: string | null;
  activeView: Genie5View;
  onViewChange: (view: Genie5View) => void;
  onBrandDetail: (brand: any) => void;
  onCategoryDetail: (cat: any) => void;
}

export function Genie5LeftPanel({
  activeView,
  onViewChange,
}: Props) {
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const renderNavItem = (item: NavItem) => {
    const isActive =
      activeView === item.key ||
      (item.key === "brands" && activeView === "brand-detail") ||
      (item.key === "categories" && activeView === "category-detail");

    return (
      <button
        key={item.key}
        onClick={() => onViewChange(item.key)}
        className={cn(
          "flex items-center gap-2.5 w-full rounded-r-md px-3 py-2 text-left text-sm transition-all group",
          isActive
            ? "border-l-[3px] border-l-foreground/60 bg-muted font-medium text-foreground"
            : "border-l-[3px] border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        {item.hasAdd && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              if (item.key === "brands") setAddBrandOpen(true);
              if (item.key === "categories") setAddCategoryOpen(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded hover:bg-accent"
          >
            <Plus className="h-3 w-3" />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-card/50 w-[240px] shrink-0">
      {/* New Generation CTA */}
      <div className="px-3 pt-3 pb-2">
        <Button
          className="w-full h-9 text-xs font-semibold gap-1.5"
          onClick={() => onViewChange("generate")}
        >
          <Sparkles className="h-3.5 w-3.5" />
          New Generation
        </Button>
      </div>

      {/* Top nav items */}
      <div className="px-1 py-1 space-y-0.5">
        {TOP_NAV.map(renderNavItem)}
      </div>

      <Separator className="my-2" />

      {/* Bottom nav items */}
      <ScrollArea className="flex-1">
        <div className="px-1 py-1 space-y-0.5">
          {BOTTOM_NAV.map(renderNavItem)}
        </div>
      </ScrollArea>

      <AddBrandModal open={addBrandOpen} onOpenChange={setAddBrandOpen} />
      <AddCategoryModal open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </div>
  );
}
