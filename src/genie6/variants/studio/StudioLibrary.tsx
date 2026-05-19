import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { AdDetailDrawer } from "../../components/AdDetailDrawer";
import { AngleViewMoreDrawer } from "../../components/AngleViewMoreDrawer";

/**
 * Studio variant — Library.
 *
 * Library is now strictly Generated Outputs (no sub-nav). Hooks / Angles /
 * Concepts / Templates / Avatars / Audiences moved to Assets (formerly
 * Workspace). Single dense surface focused on browsing what was generated.
 *
 * Filter state is owned by the LibraryToolbar inside GeneratedOutputsTab and
 * lives entirely in URL params — refresh, deep-link, and back/forward all
 * preserve filter + view state. The legacy local-state FilterBar that used to
 * sit at the page level is gone (Phase 7 of the redesign).
 */
export function StudioLibrary() {
  return (
    <div className="v3-page-mesh flex h-full p-3">
      <main className="flex flex-1 overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <h1 className="text-g6-h4 font-bold text-g6-text">Generations</h1>
            <p className="text-g6-xs text-g6-text-tertiary">142 outputs across all batches</p>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <GeneratedOutputsTab />
          </div>
        </div>
        {/* Drawers — URL-driven, render only when corresponding query param is set.
            Stacking: AngleViewMoreDrawer opens on ?angle=, AdDetailDrawer opens
            on ?ad=. Both can be set simultaneously (view-more drawer with a
            detail drawer on top) — Radix Portal handles z-index naturally. */}
        <AngleViewMoreDrawer />
        <AdDetailDrawer />
      </main>
    </div>
  );
}
