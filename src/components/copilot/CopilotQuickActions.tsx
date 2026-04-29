import { useCopilot } from "@/contexts/CopilotContext";
import { MODULE_QUICK_ACTIONS } from "@/lib/copilot-prompts";

interface CopilotQuickActionsProps {
  onAction: (prompt: string) => void;
  disabled?: boolean;
}

export function CopilotQuickActions({ onAction, disabled }: CopilotQuickActionsProps) {
  const { currentModule } = useCopilot();
  const actions = MODULE_QUICK_ACTIONS[currentModule] || MODULE_QUICK_ACTIONS.default;

  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          disabled={disabled}
          className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
