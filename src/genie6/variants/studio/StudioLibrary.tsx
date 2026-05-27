import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { LibraryTopBar } from "../../components/LibraryTopBar";

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
 * share them.
 *
 * A-12.197 (Library Figma final): replaced the title/subtitle header AND
 * the standalone `<LibraryQueueStrip />` row with the canonical
 * `<LibraryTopBar />` — single 52px-tall bar that collapses breadcrumb +
 * view toggle + inline queue strip + select-days control. The view toggle
 * lives ONLY in the top bar now (the duplicate that used to sit inside
 * `GeneratedOutputsTab` next to the CSV-export button has been removed).
 */
export function StudioLibrary() {
  return (
    <div className="v3-page-mesh flex h-full p-3">
      <main className="flex flex-1 overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
        <div className="flex flex-1 flex-col overflow-hidden">
          <LibraryTopBar />
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <GeneratedOutputsTab />
          </div>
        </div>
      </main>
    </div>
  );
}
