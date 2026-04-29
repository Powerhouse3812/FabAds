import { Sparkles, Briefcase, Sun, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenie6Theme, type GenieVariant } from "../hooks/useGenie6Theme";

/**
 * Theme variant switcher (Track 5).
 *
 * 4 variants: Mirage / Operator / Soft / Mercury. Each is a complete design system
 * (surface palette, accent palette, typography, shadows, radius). Same component code
 * renders different visuals via CSS variable lookup against `[data-genie6-variant]`.
 *
 * Lives in AppLayout topbar, only when `pathname.startsWith("/iq/genie6")`.
 * Pattern matches the Workspace 3-view switcher — small icon row, not a popping button.
 *
 * Default variant: Operator (production work mode).
 */

type VariantSpec = {
  id: GenieVariant;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
};

const VARIANTS: VariantSpec[] = [
  {
    id: "operator",
    Icon: Briefcase,
    label: "Operator",
    description: "Default · agency work mode · clean light/dark parity",
  },
  {
    id: "mirage",
    Icon: Sparkles,
    label: "Mirage",
    description: "Dark · glass + gradient · demo-ready aspirational",
  },
  {
    id: "soft",
    Icon: Sun,
    label: "Soft",
    description: "Light · pastel hazes · generous whitespace",
  },
  {
    id: "mercury",
    Icon: Landmark,
    label: "Mercury",
    description: "Navy/cream · Crimson Pro serif · financial-grade",
  },
];

export function ThemeVariantSwitcher() {
  const { variant, setVariant } = useGenie6Theme();

  return (
    <div
      role="tablist"
      aria-label="Genie 6 theme variant"
      className="inline-flex items-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-0.5"
    >
      {VARIANTS.map(({ id, Icon, label, description }) => {
        const active = variant === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            title={`${label} — ${description}`}
            onClick={() => setVariant(id)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-g6-base transition-colors",
              active
                ? "bg-g6-primary text-g6-text-on-accent"
                : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
