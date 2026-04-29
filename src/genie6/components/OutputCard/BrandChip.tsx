import { cn } from "@/lib/utils";

export function BrandChip({ name, logo, className }: { name: string; logo?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-elevated/95 px-2 py-0.5 text-g6-xs font-medium text-g6-text backdrop-blur-sm",
        className
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 rounded-full bg-g6-primary"
        />
      )}
      <span className="max-w-[120px] truncate">{name}</span>
    </span>
  );
}
