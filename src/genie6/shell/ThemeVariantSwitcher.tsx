import { Columns3, Brush, LayoutDashboard, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenie6Theme, type GenieVariant } from "../hooks/useGenie6Theme";

/**
 * Architectural variant switcher.
 *
 * 4 architecturally distinct variants — not token swaps. Each has its own
 * component implementations per surface (Home / Workspace / Generate / Library /
 * Settings). Toggling here swaps the entire app architecture.
 *
 *   Studio   ↔ Columns3        — 3-column (mode tree + form + preview)
 *   Canvas   ↔ Brush           — editor-first (viewport + tool rails)
 *   Command  ↔ LayoutDashboard — ops dashboard (KPI grid)
 *   Modular  ↔ Boxes           — composable cards
 */

type VariantSpec = {
  id: GenieVariant;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
};

const VARIANTS: VariantSpec[] = [
  {
    id: "studio",
    Icon: Columns3,
    label: "Studio",
    description: "3-column workspace · mode tree + form + live preview · default",
  },
  {
    id: "canvas",
    Icon: Brush,
    label: "Canvas",
    description: "Editor-first · massive viewport + vertical tools · Photoshop mental model",
  },
  {
    id: "command",
    Icon: LayoutDashboard,
    label: "Command",
    description: "Ops dashboard · KPIs + brands + activity always visible",
  },
  {
    id: "modular",
    Icon: Boxes,
    label: "Modular",
    description: "Composable cards · draggable modules on dark canvas",
  },
];

export function ThemeVariantSwitcher() {
  const { variant, setVariant } = useGenie6Theme();
  const active = VARIANTS.find((v) => v.id === variant) ?? VARIANTS[0];

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden sm:inline-flex font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-secondary px-2 py-1 rounded-g6-base bg-g6-primary-bg/40 border border-g6-primary-border"
        aria-live="polite"
      >
        {active.label}
      </span>
      <div
        role="tablist"
        aria-label="Genie 6 architectural variant"
        className="inline-flex items-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-0.5"
      >
        {VARIANTS.map(({ id, Icon, label, description }, i) => {
          const isActive = variant === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              title={`${label} — ${description} · ⌘${i + 1}`}
              onClick={() => setVariant(id)}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-g6-base transition-colors",
                isActive
                  ? "bg-g6-primary text-g6-text-on-accent"
                  : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
