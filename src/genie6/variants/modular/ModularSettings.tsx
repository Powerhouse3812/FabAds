import { Link } from "react-router-dom";
import { GripVertical, ArrowUpRight, Building2, FolderOpen, User, Mic, Layers, Shield } from "lucide-react";
import { brands, categories, avatars, voices } from "../../mocks";

const SECTIONS = [
  { to: "/iq/genie6/settings/brands", Icon: Building2, label: "brands_module", description: "profiles · fonts · voice · USPs · competitors", count: () => `${brands.length} brands` },
  { to: "/iq/genie6/settings/categories", Icon: FolderOpen, label: "categories_module", description: "knowledge bases · references · winners", count: () => `${categories.length} categories` },
  { to: "/iq/genie6/settings/avatars", Icon: User, label: "avatars_module", description: "personas for UGC video mode", count: () => `${avatars.length} avatars` },
  { to: "/iq/genie6/settings/voices", Icon: Mic, label: "voices_module", description: "voice samples per language", count: () => `${voices.length} voices` },
  { to: "/iq/genie6/settings/templates", Icon: Layers, label: "templates_module", description: "visual layouts from winning ads", count: () => "0 templates" },
  { to: "/iq/genie6/settings/disclosure", Icon: Shield, label: "disclosure_module", description: "C2PA stamp preference on exports", count: () => "config" },
] as const;

/**
 * Modular variant — Settings.
 *
 * Each setting class = a module on the cosmic canvas. Code-style header per
 * module, grip handle for reorder affordance, module-cards reveal description
 * and count. Click → drill into the actual editor route.
 */
export function ModularSettings() {
  return (
    <div className="g6-halo relative min-h-full p-6">
      <header className="relative z-10 mb-6">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> settings.modules
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          System configuration
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-1">
          Profile + library modules — drag-reorder coming soon
        </p>
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="g6-glass group rounded-g6-card p-4 hover:border-g6-primary-border transition-colors"
          >
            <header className="mb-3 flex items-center justify-between">
              <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                <span className="text-g6-primary">&gt;</span> {s.label}
              </p>
              <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
            </header>
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-g6-base bg-g6-bg-base/50 group-hover:bg-g6-primary-bg transition-colors">
                <s.Icon className="h-5 w-5 text-g6-text-secondary group-hover:text-g6-primary transition-colors" />
              </div>
              <p className="text-g6-sm text-g6-text leading-snug">{s.description}</p>
              <div className="flex items-center justify-between border-t border-g6-border-secondary pt-2">
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{s.count()}</span>
                <ArrowUpRight className="h-3 w-3 text-g6-text-tertiary group-hover:text-g6-primary transition-colors" />
              </div>
            </div>
          </Link>
        ))}

        {/* Account — external */}
        <a
          href="/dashboard"
          className="lg:col-span-3 rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-base/30 backdrop-blur-md p-4 flex items-center justify-between hover:border-g6-primary-border transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
              <span className="text-g6-primary">&gt;</span> account_module
            </span>
            <span className="text-g6-sm text-g6-text-secondary">Plan · Billing — managed in FabAds settings</span>
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-g6-text-tertiary" />
        </a>
      </div>
    </div>
  );
}
