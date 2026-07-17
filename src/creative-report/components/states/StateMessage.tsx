/**
 * StateMessage — shared centered message for empty / filtered-empty / error /
 * low-data states (handoff §8). Friendly copy, one clear action, never blames
 * the user. Filters are always preserved by the caller.
 */
import {
  AlertTriangle,
  Filter,
  PlugZap,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReportParams } from "@/creative-report/hooks/useReportParams";

type Variant = "empty" | "filtered" | "error" | "low-data";

const ICONS: Record<Variant, React.ElementType> = {
  empty: PlugZap,
  filtered: SearchX,
  error: AlertTriangle,
  "low-data": Filter,
};

export function StateMessage({
  variant,
  title,
  body,
  actionLabel,
  onAction,
}: {
  variant: Variant;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Icon = ICONS[variant];
  const { activeFilterCount, clearFilters } = useReportParams();
  const showClear = variant === "filtered" && activeFilterCount > 0;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
        <Icon className={variant === "error" ? "h-5 w-5 text-destructive" : "h-5 w-5 text-muted-foreground"} />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <div className="mt-4 flex items-center gap-2">
        {showClear && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
