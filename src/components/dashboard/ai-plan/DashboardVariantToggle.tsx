import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DashboardVariantToggleProps {
  /** Which variant is currently rendering. */
  active: "v1" | "v2";
  className?: string;
}

/**
 * DashboardVariantToggle — tab-style switcher between V1 and V2 of the
 * AI-plan dashboard. Used in both AiPlanDashboard and AiPlanDashboardV2
 * headers so the user can flip without hunting for a tiny link.
 *
 * Each pill is a Link — clicking the inactive pill navigates with
 * `?v=2` (V2) or no flag (V1, default). State is URL-driven so it
 * survives reloads + can be deep-linked.
 *
 * V1 label: "Vercel" (analytics-led linear stack)
 * V2 label: "Operator" (bento "Operator Briefing" grid)
 *
 * Active pill = lime fill + dark text. Inactive = transparent, muted
 * text, hover lifts opacity.
 */
export function DashboardVariantToggle({
  active,
  className,
}: DashboardVariantToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard variant"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1",
        className,
      )}
    >
      <Pill to="/dashboard" label="V1 · Vercel" isActive={active === "v1"} />
      <Pill
        to="/dashboard?v=2"
        label="V2 · Operator"
        isActive={active === "v2"}
        badge="New"
      />
    </div>
  );
}

interface PillProps {
  to: string;
  label: string;
  isActive: boolean;
  badge?: string;
}

function Pill({ to, label, isActive, badge }: PillProps) {
  return (
    <Link
      to={to}
      role="tab"
      aria-selected={isActive}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors whitespace-nowrap",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {badge && !isActive && (
        <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0 font-mono text-[8.5px] uppercase tracking-wider text-primary leading-[14px]">
          {badge}
        </span>
      )}
    </Link>
  );
}
