import { cn } from "@/lib/utils";
import type { Brand } from "@/hooks/use-brands";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface Props {
  brand: Brand;
  isActive: boolean;
  onClick: () => void;
  onDetail: () => void;
}

export function Genie3BrandCard({ brand, isActive, onClick, onDetail }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left transition-all group",
        isActive
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-accent/50 border border-transparent"
      )}
    >
      <BrandLogo name={brand.name} logoUrl={brand.logo_url} website={brand.website} color={brand.colors?.[0]} size="md" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-xs font-medium truncate", isActive ? "text-primary" : "text-foreground")}>
          {brand.name}
        </p>
        {brand.category && (
          <p className="text-[10px] text-muted-foreground truncate">{brand.category}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDetail(); }}
        className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground hover:text-foreground transition-opacity shrink-0"
      >
        Edit
      </button>
    </button>
  );
}
