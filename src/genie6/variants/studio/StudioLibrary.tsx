import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { LibraryQueueStrip } from "../../library/queue-strip/LibraryQueueStrip";

/**
 * Studio variant — Library.
 *
 * Library is strictly Generated Outputs (no sub-nav). Hooks / Angles /
 * Concepts / Templates / Avatars / Audiences moved to Assets (formerly
 * Workspace). Single dense surface focused on browsing what was generated.
 *
 * Filter state is owned by the LibraryToolbar inside GeneratedOutputsTab and
 * lives entirely in URL params — refresh, deep-link, and back/forward all
 * preserve filter + view state.
 *
 * A-12.194: `<AdDetailDrawer />` and `<AngleViewMoreDrawer />` moved UP to
 * Library.tsx so all 4 variants (studio / canvas / command / modular)
 * share them. Previously these were mounted only here, and on the other
 * 3 variants `?ad=` deep-links + card clicks silently no-op'd because
 * the drawer wasn't on the page. The variant body now renders ONLY the
 * page structure; URL-driven overlays live one level up.
 */
export function StudioLibrary() {
  return (
    <div className="v3-page-mesh flex h-full p-3">
      <main className="flex flex-1 overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <h1 className="text-g6-h4 font-bold text-g6-text">Library</h1>
            <p className="text-g6-xs text-g6-text-tertiary">142 outputs across all batches</p>
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {/* A-12.185: live queue strip — active batches (generating /
                queued / failed). Hidden when nothing is in the queue. */}
            <LibraryQueueStrip />

            <GeneratedOutputsTab />
          </div>
        </div>
      </main>
    </div>
  );
}
