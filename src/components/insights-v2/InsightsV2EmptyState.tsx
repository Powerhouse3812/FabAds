import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightsV2EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; onClick: () => void; variant?: "default" | "outline" };
}

export function InsightsV2EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: InsightsV2EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Icon className="h-10 w-10 text-muted-foreground/40" />
      <div className="text-center max-w-md">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && <p className="text-xs text-foreground/70 mt-1">{description}</p>}
      </div>
      {cta && (
        <Button size="sm" variant={cta.variant ?? "outline"} onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}
