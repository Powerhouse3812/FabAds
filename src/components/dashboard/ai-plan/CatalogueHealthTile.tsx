import { Link } from "react-router-dom";
import { ArrowRight, Building2, Package, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";
import { products } from "@/mocks/shared/products";
import { categories } from "@/mocks/shared/categories";

interface TileProps {
  className?: string;
}

interface HealthRow {
  icon: typeof Building2;
  label: string;
  pct: number;
}

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((n / d) * 100);
}

export function CatalogueHealthTile({ className }: TileProps) {
  const brandKbPct = pct(
    brands.filter(
      (b) =>
        b.voice.length > 20 && b.colors.length >= 2 && b.usps.length >= 2,
    ).length,
    brands.length,
  );

  const productLpPct = pct(
    products.filter((p) => !!p.landingPages && p.landingPages.length > 0)
      .length,
    products.length,
  );

  const categoryInstrPct = pct(
    categories.filter((c) => c.instruction.length > 20).length,
    categories.length,
  );

  const rows: HealthRow[] = [
    { icon: Building2, label: "Brand KB", pct: brandKbPct },
    { icon: Package, label: "Product landing pages", pct: productLpPct },
    { icon: Tag, label: "Category instructions", pct: categoryInstrPct },
  ];

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-none flex flex-col",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Catalogue Health
          </p>
          <h3 className="text-base font-semibold text-foreground mt-0.5">
            Your setup completeness
          </h3>
        </div>
        <Link
          to="/catalogue/brands"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline whitespace-nowrap"
        >
          Open catalogue <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      <ul className="mt-5 space-y-4 flex-1">
        {rows.map((row) => {
          const Icon = row.icon;
          const isLow = row.pct < 70;
          return (
            <li key={row.label} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[12.5px] text-foreground flex-1 min-w-0 truncate">
                  {row.label}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {row.pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isLow ? "bg-amber-500/70" : "bg-primary",
                  )}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
