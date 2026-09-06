import { ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RetryModelOption {
  id: string;
  label: string;
}

/**
 * Small local model list for the retry flow. Mirrors the ids used by
 * PromptReferenceBar's model picker (Configure step, owned by the Configure
 * agent) without importing from that file — it isn't exported for reuse and
 * isn't in this agent's ownership. Kept intentionally short; this is a retry
 * decision, not the full Configure model catalogue.
 */
export const RETRY_MODEL_OPTIONS: RetryModelOption[] = [
  { id: "genie-1.0", label: "Genie 1.0" },
  { id: "genie-2.0-pro", label: "Genie 2.0 Pro" },
  { id: "genie-flash", label: "Genie Flash" },
  { id: "genie-video", label: "Genie Video" },
  { id: "genie-labs", label: "Genie Labs" },
];

interface RetryModelPickerProps {
  /** The model this batch already tried — excluded so the list only offers
   *  a genuine alternative. */
  excludeModelId?: string;
  /**
   * §21.3 — "Button copy must state the credit consequence." creditsForRetry
   * returns ONE number for the "different-model" scope regardless of which
   * model gets picked next, so the cost is stated on the trigger; the menu
   * only decides which model to use.
   */
  credits?: number;
  disabled?: boolean;
  onPick: (modelId: string) => void;
  label?: string;
  variant?: "outline" | "ghost" | "default";
  className?: string;
}

/**
 * RetryModelPicker — the model-choice step for RetryScope "different-model"
 * (§21.3's 4th retry granularity). A plain Retry button can't ask "which
 * model" on its own, so this wraps the choice in a DropdownMenu (excluded
 * from the app's no-outside-click-dismiss rule) and only calls back once a
 * model is actually picked.
 */
export function RetryModelPicker({
  excludeModelId,
  credits,
  disabled,
  onPick,
  label,
  variant = "outline",
  className,
}: RetryModelPickerProps) {
  const options = RETRY_MODEL_OPTIONS.filter((m) => m.id !== excludeModelId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={variant}
          disabled={disabled}
          className={cn("h-7 gap-1.5 text-[12px]", className)}
        >
          <RefreshCw className="h-3 w-3" />
          {label ?? "Retry — different model"}
          {typeof credits === "number" && (
            <span className="font-mono text-[10px] text-muted-foreground">
              ({credits} credit{credits === 1 ? "" : "s"})
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[190px]">
        <DropdownMenuLabel className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
          Retry with
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((m) => (
          <DropdownMenuItem key={m.id} onSelect={() => onPick(m.id)}>
            {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
