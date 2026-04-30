import { Search } from "lucide-react";
import { useCommandPalette } from "./CommandPalette";

/**
 * Sleek search bar at the top of the Genie 6 sub-nav. Click → opens the
 * command palette (which already handles New generation, theme toggle, variant
 * switch, jump-to, mode launch). Keeps a discoverable affordance so users who
 * don't know ⌘K can still reach the universal command surface.
 *
 * Iter-4 / iter-5: replaces the right-rail's "+ New gen" + ⌘K pill duo. Those
 * functions all live inside the palette; the right rail is now removed
 * entirely. New gen + variant + theme are reachable from this search bar (or
 * from the sidebar bottom for variant + theme + profile).
 *
 * Visual: full-width (within the sub-nav column), 32px high, neutral border,
 * search icon + placeholder + small ⌘K pill on the right.
 */
export function Genie6SubnavSearch() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command palette"
      className="group flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-1.5 text-left text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">Search or jump to…</span>
      <span className="shrink-0 rounded border border-sidebar-border bg-sidebar-background px-1 py-0 font-mono text-[10px] text-sidebar-foreground/50">
        ⌘K
      </span>
    </button>
  );
}
