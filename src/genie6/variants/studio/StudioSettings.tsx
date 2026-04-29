import { Link } from "react-router-dom";
import { ChevronRight, ArrowUpRight, Settings as SettingsIcon } from "lucide-react";
import { brands, categories, avatars, voices } from "../../mocks";

const SECTIONS = [
  {
    to: "/iq/genie6/settings/brands",
    label: "Brand Settings",
    description: "Profiles · fonts + colors + voice + USPs · compliance per brand × category · competitors",
    countLabel: "brands",
    getCount: () => brands.length,
  },
  {
    to: "/iq/genie6/settings/categories",
    label: "Category Settings",
    description: "Knowledge bases · reference URLs · winner creatives · feedback log · similar categories",
    countLabel: "categories",
    getCount: () => categories.length,
  },
  {
    to: "/iq/genie6/settings/avatars",
    label: "Avatar Library",
    description: "Personas for UGC Video mode. Indian + global demographics seeded.",
    countLabel: "avatars",
    getCount: () => avatars.length,
  },
  {
    to: "/iq/genie6/settings/voices",
    label: "Voice Library",
    description: "Voice samples per language. Match to avatar + audience for UGC.",
    countLabel: "voices",
    getCount: () => voices.length,
  },
  {
    to: "/iq/genie6/settings/templates",
    label: "Templates",
    description: "Visual layouts saved from winning ads. Apply on future generations.",
    countLabel: "templates",
    getCount: () => 0,
  },
  {
    to: "/iq/genie6/settings/disclosure",
    label: "AI disclosure",
    description: "When the AI-generated stamp appears on exports — Always · Regulated regions · Never (C2PA standard).",
    countLabel: "",
    getCount: () => 0,
  },
] as const;

/**
 * Studio variant — Settings.
 *
 * Apple Settings vibe: section nav rail left, content card right (read-only
 * preview of the first section). Click a section to drill in. Agency-desk
 * structured.
 */
export function StudioSettings() {
  return (
    <div className="grid h-full grid-cols-[220px_1fr] gap-3 p-3">
      {/* Left: section nav */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-3">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon className="h-3.5 w-3.5 text-g6-primary" />
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Settings
          </p>
        </div>
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="flex w-full items-center justify-between rounded-g6-base px-2 py-1.5 text-g6-sm text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text transition-colors"
              >
                <span className="truncate">{s.label.replace(" Settings", "").replace(" Library", "")}</span>
                {s.countLabel && (
                  <span className="font-g6-mono text-g6-xs text-g6-text-tertiary tabular-nums">{s.getCount()}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-g6-border-secondary">
          <a
            href="/dashboard"
            className="flex items-center justify-between rounded-g6-base px-2 py-1.5 text-g6-sm text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text transition-colors"
          >
            <span>Account · Plan</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </aside>

      {/* Right: detail content */}
      <main className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
        <header className="border-b border-g6-border-secondary bg-g6-bg-base px-6 py-4">
          <h1 className="text-g6-h3 font-bold text-g6-text">Profiles & libraries</h1>
          <p className="text-g6-sm text-g6-text-secondary mt-1">
            Brand identity, category knowledge bases, avatar + voice libraries, layout templates.
          </p>
        </header>
        <div className="p-6">
          <ul className="space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.to}>
                <Link
                  to={s.to}
                  className="group flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-base p-4 transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg/40"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-g6-base font-semibold text-g6-text">{s.label}</h2>
                      {s.countLabel && (
                        <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
                          · {s.getCount()} {s.countLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-g6-sm text-g6-text-secondary">{s.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-g6-text-tertiary group-hover:text-g6-text" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
