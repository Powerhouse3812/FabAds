import { X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LaunchScopeChipProps {
  className?: string;
}

/**
 * Active-scope chip for the URL-driven launch filter.
 *
 * Renders only when the reports URL carries `?launch=<launchId>`. Shows a
 * shortened launch id and an × that clears the `launch` param (staying on the
 * current path and preserving any other query params), returning the report to
 * its unscoped view.
 */
export function LaunchScopeChip({ className }: LaunchScopeChipProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const launchScope = searchParams.get("launch");

  if (!launchScope) return null;

  const shortId = launchScope.length > 10 ? `${launchScope.slice(0, 8)}…` : launchScope;

  const clearScope = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("launch");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Badge variant="secondary" className="gap-1.5 pl-2.5 pr-1 py-1">
        <span className="text-xs font-medium">
          Launch scope · <span className="font-mono">{shortId}</span>
        </span>
        <button
          type="button"
          onClick={clearScope}
          aria-label="Clear launch scope"
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-secondary-foreground/70 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    </div>
  );
}
