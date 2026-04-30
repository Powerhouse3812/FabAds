import { Search } from "lucide-react";

/**
 * Sleek search bar at the top of the Genie 6 sub-nav. Visual reference for
 * the secondary-style buttons that follow (e.g., New generation).
 *
 * Iter-5: command-palette modal removed per Maalik directive. Search is a
 * placeholder for future content-search (brands / outputs / etc.) — currently
 * a no-op click. Variant + theme + profile remain in the sidebar bottom;
 * jump-to navigation lives in the sidebar items themselves; no need for a
 * universal command palette.
 *
 * Visual: rounded border, search icon left, ⌘K pill right. Same shape as
 * Genie6SubnavNewGenButton so the two read as a coherent button stack.
 */
export function Genie6SubnavSearch() {
  return (
    <button
      type="button"
      // Click is currently a no-op (palette removed). Future: open inline
      // content-search dropdown.
      onClick={() => {}}
      aria-label="Search Genie 6"
      className="group flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-1.5 text-left text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">Search…</span>
      <span className="shrink-0 rounded border border-sidebar-border bg-sidebar-background px-1 py-0 font-mono text-[10px] text-sidebar-foreground/50">
        ⌘K
      </span>
    </button>
  );
}
