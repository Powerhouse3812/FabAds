import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Globe, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotGridPattern } from "../components/DotGridPattern";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioSettings } from "../variants/studio/StudioSettings";
import { CanvasSettings } from "../variants/canvas/CanvasSettings";
import { CommandSettings } from "../variants/command/CommandSettings";
import { ModularSettings } from "../variants/modular/ModularSettings";

/**
 * SettingsHub — variant-aware router.
 *
 * Each architectural variant has its own Settings hub layout in
 * src/genie6/variants/. The detail editor pages (BrandSettings,
 * CategoryKBEditor, etc.) are still shared — only the hub view differs
 * per variant.
 *
 * Zero-data state is variant-agnostic.
 */
export function SettingsHub() {
  const [searchParams] = useSearchParams();
  const { variant } = useGenie6Theme();

  if (searchParams.get("empty") === "1") return <SettingsZeroData />;

  switch (variant) {
    case "canvas":
      return <CanvasSettings />;
    case "command":
      return <CommandSettings />;
    case "modular":
      return <ModularSettings />;
    case "studio":
    default:
      return <StudioSettings />;
  }
}

/* ─────────────────────────────────────────────────────────
   Zero-data state (Track 4.9) — variant-agnostic
   ───────────────────────────────────────────────────────── */
function SettingsZeroData() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
            <Building2 className="h-7 w-7 text-g6-primary" />
          </div>
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            No brands configured
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-md mx-auto">
            Add a brand to start generating ads tailored to its voice, products, and audience.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Globe, label: "Fetch by URL", sub: "Paste your brand site", featured: true },
            { Icon: Upload, label: "Upload CSV", sub: "Bulk import brands" },
            { Icon: Building2, label: "Manual entry", sub: "Form-led" },
            { Icon: Sparkles, label: "Try a demo", sub: "Mamaearth pre-loaded" },
          ].map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => navigate("/iq/genie6/settings/brands")}
              className={cn(
                "g6-lift flex flex-col items-start gap-2 rounded-g6-xl border bg-g6-bg-container p-4 text-left",
                it.featured ? "border-g6-primary-border shadow-g6-md" : "border-g6-border-secondary"
              )}
            >
              <it.Icon className="h-4 w-4 text-g6-text-secondary" />
              <span className="text-g6-base font-bold text-g6-text">{it.label}</span>
              <span className="text-g6-xs text-g6-text-tertiary">{it.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
