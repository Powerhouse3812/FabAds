import { Link, useNavigate } from "react-router-dom";
import { Building2, FolderOpen, User, Mic, Layers, Shield, ArrowUpRight } from "lucide-react";
import { brands, categories, avatars, voices } from "../../mocks";

const SECTIONS = [
  { to: "/iq/genie6/settings/brands", Icon: Building2, label: "Brand Settings", description: "Profiles · fonts · voice · USPs · competitors", count: () => `${brands.length} brands` },
  { to: "/iq/genie6/settings/categories", Icon: FolderOpen, label: "Categories", description: "Knowledge bases · reference URLs · winners · feedback", count: () => `${categories.length} categories` },
  { to: "/iq/genie6/settings/avatars", Icon: User, label: "Avatar Library", description: "Personas for UGC Video mode", count: () => `${avatars.length} avatars` },
  { to: "/iq/genie6/settings/voices", Icon: Mic, label: "Voice Library", description: "Voice samples per language", count: () => `${voices.length} voices` },
  { to: "/iq/genie6/settings/templates", Icon: Layers, label: "Templates", description: "Visual layouts from winning ads", count: () => "0 templates" },
  { to: "/iq/genie6/settings/disclosure", Icon: Shield, label: "AI disclosure", description: "C2PA stamp preference on exports", count: () => null },
] as const;

/**
 * Canvas variant — Settings.
 *
 * Editor-style: settings rendered as tool tiles on a grid-floor canvas. Each
 * setting class = a tile you "open" to edit. Photoshop preferences vibe.
 */
export function CanvasSettings() {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />

      <header className="relative z-10 border-b border-g6-border-secondary bg-g6-bg-base/80 backdrop-blur-md px-5 py-3">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          canvas · settings · preferences
        </p>
        <h1 className="text-g6-h3 font-bold text-g6-text mt-1">Profiles & libraries</h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <button
              key={s.to}
              type="button"
              onClick={() => navigate(s.to)}
              className="group g6-lift relative flex flex-col gap-3 rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-container/80 backdrop-blur-md p-5 text-left shadow-g6-md hover:border-g6-primary-border transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-g6-card bg-g6-bg-spotlight group-hover:bg-g6-primary-bg transition-colors">
                <s.Icon className="h-5 w-5 text-g6-text group-hover:text-g6-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <h2 className="text-g6-base font-bold text-g6-text">{s.label}</h2>
                <p className="text-g6-xs text-g6-text-secondary leading-relaxed">{s.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{s.count()}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-g6-text-tertiary group-hover:text-g6-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <a
          href="/dashboard"
          className="mt-6 flex items-center justify-between rounded-g6-base border border-g6-border-secondary bg-g6-bg-base/60 backdrop-blur-md px-4 py-3 text-g6-sm text-g6-text-secondary hover:bg-g6-bg-container transition-colors"
        >
          <span>Account · Plan · Billing — managed in FabAds settings</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
