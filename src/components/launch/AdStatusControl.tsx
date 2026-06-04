import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AD_STATUSES, AD_STATUS_LABEL, type AdStatus } from "@/lib/ad-status";

interface AdStatusControlProps {
  value: AdStatus;
  onChange: (status: AdStatus) => void;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Compact 3-way segmented control: Active / Scheduled / Paused.
 * Replaces the binary active/paused Switch in the per-ad editor and is reused
 * by the bulk-schedule dialog. The selected segment uses the primary token.
 */
export function AdStatusControl({ value, onChange, className, size = "sm" }: AdStatusControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Ad status"
      className={cn("inline-flex rounded-md border border-border p-0.5", className)}
    >
      {AD_STATUSES.map((status) => {
        const active = value === status;
        return (
          <Button
            key={status}
            type="button"
            role="radio"
            aria-checked={active}
            variant={active ? "default" : "ghost"}
            size={size}
            className={cn(
              "h-7 rounded-sm px-2.5 text-xs",
              !active && "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(status)}
          >
            {AD_STATUS_LABEL[status]}
          </Button>
        );
      })}
    </div>
  );
}
