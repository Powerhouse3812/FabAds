import { ParentNavigationRail } from "./ParentNavigationRail";
import { SecondaryNavigationPanel } from "./SecondaryNavigationPanel";

/**
 * AppShell — V7 ClickUp Strict.
 *
 * A-10.6 (revised): rail + panel are SEPARATE floating cards (like before),
 * not fused into one frame. Each owns its own m-2/rounded/shadow. The
 * natural gap between them (rail's mr-1 + panel's ml-1 + ring) is the
 * visible separation.
 *
 * Per Maalik: "parent nav ko bi floating style me rakhna hai, and right
 * side ko bhi floating eme hi rakhna hai, like before."
 *
 * Sub-panel is conditional — when active module has no sub-items, it
 * returns null and main content widens to fill.
 */
export function AppShell() {
  return (
    <>
      <ParentNavigationRail />
      <SecondaryNavigationPanel />
    </>
  );
}
