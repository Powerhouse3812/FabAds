import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Globe, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotGridPattern } from "../components/DotGridPattern";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioWorkspace } from "../variants/studio/StudioWorkspace";
import { CanvasWorkspace } from "../variants/canvas/CanvasWorkspace";
import { CommandWorkspace } from "../variants/command/CommandWorkspace";
import { ModularWorkspace } from "../variants/modular/ModularWorkspace";

/**
 * WorkspaceView — variant-aware router.
 *
 * Each architectural variant has its own Workspace shell in
 * src/genie6/variants/. Each shell still allows the user to switch between
 * Tree / Master-detail / Cards (Track 4.3 plan) but defaults to a different
 * view per variant:
 *   studio   → master-detail (agency-desk drill-down)
 *   canvas   → cards         (visual asset gallery)
 *   command  → tree          (dense ops browse)
 *   modular  → cards         (each brand = a module)
 *
 * Zero-data state is variant-agnostic.
 */
export function WorkspaceView() {
  const [searchParams] = useSearchParams();
  const tab: "brands" | "categories" = window.location.pathname.includes("/categories")
    ? "categories"
    : "brands";
  const { variant } = useGenie6Theme();

  if (searchParams.get("empty") === "1") return <WorkspaceZeroData tab={tab} />;

  switch (variant) {
    case "canvas":
      return <CanvasWorkspace />;
    case "command":
      return <CommandWorkspace />;
    case "modular":
      return <ModularWorkspace />;
    case "studio":
    default:
      return <StudioWorkspace />;
  }
}

/** Index page when no brandId / categoryId in URL — same router. */
export function WorkspaceIndex() {
  return <WorkspaceView />;
}

/* ─────────────────────────────────────────────────────────
   Zero-data state (Track 4.9) — variant-agnostic
   ───────────────────────────────────────────────────────── */
function WorkspaceZeroData({ tab }: { tab: "brands" | "categories" }) {
  const navigate = useNavigate();
  const label = tab === "brands" ? "brand" : "category";

  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
          <Building2 className="h-7 w-7 text-g6-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            No {label}s yet
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-md">
            Add your first {label} to start generating ads tuned to its voice, products, and audience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full">
          <ZeroNudge
            Icon={Globe}
            title="Fetch by URL"
            sub="Paste your brand site"
            cta="Start"
            onClick={() => navigate("/iq/genie6/settings/brands")}
            featured
          />
          <ZeroNudge
            Icon={Upload}
            title="Upload CSV"
            sub="Bulk import"
            cta="Upload"
            onClick={() => navigate("/iq/genie6/settings/brands")}
          />
          <ZeroNudge
            Icon={Sparkles}
            title="Try a demo"
            sub="Mamaearth pre-loaded"
            cta="Try demo"
            onClick={() => navigate("/iq/genie6/workspace/brands")}
          />
        </div>
      </div>
    </div>
  );
}

function ZeroNudge({
  Icon,
  title,
  sub,
  cta,
  onClick,
  featured,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  cta: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "g6-lift flex flex-col items-start gap-2 rounded-g6-xl border bg-g6-bg-container p-4 text-left",
        featured ? "border-g6-primary-border shadow-g6-md" : "border-g6-border-secondary"
      )}
    >
      <Icon className="h-4 w-4 text-g6-text-secondary" />
      <span className="text-g6-base font-bold text-g6-text">{title}</span>
      <span className="text-g6-xs text-g6-text-tertiary">{sub}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-g6-sm font-medium text-g6-primary">
        {cta} →
      </span>
    </button>
  );
}
