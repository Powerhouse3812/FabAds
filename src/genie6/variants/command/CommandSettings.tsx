import { Link } from "react-router-dom";
import { ArrowUpRight, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { brands, categories, avatars, voices } from "../../mocks";

const SECTIONS = [
  { to: "/iq/genie6/settings/brands", label: "Brand Settings", description: "Profiles, fonts, voice, USPs, compliance, competitors", count: () => brands.length, unit: "brands", status: "ok" },
  { to: "/iq/genie6/settings/categories", label: "Category Settings", description: "Knowledge bases, reference URLs, winners, feedback log", count: () => categories.length, unit: "categories", status: "ok" },
  { to: "/iq/genie6/settings/avatars", label: "Avatar Library", description: "Personas for UGC Video mode", count: () => avatars.length, unit: "avatars", status: "ok" },
  { to: "/iq/genie6/settings/voices", label: "Voice Library", description: "Voice samples per language", count: () => voices.length, unit: "voices", status: "ok" },
  { to: "/iq/genie6/settings/templates", label: "Templates", description: "Visual layouts from winning ads", count: () => 0, unit: "templates", status: "empty" },
  { to: "/iq/genie6/settings/disclosure", label: "AI disclosure (C2PA)", description: "When the AI-generated stamp appears on exports", count: () => null, unit: "", status: "config" },
] as const;

/**
 * Command variant — Settings.
 *
 * Ops config-table mental model: each setting class is a row in a config
 * table. Status chip per row (ok / empty / config), monospace counts, dense
 * vertical scan. Mercury / Linear settings page vibe.
 */
export function CommandSettings() {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex flex-1 flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
        <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-4 w-4 text-g6-primary" />
            <h1 className="text-g6-h4 font-bold text-g6-text">System configuration</h1>
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
              · {SECTIONS.length} subsystems
            </span>
          </div>
          <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-g6-success" />
            all configured
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-g6-sm">
            <thead className="bg-g6-bg-base sticky top-0">
              <tr className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                <th className="px-5 py-2.5 text-left font-normal">Subsystem</th>
                <th className="px-3 py-2.5 text-left font-normal">Description</th>
                <th className="px-3 py-2.5 text-right font-normal">Count</th>
                <th className="px-3 py-2.5 text-left font-normal">Status</th>
                <th className="w-10 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-g6-border-secondary">
              {SECTIONS.map((s) => {
                const count = s.count();
                const statusColor =
                  s.status === "empty" ? "bg-g6-warning" :
                  s.status === "config" ? "bg-g6-primary" : "bg-g6-success";
                const statusLabel =
                  s.status === "empty" ? "empty" :
                  s.status === "config" ? "configurable" : "active";
                return (
                  <tr key={s.to} className="group hover:bg-g6-bg-spotlight transition-colors">
                    <td className="px-5 py-3">
                      <Link to={s.to} className="font-medium text-g6-text">{s.label}</Link>
                    </td>
                    <td className="px-3 py-3 text-g6-text-secondary text-g6-xs">
                      {s.description}
                    </td>
                    <td className="px-3 py-3 text-right font-g6-mono tabular-nums text-g6-text">
                      {count !== null ? `${count} ${s.unit}` : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor}`} />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link to={s.to}>
                        <ChevronRight className="h-3.5 w-3.5 text-g6-text-tertiary group-hover:text-g6-text" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {/* Account row — external */}
              <tr className="hover:bg-g6-bg-spotlight transition-colors">
                <td className="px-5 py-3">
                  <a href="/dashboard" className="font-medium text-g6-text">Account · Plan · Billing</a>
                </td>
                <td className="px-3 py-3 text-g6-text-secondary text-g6-xs">
                  Managed in FabAds settings (external)
                </td>
                <td className="px-3 py-3 text-right font-g6-mono text-g6-text">—</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-g6-text-tertiary" />
                    external
                  </span>
                </td>
                <td className="px-3 py-3">
                  <a href="/dashboard">
                    <ArrowUpRight className="h-3.5 w-3.5 text-g6-text-tertiary" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
