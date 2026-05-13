import { CheckCircle2, XCircle, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CopilotAction } from "@/lib/copilot-actions";

interface CopilotActionCardProps {
  action: CopilotAction;
  onExecute: (action: CopilotAction) => void;
  onCancel: (action: CopilotAction) => void;
}

export function CopilotActionCard({ action, onExecute, onCancel }: CopilotActionCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        {action.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {action.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
        {action.status === "executing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        <span className="text-sm font-medium">{action.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{action.description}</p>
      {action.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs" onClick={() => onExecute(action)}>
            Execute
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onCancel(action)}>
            Cancel
          </Button>
        </div>
      )}
      {action.status === "success" && action.result && (
        <p className="text-xs text-green-600 dark:text-green-400 inline-flex items-center gap-1"><Check className="h-3 w-3" strokeWidth={3} /> {JSON.stringify(action.result).slice(0, 100)}</p>
      )}
      {action.status === "error" && action.result && (
        <p className="text-xs text-destructive inline-flex items-center gap-1"><X className="h-3 w-3" strokeWidth={3} /> {action.result.error || "Action failed"}</p>
      )}
    </div>
  );
}
