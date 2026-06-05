import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Search, ChevronDown, ShieldCheck, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLaunch2Overlay } from "./Launch2OverlayProvider";
import { useLaunch2Variant, VARIANT_META } from "./useLaunch2Variant";
import { accounts } from "../mocks";

/** Map the current pathname to a human breadcrumb. */
function useCrumb(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith("/launch2/new")) return "New Launch";
  if (pathname.startsWith("/launch2/activity")) return "Activity";
  if (pathname.startsWith("/launch2/health")) return "Account Health";
  if (pathname.startsWith("/launch2/settings")) return "Settings";
  if (/^\/launch2\/[^/]+$/.test(pathname) && !pathname.endsWith("/new")) return "Launch Detail";
  return "Home";
}

/**
 * Persistent Launch 2.0 topbar: breadcrumb · account switcher · search ·
 * the always-available "+ New Launch" CTA. Lives inside the module (doesn't
 * touch the FabAds shell chrome).
 */
export function Launch2Topbar() {
  const navigate = useNavigate();
  const crumb = useCrumb();
  const { open } = useLaunch2Overlay();
  const { variant, cycle } = useLaunch2Variant();
  const healthy = accounts.filter((a) => a.health === "healthy").length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-5 backdrop-blur">
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={() => navigate("/launch2")}
        className="font-g6-sans text-sm font-semibold text-foreground hover:text-foreground/80"
      >
        Launch
      </button>
      <span className="text-muted-foreground/50">/</span>
      <span className="font-g6-sans text-sm text-muted-foreground">{crumb}</span>

      <div className="ml-auto flex items-center gap-2">
        {/* Account switcher (mock) */}
        <button
          type="button"
          className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted sm:flex"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--success-text))]" />
          <span className="font-g6-mono text-xs">{healthy}/{accounts.length} healthy</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Search (mock) */}
        <button
          type="button"
          className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search launches…</span>
          <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 font-g6-mono text-[10px] text-muted-foreground">⌘K</kbd>
        </button>

        {/* Dev-only variant indicator (Maalik) — cycles on click. */}
        <button
          type="button"
          onClick={cycle}
          title={`Dev: ${VARIANT_META[variant].label} — ${VARIANT_META[variant].hint} (click to cycle)`}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1.5 text-[10px] font-g6-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <FlaskConical className="h-3 w-3" />
          {variant}
        </button>

        {/* Persistent CTA */}
        <button
          type="button"
          onClick={() => open()}
          className={cn(
            "flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground",
            "shadow-sm transition-transform hover:-translate-y-0.5"
          )}
        >
          <Plus className="h-4 w-4" />
          New Launch
        </button>
      </div>
    </header>
  );
}
