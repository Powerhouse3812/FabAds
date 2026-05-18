import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DashboardVariantToggleProps {
  /** Which variant is currently rendering. */
  active: "v1" | "v2";
  className?: string;
}

/**
 * DashboardVariantToggle — tab-style switcher between V1 and V2 of the
 * AI-plan dashboard.
 *
 * Previously used `<Link>` which had a path-resolution quirk on
 * same-pathname-different-search transitions. Switched to explicit
 * `useNavigate` + button onClick so the URL update is direct + the
 * search-param mutation is unambiguous.
 *
 * URL state:
 *   /dashboard          → V1
 *   /dashboard?v=2      → V2
 *
 * V1 label: "Vercel" (analytics-led linear stack)
 * V2 label: "Operator" (bento "Operator Briefing" grid)
 */
export function DashboardVariantToggle({
  active,
  className,
}: DashboardVariantToggleProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const goToVariant = (target: "v1" | "v2") => {
    if (target === active) return; // no-op nav
    // Preserve all OTHER search params (setup=skip, newuser=true, etc.)
    // and only mutate the `v` param.
    const sp = new URLSearchParams(searchParams);
    if (target === "v2") sp.set("v", "2");
    else sp.delete("v");
    const search = sp.toString();
    navigate(`/dashboard${search ? `?${search}` : ""}`, { replace: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Dashboard variant"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1",
        className,
      )}
    >
      <Pill
        label="V1 · Vercel"
        isActive={active === "v1"}
        onClick={() => goToVariant("v1")}
      />
      <Pill
        label="V2 · Operator"
        isActive={active === "v2"}
        badge="New"
        onClick={() => goToVariant("v2")}
      />
    </div>
  );
}

interface PillProps {
  label: string;
  isActive: boolean;
  badge?: string;
  onClick: () => void;
}

function Pill({ label, isActive, badge, onClick }: PillProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
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
    </button>
  );
}
