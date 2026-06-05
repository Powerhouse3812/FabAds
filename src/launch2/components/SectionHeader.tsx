import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  sub,
  action,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="font-g6-sans text-base font-semibold text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
