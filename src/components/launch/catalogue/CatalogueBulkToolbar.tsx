import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Pencil } from "lucide-react";
import type { EntityType } from "./CatalogueHierarchyPanel";

interface Props {
  checkedType: EntityType;
  checkedCount: number;
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
}

const ACTIONS_BY_TYPE: Record<EntityType, Array<{ key: string; label: string; icon?: typeof Pencil; variant?: "destructive" }>> = {
  account: [
    { key: "page", label: "Page" },
    { key: "pixel", label: "Pixel" },
    { key: "website_url", label: "Website URL" },
    { key: "display_link", label: "Display Link" },
    { key: "url_tags", label: "URL Tags" },
    { key: "strategy", label: "Strategy" },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  campaign: [
    { key: "objective", label: "Objective" },
    { key: "budget", label: "Budget" },
    { key: "bid_strategy", label: "Bid Strategy" },
    { key: "catalogue_override", label: "Catalogue Override" },
    { key: "duplicate", label: "Duplicate", icon: Copy },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  adset: [
    { key: "product_set", label: "Product Set" },
    { key: "locations", label: "Locations" },
    { key: "gender", label: "Gender" },
    { key: "age", label: "Age" },
    { key: "placements", label: "Placements" },
    { key: "devices", label: "Devices" },
    { key: "duplicate", label: "Duplicate", icon: Copy },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  ad: [
    { key: "primary_text", label: "Primary Text" },
    { key: "headline", label: "Headline" },
    { key: "cta", label: "CTA" },
    { key: "destination_url", label: "Destination URL" },
    { key: "duplicate", label: "Duplicate", icon: Copy },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
};

export function CatalogueBulkToolbar({ checkedType, checkedCount, onBulkAction, onClearSelection }: Props) {
  const actions = ACTIONS_BY_TYPE[checkedType] || [];

  return (
    <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-muted/30 rounded-md border border-border">
      <Badge variant="secondary" className="text-xs">
        {checkedCount} {checkedType}{checkedCount > 1 ? "s" : ""} selected
      </Badge>
      <div className="flex items-center gap-1 flex-wrap">
        {actions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant === "destructive" ? "destructive" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onBulkAction(action.key)}
          >
            {action.icon && <action.icon className="h-3 w-3 mr-1" />}
            {action.label}
          </Button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={onClearSelection}>
        Clear
      </Button>
    </div>
  );
}
