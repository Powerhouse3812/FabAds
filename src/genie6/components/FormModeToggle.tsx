import { Zap, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormMode } from "../stores/formModeStore";

/**
 * FormModeToggle — Quick / Advanced pill toggle for the Generate form (P-5).
 *
 * Quick: brand + 2 essentials + count. AI fills the rest.
 * Advanced: every field exposed.
 *
 * Persisted via formModeStore. Pin near the top of every variant's
 * GenerateForm so the user always sees what mode they're in.
 */
export function FormModeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useFormMode();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base p-0.5",
        className
      )}
    >
      <ToggleButton
        Icon={Zap}
        label="Quick"
        active={mode === "quick"}
        onClick={() => setMode("quick")}
        hint="Brand + essentials. AI fills the rest."
      />
      <ToggleButton
        Icon={Settings2}
        label="Advanced"
        active={mode === "advanced"}
        onClick={() => setMode("advanced")}
        hint="Full control over every field."
      />
    </div>
  );
}

function ToggleButton({
  Icon,
  label,
  active,
  onClick,
  hint,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-g6-pill px-3 font-g6-sans text-g6-xs font-semibold transition-colors",
        active
          ? "bg-g6-primary text-g6-text-on-accent"
          : "text-g6-text-secondary hover:text-g6-text"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
